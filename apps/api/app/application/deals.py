import secrets
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.domain.deals.enums import OfferStatus, TransactionStatus
from app.domain.deals.pricing import offer_total
from app.domain.listings.enums import ListingStatus, QuantityUnit
from app.domain.logistics.enums import ShipmentStatus
from app.domain.organizations.roles import MarketRole
from app.infrastructure.db.models import (
    Listing,
    Message,
    Offer,
    Shipment,
    Thread,
    Transaction,
    User,
)


class NotAllowed(Exception):
    pass


class InvalidState(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def _now() -> datetime:
    return datetime.now(UTC)


def lock(db: Session, row: object) -> None:
    """Take a row lock for the rest of the transaction and reload the row's current state.

    Locks only the row itself: a plain `with_for_update` would also try to lock the
    outer-joined relationships, which Postgres refuses.
    """
    model = type(row)
    db.execute(select(model.id).where(model.id == row.id).with_for_update())
    db.refresh(row)


def _company_ids(user: User) -> set[uuid.UUID]:
    return {m.company_id for m in user.memberships}


def acting_company(user: User, thread: Thread) -> uuid.UUID:
    """The side of the thread `user` speaks for. Raises NotAllowed for outsiders."""
    mine = _company_ids(user)
    sides = [c for c in (thread.buyer_company_id, thread.seller_company_id) if c in mine]
    if len(sides) != 1:
        raise NotAllowed
    return sides[0]


def start_thread(
    db: Session, user: User, *, listing_id: uuid.UUID, buyer_company_id: uuid.UUID, body: str
) -> Thread:
    membership = next((m for m in user.memberships if m.company_id == buyer_company_id), None)
    if membership is None or MarketRole.BUYER not in membership.company.market_roles:
        raise NotAllowed
    listing = db.get(Listing, listing_id)
    if listing is None or listing.status is not ListingStatus.PUBLISHED:
        raise InvalidState("La publicación no está disponible")
    if listing.company_id == buyer_company_id:
        raise InvalidState("No puedes negociar tu propia publicación")

    thread = db.scalar(
        select(Thread).where(
            Thread.listing_id == listing_id, Thread.buyer_company_id == buyer_company_id
        )
    )
    if thread is None:
        thread = Thread(
            listing=listing,
            buyer_company_id=buyer_company_id,
            seller_company_id=listing.company_id,
            last_activity_at=_now(),
        )
        db.add(thread)
        db.flush()
    _add_message(db, user, thread, buyer_company_id, body)
    db.commit()
    return thread


def _add_message(db: Session, user: User, thread: Thread, company_id: uuid.UUID, body: str):
    db.add(
        Message(
            thread_id=thread.id,
            sender_user_id=user.id,
            sender_company_id=company_id,
            body=body.strip(),
        )
    )
    thread.last_activity_at = _now()


def threads_of(db: Session, user: User) -> list[Thread]:
    mine = _company_ids(user)
    stmt = (
        select(Thread)
        .where(or_(Thread.buyer_company_id.in_(mine), Thread.seller_company_id.in_(mine)))
        .order_by(Thread.last_activity_at.desc())
    )
    return list(db.scalars(stmt).unique())


def get_thread(db: Session, user: User, thread_id: uuid.UUID) -> Thread | None:
    thread = db.get(Thread, thread_id)
    if thread is None:
        return None
    try:
        acting_company(user, thread)
    except NotAllowed:
        return None
    expire_offers(db, thread)
    return thread


def expire_offers(db: Session, thread: Thread) -> None:
    """Pending offers past their validity are declined lazily, whenever the thread is read."""
    changed = False
    for offer in thread.offers:
        if offer.status is OfferStatus.PENDING and offer.valid_until <= _now():
            offer.status = OfferStatus.DECLINED
            offer.responded_at = offer.valid_until
            changed = True
    if changed:
        db.commit()


def send_message(db: Session, user: User, thread: Thread, body: str) -> Message:
    company_id = acting_company(user, thread)
    _add_message(db, user, thread, company_id, body)
    db.commit()
    return thread.messages[-1]


def send_offer(
    db: Session,
    user: User,
    thread: Thread,
    *,
    quantity: Decimal,
    price: Decimal,
    price_unit: QuantityUnit,
    valid_hours: int,
    notes: str | None,
) -> Offer:
    """Send a formal quote. A pending quote from the other side becomes countered."""
    company_id = acting_company(user, thread)
    if thread.listing.status is not ListingStatus.PUBLISHED:
        raise InvalidState("La publicación ya no está disponible")
    if quantity > thread.listing.quantity:
        raise InvalidState("La cantidad supera lo disponible en la publicación")
    for offer in thread.offers:
        if offer.status is OfferStatus.PENDING:
            if offer.from_company_id == company_id:
                raise InvalidState("Ya tienes una cotización pendiente en esta conversación")
            offer.status = OfferStatus.COUNTERED
            offer.responded_at = _now()
    offer = Offer(
        thread=thread,
        from_company_id=company_id,
        created_by_user_id=user.id,
        quantity=quantity,
        quantity_unit=thread.listing.quantity_unit,
        price=price,
        price_unit=price_unit,
        notes=notes,
        valid_until=_now() + timedelta(hours=valid_hours),
    )
    db.add(offer)
    thread.last_activity_at = _now()
    db.commit()
    return offer


def _pending_offer_for_receiver(user: User, offer: Offer) -> Offer:
    company_id = acting_company(user, offer.thread)
    if offer.from_company_id == company_id:
        raise NotAllowed
    if offer.status is not OfferStatus.PENDING or offer.valid_until <= _now():
        raise InvalidState("La cotización ya no está vigente")
    return offer


def accept_offer(db: Session, user: User, offer: Offer) -> Transaction:
    """Close the deal. One-off listings lose the sold quantity and close when sold out.

    The listing and the offer are locked first, so two buyers accepting at the same time
    cannot both take the last tons, and a double click cannot accept the same offer twice.
    """
    thread = offer.thread
    listing = thread.listing
    lock(db, listing)
    lock(db, offer)
    _pending_offer_for_receiver(user, offer)
    if listing.status is not ListingStatus.PUBLISHED:
        raise InvalidState("La publicación ya no está disponible")
    if offer.quantity > listing.quantity:
        raise InvalidState("Ya no queda suficiente material en la publicación")
    if not listing.is_recurring:
        listing.quantity -= offer.quantity
        if listing.quantity <= 0:
            listing.status = ListingStatus.ARCHIVED
    offer.status = OfferStatus.ACCEPTED
    offer.responded_at = _now()
    transaction = Transaction(
        code=f"ORD-{secrets.token_hex(3).upper()}",
        offer_id=offer.id,
        listing_id=thread.listing_id,
        buyer_company_id=thread.buyer_company_id,
        seller_company_id=thread.seller_company_id,
        quantity=offer.quantity,
        quantity_unit=offer.quantity_unit,
        price=offer.price,
        price_unit=offer.price_unit,
        total=offer_total(offer.quantity, offer.quantity_unit, offer.price, offer.price_unit),
    )
    db.add(transaction)
    thread.last_activity_at = _now()
    db.commit()
    return transaction


def decline_offer(db: Session, user: User, offer: Offer) -> Offer:
    lock(db, offer)
    _pending_offer_for_receiver(user, offer)
    offer.status = OfferStatus.DECLINED
    offer.responded_at = _now()
    db.commit()
    return offer


def get_offer(db: Session, user: User, offer_id: uuid.UUID) -> Offer | None:
    offer = db.get(Offer, offer_id)
    if offer is None or get_thread(db, user, offer.thread_id) is None:
        return None
    return offer


def transactions_of(db: Session, user: User) -> list[Transaction]:
    mine = _company_ids(user)
    stmt = (
        select(Transaction)
        .where(or_(Transaction.buyer_company_id.in_(mine), Transaction.seller_company_id.in_(mine)))
        .order_by(Transaction.created_at.desc())
    )
    return list(db.scalars(stmt).unique())


def get_transaction(db: Session, user: User, transaction_id: uuid.UUID) -> Transaction | None:
    transaction = db.get(Transaction, transaction_id)
    mine = _company_ids(user)
    if (
        transaction is None
        or not {
            transaction.buyer_company_id,
            transaction.seller_company_id,
        }
        & mine
    ):
        return None
    return transaction


def confirm_receipt(db: Session, user: User, transaction: Transaction) -> Transaction:
    """The buyer closes the deal once the material arrived (or was picked up).

    With a shipment under way, only after the transporter marked it delivered.
    """
    if transaction.buyer_company_id not in _company_ids(user):
        raise NotAllowed
    lock(db, transaction)
    if transaction.status is TransactionStatus.COMPLETED:
        raise InvalidState("La orden ya está cerrada")
    shipment = db.scalar(select(Shipment).where(Shipment.transaction_id == transaction.id))
    if shipment is not None and shipment.status is not ShipmentStatus.DELIVERED:
        raise InvalidState("El transportador aún no ha marcado la entrega")
    transaction.status = TransactionStatus.COMPLETED
    transaction.completed_at = _now()
    db.commit()
    return transaction
