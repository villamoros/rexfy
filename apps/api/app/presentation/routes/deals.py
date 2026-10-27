import uuid

from fastapi import APIRouter, HTTPException, status

from app.application import deals as service
from app.domain.deals.enums import OfferStatus
from app.domain.deals.pricing import offer_total
from app.infrastructure.db.models import Offer, Thread, Transaction, User
from app.presentation.deps import CurrentUser, DbSession
from app.presentation.schemas.deals import (
    CompanyRef,
    ListingRef,
    MessageCreate,
    MessageOut,
    OfferCreate,
    OfferOut,
    ThreadDetail,
    ThreadStart,
    ThreadSummary,
    TransactionOut,
)

router = APIRouter(tags=["negotiation"])

_FORBIDDEN = HTTPException(status.HTTP_403_FORBIDDEN, "No puedes hacer esto en esta negociación")


def _conflict(exc: service.InvalidState) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, exc.message)


def _offer_out(offer: Offer) -> OfferOut:
    total = offer_total(offer.quantity, offer.quantity_unit, offer.price, offer.price_unit)
    fields = {name: getattr(offer, name) for name in OfferOut.model_fields if name != "total"}
    return OfferOut.model_validate({**fields, "total": total})


def _detail(db: DbSession, user: User, thread: Thread) -> ThreadDetail:
    accepted = next((o for o in thread.offers if o.status is OfferStatus.ACCEPTED), None)
    transaction = (
        db.query(Transaction).filter(Transaction.offer_id == accepted.id).one_or_none()
        if accepted
        else None
    )
    return ThreadDetail(
        id=thread.id,
        listing=ListingRef.model_validate(thread.listing),
        buyer=CompanyRef.model_validate(thread.buyer),
        seller=CompanyRef.model_validate(thread.seller),
        my_company_id=service.acting_company(user, thread),
        messages=[
            MessageOut(
                id=m.id,
                body=m.body,
                sender_name=m.sender.full_name,
                sender_company_id=m.sender_company_id,
                created_at=m.created_at,
            )
            for m in thread.messages
        ],
        offers=[_offer_out(o) for o in thread.offers],
        transaction_id=transaction.id if transaction else None,
    )


def _transaction_out(user: User, transaction: Transaction) -> TransactionOut:
    mine = {m.company_id for m in user.memberships}
    role = "buyer" if transaction.buyer_company_id in mine else "seller"
    return TransactionOut.model_validate(transaction).model_copy(update={"my_role": role})


def _load_thread(db: DbSession, user: User, thread_id: uuid.UUID) -> Thread:
    thread = service.get_thread(db, user, thread_id)
    if thread is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversación no encontrada")
    return thread


def _load_offer(db: DbSession, user: User, offer_id: uuid.UUID) -> Offer:
    offer = service.get_offer(db, user, offer_id)
    if offer is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cotización no encontrada")
    return offer


def _load_transaction(db: DbSession, user: User, transaction_id: uuid.UUID) -> Transaction:
    transaction = service.get_transaction(db, user, transaction_id)
    if transaction is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada")
    return transaction


@router.post("/threads", status_code=status.HTTP_201_CREATED)
def start(body: ThreadStart, db: DbSession, user: CurrentUser) -> ThreadDetail:
    try:
        thread = service.start_thread(
            db,
            user,
            listing_id=body.listing_id,
            buyer_company_id=body.company_id,
            body=body.body,
        )
    except service.NotAllowed:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Solo empresas compradoras de las que eres miembro"
        ) from None
    except service.InvalidState as exc:
        raise _conflict(exc) from None
    db.refresh(thread)
    return _detail(db, user, thread)


@router.get("/threads")
def list_threads(db: DbSession, user: CurrentUser) -> list[ThreadSummary]:
    summaries = []
    for thread in service.threads_of(db, user):
        try:
            mine = service.acting_company(user, thread)
        except service.NotAllowed:
            continue
        pending = next((o for o in thread.offers if o.status is OfferStatus.PENDING), None)
        summaries.append(
            ThreadSummary(
                id=thread.id,
                listing=ListingRef.model_validate(thread.listing),
                counterpart=CompanyRef.model_validate(
                    thread.seller if mine == thread.buyer_company_id else thread.buyer
                ),
                my_company_id=mine,
                last_message=thread.messages[-1].body if thread.messages else None,
                last_activity_at=thread.last_activity_at,
                pending_offer_from_me=(pending.from_company_id == mine) if pending else None,
            )
        )
    return summaries


@router.get("/threads/{thread_id}")
def read_thread(thread_id: uuid.UUID, db: DbSession, user: CurrentUser) -> ThreadDetail:
    return _detail(db, user, _load_thread(db, user, thread_id))


@router.post("/threads/{thread_id}/messages", status_code=status.HTTP_201_CREATED)
def post_message(
    thread_id: uuid.UUID, body: MessageCreate, db: DbSession, user: CurrentUser
) -> ThreadDetail:
    thread = _load_thread(db, user, thread_id)
    service.send_message(db, user, thread, body.body)
    return _detail(db, user, thread)


@router.post("/threads/{thread_id}/offers", status_code=status.HTTP_201_CREATED)
def post_offer(
    thread_id: uuid.UUID, body: OfferCreate, db: DbSession, user: CurrentUser
) -> ThreadDetail:
    thread = _load_thread(db, user, thread_id)
    try:
        service.send_offer(db, user, thread, **body.model_dump())
    except service.InvalidState as exc:
        raise _conflict(exc) from None
    db.refresh(thread)
    return _detail(db, user, thread)


@router.post("/offers/{offer_id}/accept")
def accept(offer_id: uuid.UUID, db: DbSession, user: CurrentUser) -> TransactionOut:
    offer = _load_offer(db, user, offer_id)
    try:
        transaction = service.accept_offer(db, user, offer)
    except service.NotAllowed:
        raise _FORBIDDEN from None
    except service.InvalidState as exc:
        raise _conflict(exc) from None
    return _transaction_out(user, transaction)


@router.post("/offers/{offer_id}/decline")
def decline(offer_id: uuid.UUID, db: DbSession, user: CurrentUser) -> OfferOut:
    offer = _load_offer(db, user, offer_id)
    try:
        offer = service.decline_offer(db, user, offer)
    except service.NotAllowed:
        raise _FORBIDDEN from None
    except service.InvalidState as exc:
        raise _conflict(exc) from None
    return _offer_out(offer)


@router.get("/transactions")
def list_transactions(db: DbSession, user: CurrentUser) -> list[TransactionOut]:
    return [_transaction_out(user, t) for t in service.transactions_of(db, user)]


@router.get("/transactions/{transaction_id}")
def read_transaction(transaction_id: uuid.UUID, db: DbSession, user: CurrentUser) -> TransactionOut:
    return _transaction_out(user, _load_transaction(db, user, transaction_id))


@router.post("/transactions/{transaction_id}/confirm-receipt")
def confirm(transaction_id: uuid.UUID, db: DbSession, user: CurrentUser) -> TransactionOut:
    transaction = _load_transaction(db, user, transaction_id)
    try:
        transaction = service.confirm_receipt(db, user, transaction)
    except service.NotAllowed:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Solo el comprador confirma la recepción"
        ) from None
    except service.InvalidState as exc:
        raise _conflict(exc) from None
    return _transaction_out(user, transaction)
