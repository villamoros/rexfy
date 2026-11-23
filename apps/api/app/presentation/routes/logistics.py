import uuid

from fastapi import APIRouter, HTTPException, status

from app.application import deals as deals_service
from app.application import idempotency
from app.application import logistics as service
from app.application.commands import AdvanceShipment, RequestShipment, SubmitTransportQuote
from app.infrastructure.db.models import Shipment, User
from app.presentation.deps import CurrentUser, DbSession, IdempotencyKey, PageParams, UnitOfWork
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
from app.presentation.schemas.pagination import CursorPage

router = APIRouter(tags=["logistics"])

_FORBIDDEN = HTTPException(status.HTTP_403_FORBIDDEN, "No puedes hacer esto en este envío")


def _conflict(exc: deals_service.InvalidState | idempotency.Conflict) -> HTTPException:
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
    transaction_id: uuid.UUID,
    body: ShipmentRequest,
    uow: UnitOfWork,
    user: CurrentUser,
    idempotency_key: IdempotencyKey,
) -> ShipmentOut:
    db = uow.session
    transaction = deals_service.get_transaction(db, user, transaction_id)
    if transaction is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada")
    try:
        shipment = service.request_shipment(
            db,
            user,
            transaction,
            RequestShipment(**body.model_dump()),
            idempotency_key=idempotency_key,
            request_hash=idempotency.fingerprint(
                {"transaction_id": transaction_id, **body.model_dump(mode="json")}
            ),
        )
    except (deals_service.InvalidState, idempotency.Conflict) as exc:
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
def open_requests(db: DbSession, user: CurrentUser, page: PageParams) -> CursorPage[ShipmentOut]:
    try:
        shipments = service.open_requests(db, user, page)
        return CursorPage(
            items=[_out(user, shipment) for shipment in shipments.items],
            next_cursor=shipments.next_cursor,
        )
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
def my_shipments(db: DbSession, user: CurrentUser, page: PageParams) -> CursorPage[ShipmentOut]:
    shipments = service.assigned_to(db, user, page)
    return CursorPage(
        items=[_out(user, shipment) for shipment in shipments.items],
        next_cursor=shipments.next_cursor,
    )


@router.get("/shipments/{shipment_id}")
def read(shipment_id: uuid.UUID, db: DbSession, user: CurrentUser) -> ShipmentOut:
    return _out(user, _load(db, user, shipment_id))


@router.post("/shipments/{shipment_id}/quotes", status_code=status.HTTP_201_CREATED)
def quote(
    shipment_id: uuid.UUID,
    body: QuoteCreate,
    uow: UnitOfWork,
    user: CurrentUser,
    idempotency_key: IdempotencyKey,
) -> ShipmentOut:
    db = uow.session
    shipment = _load(db, user, shipment_id)
    try:
        service.submit_quote(
            db,
            user,
            shipment,
            SubmitTransportQuote(**body.model_dump()),
            idempotency_key=idempotency_key,
            request_hash=idempotency.fingerprint(
                {"shipment_id": shipment_id, **body.model_dump(mode="json")}
            ),
        )
    except deals_service.NotAllowed:
        raise _FORBIDDEN from None
    except (deals_service.InvalidState, idempotency.Conflict) as exc:
        raise _conflict(exc) from None
    db.refresh(shipment)
    return _out(user, shipment)


@router.post("/transport-quotes/{quote_id}/accept")
def accept(quote_id: uuid.UUID, uow: UnitOfWork, user: CurrentUser) -> ShipmentOut:
    db = uow.session
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
    shipment_id: uuid.UUID,
    body: EventCreate,
    uow: UnitOfWork,
    user: CurrentUser,
    idempotency_key: IdempotencyKey,
) -> ShipmentOut:
    db = uow.session
    shipment = _load(db, user, shipment_id)
    try:
        service.advance(
            db,
            user,
            shipment,
            AdvanceShipment(status=body.status, note=body.note),
            idempotency_key=idempotency_key,
            request_hash=idempotency.fingerprint(
                {
                    "shipment_id": shipment_id,
                    "status": body.status,
                    "note": body.note,
                }
            ),
        )
    except deals_service.NotAllowed:
        raise _FORBIDDEN from None
    except (deals_service.InvalidState, idempotency.Conflict) as exc:
        raise _conflict(exc) from None
    db.refresh(shipment)
    return _out(user, shipment)
