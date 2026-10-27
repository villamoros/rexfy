import uuid

from fastapi import APIRouter, HTTPException, status

from app.application import deals as deals_service
from app.application import logistics as service
from app.infrastructure.db.models import Shipment, User
from app.presentation.deps import CurrentUser, DbSession
from app.presentation.schemas.deals import CompanyRef
from app.presentation.schemas.logistics import (
    EventCreate,
    EventOut,
    OrderRef,
    QuoteCreate,
    QuoteOut,
    ShipmentOut,
    ShipmentRequest,
)

router = APIRouter(tags=["logistics"])

_FORBIDDEN = HTTPException(status.HTTP_403_FORBIDDEN, "No puedes hacer esto en este envío")


def _conflict(exc: deals_service.InvalidState) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, exc.message)


def _out(user: User, shipment: Shipment) -> ShipmentOut:
    rel = service.relation(user, shipment) or ""
    mine = {m.company_id for m in user.memberships}
    order = shipment.transaction
    quotes = (
        shipment.quotes
        if rel == "party"
        else [q for q in shipment.quotes if q.transporter_company_id in mine]
    )
    # Bidders get what they need to quote (route, dates, load), not who is trading.
    sees_addresses = rel in ("party", "transporter")
    return ShipmentOut(
        id=shipment.id,
        status=shipment.status,
        order=OrderRef(
            id=order.id,
            code=order.code,
            listing_title=order.listing.title,
            quantity=float(order.quantity),
            quantity_unit=order.quantity_unit,
            buyer=CompanyRef.model_validate(order.buyer) if sees_addresses else None,
            seller=CompanyRef.model_validate(order.seller) if sees_addresses else None,
        ),
        pickup_city=shipment.pickup_city,
        delivery_city=shipment.delivery_city,
        pickup_address=shipment.pickup_address if sees_addresses else None,
        delivery_address=shipment.delivery_address if sees_addresses else None,
        vehicle_type=shipment.vehicle_type,
        pickup_date=shipment.pickup_date,
        requirements=shipment.requirements,
        transporter=CompanyRef.model_validate(shipment.transporter)
        if shipment.transporter
        else None,
        quotes=[QuoteOut.model_validate(q) for q in quotes],
        events=[EventOut.model_validate(e) for e in shipment.events] if sees_addresses else [],
        my_relation=rel,
    )


def _load(db: DbSession, user: User, shipment_id: uuid.UUID) -> Shipment:
    shipment = service.get_shipment(db, user, shipment_id)
    if shipment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Envío no encontrado")
    return shipment


@router.post("/transactions/{transaction_id}/shipment", status_code=status.HTTP_201_CREATED)
def request(
    transaction_id: uuid.UUID, body: ShipmentRequest, db: DbSession, user: CurrentUser
) -> ShipmentOut:
    transaction = deals_service.get_transaction(db, user, transaction_id)
    if transaction is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada")
    try:
        shipment = service.request_shipment(db, user, transaction, **body.model_dump())
    except deals_service.InvalidState as exc:
        raise _conflict(exc) from None
    return _out(user, shipment)


@router.get("/transactions/{transaction_id}/shipment")
def for_transaction(transaction_id: uuid.UUID, db: DbSession, user: CurrentUser) -> ShipmentOut:
    transaction = deals_service.get_transaction(db, user, transaction_id)
    shipment = service.shipment_for_transaction(db, transaction) if transaction else None
    if shipment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Esta orden no tiene transporte")
    return _out(user, shipment)


@router.get("/logistics/requests")
def open_requests(db: DbSession, user: CurrentUser) -> list[ShipmentOut]:
    try:
        return [_out(user, s) for s in service.open_requests(db, user)]
    except deals_service.NotAllowed:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Solo para empresas transportadoras"
        ) from None
    except service.NotVerified:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Tu empresa transportadora debe estar verificada para ver solicitudes",
        ) from None


@router.get("/logistics/shipments")
def my_shipments(db: DbSession, user: CurrentUser) -> list[ShipmentOut]:
    return [_out(user, s) for s in service.assigned_to(db, user)]


@router.get("/shipments/{shipment_id}")
def read(shipment_id: uuid.UUID, db: DbSession, user: CurrentUser) -> ShipmentOut:
    return _out(user, _load(db, user, shipment_id))


@router.post("/shipments/{shipment_id}/quotes", status_code=status.HTTP_201_CREATED)
def quote(
    shipment_id: uuid.UUID, body: QuoteCreate, db: DbSession, user: CurrentUser
) -> ShipmentOut:
    shipment = _load(db, user, shipment_id)
    try:
        service.submit_quote(db, user, shipment, **body.model_dump())
    except deals_service.NotAllowed:
        raise _FORBIDDEN from None
    except deals_service.InvalidState as exc:
        raise _conflict(exc) from None
    db.refresh(shipment)
    return _out(user, shipment)


@router.post("/transport-quotes/{quote_id}/accept")
def accept(quote_id: uuid.UUID, db: DbSession, user: CurrentUser) -> ShipmentOut:
    found = service.get_quote(db, user, quote_id)
    if found is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cotización no encontrada")
    try:
        shipment = service.accept_quote(db, user, found)
    except deals_service.NotAllowed:
        raise _FORBIDDEN from None
    except deals_service.InvalidState as exc:
        raise _conflict(exc) from None
    db.refresh(shipment)
    return _out(user, shipment)


@router.post("/shipments/{shipment_id}/events", status_code=status.HTTP_201_CREATED)
def add_event(
    shipment_id: uuid.UUID, body: EventCreate, db: DbSession, user: CurrentUser
) -> ShipmentOut:
    shipment = _load(db, user, shipment_id)
    try:
        service.advance(db, user, shipment, body.status, body.note)
    except deals_service.NotAllowed:
        raise _FORBIDDEN from None
    except deals_service.InvalidState as exc:
        raise _conflict(exc) from None
    db.refresh(shipment)
    return _out(user, shipment)
