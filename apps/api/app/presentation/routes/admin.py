import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.application import admin as service
from app.application import audit
from app.domain.listings.enums import ListingStatus
from app.infrastructure.db.models import Company
from app.presentation.deps import AdminUser, DbSession
from app.presentation.schemas.admin import AdminCompany, AuditEntry, TakeDown
from app.presentation.schemas.listings import ListingOut
from app.presentation.schemas.organizations import CompanyOut

router = APIRouter(prefix="/admin", tags=["admin"])


def _company_out(company: Company, members: int) -> AdminCompany:
    return AdminCompany(**CompanyOut.model_validate(company).model_dump(), members=members)


def _load_company(db: DbSession, company_id: uuid.UUID) -> Company:
    company = service.get_company(db, company_id)
    if company is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa no encontrada")
    return company


@router.get("/companies")
def companies(db: DbSession, _: AdminUser, verified: bool | None = None) -> list[AdminCompany]:
    return [_company_out(c, n) for c, n in service.companies(db, verified=verified)]


@router.post("/companies/{company_id}/verify")
def verify(company_id: uuid.UUID, db: DbSession, admin: AdminUser) -> CompanyOut:
    company = service.set_verified(db, admin, _load_company(db, company_id), True)
    return CompanyOut.model_validate(company)


@router.post("/companies/{company_id}/unverify")
def unverify(company_id: uuid.UUID, db: DbSession, admin: AdminUser) -> CompanyOut:
    company = service.set_verified(db, admin, _load_company(db, company_id), False)
    return CompanyOut.model_validate(company)


@router.get("/listings")
def listings(
    db: DbSession,
    _: AdminUser,
    listing_status: Annotated[ListingStatus | None, Query(alias="status")] = None,
) -> list[ListingOut]:
    return [ListingOut.model_validate(i) for i in service.listings(db, status=listing_status)]


@router.post("/listings/{listing_id}/take-down")
def take_down(listing_id: uuid.UUID, body: TakeDown, db: DbSession, admin: AdminUser) -> ListingOut:
    listing = service.get_listing(db, listing_id)
    if listing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Publicación no encontrada")
    return ListingOut.model_validate(service.take_down(db, admin, listing, body.reason))


@router.get("/audit")
def audit_log(
    db: DbSession,
    _: AdminUser,
    entity_id: uuid.UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[AuditEntry]:
    return [
        AuditEntry(
            id=e.id,
            created_at=e.created_at,
            actor_name=e.actor.full_name if e.actor else None,
            company_id=e.company_id,
            action=e.action,
            entity_type=e.entity_type,
            entity_id=e.entity_id,
            data=e.data,
        )
        for e in audit.recent(db, limit=limit, entity_id=entity_id)
    ]
