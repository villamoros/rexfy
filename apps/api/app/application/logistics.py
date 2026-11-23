import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application import analytics, audit, idempotency
from app.application.commands import AdvanceShipment, RequestShipment, SubmitTransportQuote
from app.application.deals import InvalidState, NotAllowed, lock
from app.application.notifications import notify
from app.application.organizations import membership
from app.application.pagination import Page, PageRequest, paginate
from app.domain.deals.enums import TransactionStatus
from app.domain.deals.state_machine import (
    InvalidTransition as InvalidTransactionTransition,
)
from app.domain.deals.state_machine import (
    require_transaction_transition,
)
from app.domain.logistics.enums import QuoteStatus, ShipmentStatus
from app.domain.logistics.state_machine import (
    InvalidTransition as InvalidShipmentTransition,
)
from app.domain.logistics.state_machine import (
    require_shipment_transition,
)
from app.domain.organizations.roles import MarketRole
from app.domain.product.events import ProductEventName
from app.infrastructure.db.models import (
    Company,
    Shipment,
    ShipmentEvent,
    Transaction,
    TransportQuote,
    User,
)

_STATUS_LABEL = {
    ShipmentStatus.PICKED_UP: "material recogido",
    ShipmentStatus.IN_TRANSIT: "en ruta",
    ShipmentStatus.DELIVERED: "entregado",
}

# How a shipment status moves its order forward.
_ORDER_STATUS = {
    ShipmentStatus.PICKED_UP: TransactionStatus.IN_TRANSIT,
    ShipmentStatus.IN_TRANSIT: TransactionStatus.IN_TRANSIT,
    ShipmentStatus.DELIVERED: TransactionStatus.DELIVERED,
}


def _company_ids(user: User) -> set[uuid.UUID]:
    return {m.company_id for m in user.memberships}


def _transporter_ids(user: User, *, verified: bool = False) -> set[uuid.UUID]:
    """The user's transporter companies; with `verified`, only those RexFy has verified."""
    return {
        m.company_id
        for m in user.memberships
        if MarketRole.TRANSPORTER in m.company.market_roles
        and (m.company.is_verified or not verified)
    }


class NotVerified(Exception):
    pass


def _parties(shipment: Shipment) -> set[uuid.UUID]:
    t = shipment.transaction
    return {t.buyer_company_id, t.seller_company_id}


def relation(user: User, shipment: Shipment) -> str | None:
    """How `user` relates to a shipment: party, transporter (assigned), bidder or None."""
    mine = _company_ids(user)
    if _parties(shipment) & mine:
        return "party"
    if shipment.transporter_company_id in mine:
        return "transporter"
    if shipment.status is ShipmentStatus.REQUESTED and _transporter_ids(user, verified=True):
        return "bidder"
    return None


def _event(db: Session, user: User, shipment: Shipment, status: ShipmentStatus, note: str | None):
    event = ShipmentEvent(shipment=shipment, status=status, note=note, created_by_user_id=user.id)
    db.add(event)
    return event


def request_shipment(
    db: Session,
    user: User,
    transaction: Transaction,
    command: RequestShipment,
    *,
    idempotency_key: str,
    request_hash: str,
) -> Shipment:
    mine = _company_ids(user) & {transaction.buyer_company_id, transaction.seller_company_id}
    if not mine:
        raise NotAllowed
    previous = idempotency.find(
        db,
        user,
        scope="shipments.request",
        key=idempotency_key,
        request_hash=request_hash,
    )
    if previous:
        return idempotency.replay(db, previous, Shipment)
    lock(db, transaction)
    if transaction.status is not TransactionStatus.AGREED:
        raise InvalidState("La orden ya no está esperando transporte")
    if db.scalar(select(Shipment.id).where(Shipment.transaction_id == transaction.id)):
        raise InvalidState("Esta orden ya tiene una solicitud de transporte")
    shipment = Shipment(
        transaction=transaction,
        requested_by_company_id=next(iter(mine)),
        pickup_city=command.pickup_city.strip(),
        pickup_address=command.pickup_address.strip(),
        delivery_city=command.delivery_city.strip(),
        delivery_address=command.delivery_address.strip(),
        vehicle_type=command.vehicle_type,
        pickup_date=command.pickup_date,
        requirements=command.requirements,
    )
    db.add(shipment)
    _event(db, user, shipment, ShipmentStatus.REQUESTED, None)
    audit.record(
        db, user, "shipment.requested", shipment, company_id=shipment.requested_by_company_id
    )
    idempotency.remember(
        db,
        user,
        scope="shipments.request",
        key=idempotency_key,
        request_hash=request_hash,
        resource=shipment,
    )
    return shipment


def shipment_for_transaction(db: Session, transaction: Transaction) -> Shipment | None:
    return db.scalar(select(Shipment).where(Shipment.transaction_id == transaction.id))


def get_shipment(db: Session, user: User, shipment_id: uuid.UUID) -> Shipment | None:
    shipment = db.get(Shipment, shipment_id)
    if shipment is None or relation(user, shipment) is None:
        return None
    return shipment


def open_requests(db: Session, user: User, page: PageRequest) -> Page[Shipment]:
    """Requests a transporter can quote: still open and not for their own orders.

    Only verified transporters see them, since they reveal who trades what and where.
    """
    if not _transporter_ids(user):
        raise NotAllowed
    if not _transporter_ids(user, verified=True):
        raise NotVerified
    mine = _company_ids(user)
    stmt = select(Shipment).where(Shipment.status == ShipmentStatus.REQUESTED)
    result = paginate(db, stmt, page, model=Shipment)
    return Page(
        items=[shipment for shipment in result.items if not _parties(shipment) & mine],
        next_cursor=result.next_cursor,
    )


def assigned_to(db: Session, user: User, page: PageRequest) -> Page[Shipment]:
    stmt = select(Shipment).where(Shipment.transporter_company_id.in_(_transporter_ids(user)))
    return paginate(db, stmt, page, model=Shipment)


def submit_quote(
    db: Session,
    user: User,
    shipment: Shipment,
    command: SubmitTransportQuote,
    *,
    idempotency_key: str,
    request_hash: str,
) -> TransportQuote:
    if command.company_id not in _transporter_ids(
        user, verified=True
    ) or command.company_id in _parties(shipment):
        raise NotAllowed
    previous = idempotency.find(
        db,
        user,
        scope="transport_quotes.submit",
        key=idempotency_key,
        request_hash=request_hash,
    )
    if previous:
        return idempotency.replay(db, previous, TransportQuote)
    lock(db, shipment)
    db.refresh(shipment, attribute_names=["quotes", "transaction"])
    if shipment.status is not ShipmentStatus.REQUESTED:
        raise InvalidState("Esta solicitud ya tiene transportador asignado")
    if any(q.transporter_company_id == command.company_id for q in shipment.quotes):
        raise InvalidState("Tu empresa ya cotizó esta solicitud")
    if command.delivery_date < command.pickup_date:
        raise InvalidState("La entrega no puede ser antes de la recogida")
    quote = TransportQuote(
        shipment=shipment,
        transporter_company_id=command.company_id,
        price=command.price,
        pickup_date=command.pickup_date,
        delivery_date=command.delivery_date,
        includes_insurance=command.includes_insurance,
        notes=command.notes,
    )
    db.add(quote)
    t = shipment.transaction
    notify(
        db,
        shipment.requested_by_company_id,
        kind="transport_quote",
        title="Nueva cotización de transporte",
        body=(
            f"Orden {t.code}: {shipment.pickup_city} → {shipment.delivery_city}, "
            f"${command.price:,.0f}"
        ),
        link=f"/ordenes/{t.id}",
    )
    idempotency.remember(
        db,
        user,
        scope="transport_quotes.submit",
        key=idempotency_key,
        request_hash=request_hash,
        resource=quote,
    )
    return quote


def get_quote(db: Session, user: User, quote_id: uuid.UUID) -> TransportQuote | None:
    quote = db.get(TransportQuote, quote_id)
    if quote is None or get_shipment(db, user, quote.shipment_id) is None:
        return None
    return quote


def accept_quote(db: Session, user: User, quote: TransportQuote) -> Shipment:
    shipment = quote.shipment
    mine = _parties(shipment) & _company_ids(user)
    if not mine:
        raise NotAllowed
    if not any(membership(user, c).role.can_commit for c in mine):
        raise NotAllowed
    lock(db, shipment)
    if shipment.status is not ShipmentStatus.REQUESTED or quote.status is not QuoteStatus.PENDING:
        raise InvalidState("Esta cotización ya no se puede aceptar")
    for other in shipment.quotes:
        other.status = QuoteStatus.ACCEPTED if other.id == quote.id else QuoteStatus.REJECTED
    shipment.transporter_company_id = quote.transporter_company_id
    try:
        require_shipment_transition(shipment.status, ShipmentStatus.ASSIGNED)
    except InvalidShipmentTransition as exc:
        raise InvalidState(str(exc)) from exc
    shipment.status = ShipmentStatus.ASSIGNED
    _event(
        db,
        user,
        shipment,
        ShipmentStatus.ASSIGNED,
        f"Transportador: {quote.transporter.legal_name}",
    )
    audit.record(
        db,
        user,
        "transport_quote.accepted",
        quote,
        company_id=next(iter(_parties(shipment) & _company_ids(user))),
        price=quote.price,
    )
    notify(
        db,
        quote.transporter_company_id,
        kind="transport_assigned",
        title="Ganaste un viaje",
        body=f"{shipment.pickup_city} → {shipment.delivery_city}, recogida {shipment.pickup_date}",
        link="/transporte",
    )
    return shipment


def advance(
    db: Session,
    user: User,
    shipment: Shipment,
    command: AdvanceShipment,
    *,
    idempotency_key: str,
    request_hash: str,
) -> Shipment:
    """The assigned transporter moves the shipment forward, never backwards.

    "In transit" may be skipped on short trips, but nothing is delivered before pickup.
    """
    if shipment.transporter_company_id not in _company_ids(user):
        raise NotAllowed
    previous = idempotency.find(
        db,
        user,
        scope="shipments.advance",
        key=idempotency_key,
        request_hash=request_hash,
    )
    if previous:
        event = idempotency.replay(db, previous, ShipmentEvent)
        return event.shipment
    lock(db, shipment)
    try:
        require_shipment_transition(shipment.status, command.status)
    except InvalidShipmentTransition as exc:
        raise InvalidState(str(exc)) from exc
    shipment.status = command.status
    event = _event(db, user, shipment, command.status, command.note)
    order = shipment.transaction
    if order.status is not TransactionStatus.COMPLETED:
        next_order_status = _ORDER_STATUS.get(command.status, order.status)
        if next_order_status is not order.status:
            try:
                require_transaction_transition(order.status, next_order_status)
            except InvalidTransactionTransition as exc:
                raise InvalidState(str(exc)) from exc
            order.status = next_order_status
    audit.record(
        db,
        user,
        "shipment.advanced",
        shipment,
        company_id=shipment.transporter_company_id,
        status=command.status,
    )
    if command.status is ShipmentStatus.DELIVERED:
        assert shipment.transporter_company_id is not None
        analytics.track(
            db,
            ProductEventName.SHIPMENT_DELIVERED,
            actor=user,
            entity=shipment,
            company=db.get(Company, shipment.transporter_company_id),
            role=MarketRole.TRANSPORTER.value,
            category=order.listing.category.value,
            properties={"order_id": str(order.id)},
        )
    for party in _parties(shipment):
        notify(
            db,
            party,
            kind="shipment",
            title=f"Envío de la orden {order.code}: {_STATUS_LABEL[command.status]}",
            body=command.note or "",
            link=f"/ordenes/{order.id}",
            email=command.status is ShipmentStatus.DELIVERED,
        )
    idempotency.remember(
        db,
        user,
        scope="shipments.advance",
        key=idempotency_key,
        request_hash=request_hash,
        resource=event,
    )
    return shipment
