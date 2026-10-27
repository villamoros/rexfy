import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.application import deals as deals_service
from app.application import trust as service
from app.domain.trust.enums import DisputeStatus
from app.infrastructure.db.models import Dispute, Transaction, User
from app.presentation.deps import AdminUser, CurrentUser, DbSession
from app.presentation.schemas.deals import CompanyRef
from app.presentation.schemas.listings import ListingOut
from app.presentation.schemas.trust import (
    AdminDisputeOut,
    CompanyProfile,
    DisputeCreate,
    DisputeOut,
    DisputeResolve,
    ReviewCreate,
    ReviewOut,
)

router = APIRouter(tags=["trust"])


def _order(db: DbSession, user: User, transaction_id: uuid.UUID) -> Transaction:
    transaction = deals_service.get_transaction(db, user, transaction_id)
    if transaction is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada")
    return transaction


def _admin_dispute(dispute: Dispute) -> AdminDisputeOut:
    t = dispute.transaction
    return AdminDisputeOut(
        **DisputeOut.model_validate(dispute).model_dump(),
        order_code=t.code,
        buyer=CompanyRef.model_validate(t.buyer),
        seller=CompanyRef.model_validate(t.seller),
    )


@router.post("/transactions/{transaction_id}/reviews", status_code=status.HTTP_201_CREATED)
def review(
    transaction_id: uuid.UUID, body: ReviewCreate, db: DbSession, user: CurrentUser
) -> ReviewOut:
    transaction = _order(db, user, transaction_id)
    try:
        created = service.leave_review(
            db, user, transaction, rating=body.rating, comment=body.comment
        )
    except deals_service.NotAllowed:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No puedes calificar esta orden") from None
    except deals_service.InvalidState as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, exc.message) from None
    return ReviewOut.model_validate(created)


@router.post("/transactions/{transaction_id}/disputes", status_code=status.HTTP_201_CREATED)
def open_dispute(
    transaction_id: uuid.UUID, body: DisputeCreate, db: DbSession, user: CurrentUser
) -> DisputeOut:
    transaction = _order(db, user, transaction_id)
    try:
        dispute = service.open_dispute(
            db, user, transaction, reason=body.reason, description=body.description
        )
    except deals_service.NotAllowed:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No puedes abrir esta disputa") from None
    except deals_service.InvalidState as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, exc.message) from None
    return DisputeOut.model_validate(dispute)


@router.get("/companies/{company_id}/profile")
def company_profile(company_id: uuid.UUID, db: DbSession) -> CompanyProfile:
    """Public trust profile: what any visitor can check before doing business."""
    found = service.profile(db, company_id)
    if found is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa no encontrada")
    c = found.company
    return CompanyProfile(
        id=c.id,
        legal_name=c.legal_name,
        city=c.city,
        market_roles=c.market_roles,
        is_verified=c.is_verified,
        member_since=c.created_at,
        trust_score=found.trust_score,
        average_rating=float(found.average_rating) if found.average_rating is not None else None,
        review_count=found.review_count,
        completed_orders=found.completed_orders,
        reviews=[ReviewOut.model_validate(r) for r in found.reviews],
        listings=[ListingOut.model_validate(i) for i in found.listings],
    )


@router.get("/admin/disputes", tags=["admin"])
def admin_disputes(
    db: DbSession,
    _: AdminUser,
    dispute_status: Annotated[DisputeStatus | None, Query(alias="status")] = None,
) -> list[AdminDisputeOut]:
    return [_admin_dispute(d) for d in service.disputes(db, status=dispute_status)]


@router.patch("/admin/disputes/{dispute_id}", tags=["admin"])
def resolve(
    dispute_id: uuid.UUID, body: DisputeResolve, db: DbSession, admin: AdminUser
) -> AdminDisputeOut:
    dispute = db.get(Dispute, dispute_id)
    if dispute is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Disputa no encontrada")
    try:
        dispute = service.resolve_dispute(
            db,
            admin,
            dispute,
            resolution=body.resolution,
            at_fault_company_id=body.at_fault_company_id,
        )
    except deals_service.InvalidState as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, exc.message) from None
    return _admin_dispute(dispute)
