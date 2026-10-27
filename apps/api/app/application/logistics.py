import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application.deals import InvalidState, NotAllowed
from app.domain.deals.enums import TransactionStatus
from app.domain.logistics.enums import SHIPMENT_FLOW, QuoteStatus, ShipmentStatus, VehicleType
from app.domain.organizations.roles import MarketRole
from app.infrastructure.db.models import (
    Shipment,
    ShipmentEvent,
    Transaction,
    TransportQuote,
    User,
)

# How a shipment status moves its order forward.
_ORDER_STATUS = {
    ShipmentStatus.PICKED_UP: TransactionStatus.IN_TRANSIT,
    ShipmentStatus.IN_TRANSIT: TransactionStatus.IN_TRANSIT,
    ShipmentStatus.DELIVERED: TransactionStatus.DELIVERED,
}


def _company_ids(user: User) -> set[uuid.UUID]:
    return {m.company_id for m in user.memberships}


def _transporter_ids(user: User) -> set[uuid.UUID]:
    return {
        m.company_id for m in user.memberships if MarketRole.TRANSPORTER in m.company.market_roles
    }


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
    if shipment.status is ShipmentStatus.REQUESTED and _transporter_ids(user):
        return "bidder"
    return None


def _event(db: Session, user: User, shipment: Shipment, status: ShipmentStatus, note: str | None):
    db.add(ShipmentEvent(shipment=shipment, status=status, note=note, created_by_user_id=user.id))


def request_shipment(
    db: Session,
    user: User,
    transaction: Transaction,
    *,
    pickup_city: str,
    pickup_address: str,
    delivery_city: str,
    delivery_address: str,
    vehicle_type: VehicleType,
    pickup_date: date,
    requirements: str | None,
) -> Shipment:
    mine = _company_ids(user) & {transaction.buyer_company_id, transaction.seller_company_id}
    if not mine:
        raise NotAllowed
    if transaction.status is not TransactionStatus.AGREED:
        raise InvalidState("La orden ya no está esperando transporte")
    if db.scalar(select(Shipment.id).where(Shipment.transaction_id == transaction.id)):
        raise InvalidState("Esta orden ya tiene una solicitud de transporte")
    shipment = Shipment(
        transaction=transaction,
        requested_by_company_id=next(iter(mine)),
        pickup_city=pickup_city.strip(),
        pickup_address=pickup_address.strip(),
        delivery_city=delivery_city.strip(),
        delivery_address=delivery_address.strip(),
        vehicle_type=vehicle_type,
        pickup_date=pickup_date,
        requirements=requirements,
    )
    db.add(shipment)
    _event(db, user, shipment, ShipmentStatus.REQUESTED, None)
    db.commit()
    return shipment


def shipment_for_transaction(db: Session, transaction: Transaction) -> Shipment | None:
    return db.scalar(select(Shipment).where(Shipment.transaction_id == transaction.id))


def get_shipment(db: Session, user: User, shipment_id: uuid.UUID) -> Shipment | None:
    shipment = db.get(Shipment, shipment_id)
    if shipment is None or relation(user, shipment) is None:
        return None
    return shipment


def open_requests(db: Session, user: User) -> list[Shipment]:
    """Requests a transporter can quote: still open and not for their own orders."""
    if not _transporter_ids(user):
        raise NotAllowed
    mine = _company_ids(user)
    stmt = (
        select(Shipment)
        .where(Shipment.status == ShipmentStatus.REQUESTED)
        .order_by(Shipment.pickup_date)
    )
    return [s for s in db.scalars(stmt).unique() if not _parties(s) & mine]


def assigned_to(db: Session, user: User) -> list[Shipment]:
    stmt = (
        select(Shipment)
        .where(Shipment.transporter_company_id.in_(_transporter_ids(user)))
        .order_by(Shipment.pickup_date.desc())
    )
    return list(db.scalars(stmt).unique())


def submit_quote(
    db: Session,
    user: User,
    shipment: Shipment,
    *,
    company_id: uuid.UUID,
    price: Decimal,
    pickup_date: date,
    delivery_date: date,
    includes_insurance: bool,
    notes: str | None,
) -> TransportQuote:
    if company_id not in _transporter_ids(user) or company_id in _parties(shipment):
        raise NotAllowed
    if shipment.status is not ShipmentStatus.REQUESTED:
        raise InvalidState("Esta solicitud ya tiene transportador asignado")
    if any(q.transporter_company_id == company_id for q in shipment.quotes):
        raise InvalidState("Tu empresa ya cotizó esta solicitud")
    if delivery_date < pickup_date:
        raise InvalidState("La entrega no puede ser antes de la recogida")
    quote = TransportQuote(
        shipment=shipment,
        transporter_company_id=company_id,
        price=price,
        pickup_date=pickup_date,
        delivery_date=delivery_date,
        includes_insurance=includes_insurance,
        notes=notes,
    )
    db.add(quote)
    db.commit()
    return quote


def get_quote(db: Session, user: User, quote_id: uuid.UUID) -> TransportQuote | None:
    quote = db.get(TransportQuote, quote_id)
    if quote is None or get_shipment(db, user, quote.shipment_id) is None:
        return None
    return quote


def accept_quote(db: Session, user: User, quote: TransportQuote) -> Shipment:
    shipment = quote.shipment
    if not _parties(shipment) & _company_ids(user):
        raise NotAllowed
    if shipment.status is not ShipmentStatus.REQUESTED or quote.status is not QuoteStatus.PENDING:
        raise InvalidState("Esta cotización ya no se puede aceptar")
    for other in shipment.quotes:
        other.status = QuoteStatus.ACCEPTED if other.id == quote.id else QuoteStatus.REJECTED
    shipment.transporter_company_id = quote.transporter_company_id
    shipment.status = ShipmentStatus.ASSIGNED
    _event(
        db,
        user,
        shipment,
        ShipmentStatus.ASSIGNED,
        f"Transportador: {quote.transporter.legal_name}",
    )
    db.commit()
    return shipment


def advance(
    db: Session, user: User, shipment: Shipment, status: ShipmentStatus, note: str | None
) -> Shipment:
    """The assigned transporter moves the shipment forward, never backwards."""
    if shipment.transporter_company_id not in _company_ids(user):
        raise NotAllowed
    if shipment.status not in SHIPMENT_FLOW or status not in SHIPMENT_FLOW:
        raise InvalidState("Estado de envío no válido")
    if SHIPMENT_FLOW.index(status) <= SHIPMENT_FLOW.index(shipment.status):
        raise InvalidState("El envío ya pasó por ese estado")
    shipment.status = status
    _event(db, user, shipment, status, note)
    order = shipment.transaction
    if order.status is not TransactionStatus.COMPLETED:
        order.status = _ORDER_STATUS.get(status, order.status)
    db.commit()
    return shipment
