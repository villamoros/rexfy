import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.application import admin as service
from app.application import analytics, audit, outbox
from app.application.dashboard import platform_kpis
from app.domain.listings.enums import ListingStatus, MaterialCategory
from app.domain.organizations.roles import MarketRole
from app.infrastructure.db.models import Company, OutboxEvent
from app.presentation.deps import AdminUser, DbSession, PageParams
from app.presentation.schemas.admin import (
    AdminCompany,
    AuditEntry,
    OutboxEventOut,
    OutboxHealthOut,
    TakeDown,
)
from app.presentation.schemas.dashboard import FunnelSnapshotOut, PlatformKpisOut
from app.presentation.schemas.listings import ListingOut
from app.presentation.schemas.organizations import CompanyOut
from app.presentation.schemas.pagination import CursorPage

router = APIRouter(prefix="/admin", tags=["admin"])


def _company_out(company: Company, members: int) -> AdminCompany:
    return AdminCompany(**CompanyOut.model_validate(company).model_dump(), members=members)


def _load_company(db: DbSession, company_id: uuid.UUID) -> Company:
    company = service.get_company(db, company_id)
    if company is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa no encontrada")
    return company


@router.get("/companies")
def companies(
    db: DbSession, _: AdminUser, page: PageParams, verified: bool | None = None
) -> CursorPage[AdminCompany]:
    companies_page = service.companies(db, page, verified=verified)
    return CursorPage(
        items=[_company_out(company, members) for company, members in companies_page.items],
        next_cursor=companies_page.next_cursor,
    )


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
    page: PageParams,
    listing_status: Annotated[ListingStatus | None, Query(alias="status")] = None,
) -> CursorPage[ListingOut]:
    listings_page = service.listings(db, page, status=listing_status)
    return CursorPage(
        items=[ListingOut.model_validate(listing) for listing in listings_page.items],
        next_cursor=listings_page.next_cursor,
    )


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
    page: PageParams,
    entity_id: uuid.UUID | None = None,
) -> CursorPage[AuditEntry]:
    entries = audit.recent(db, page, entity_id=entity_id)
    return CursorPage(
        items=[
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
            for e in entries.items
        ],
        next_cursor=entries.next_cursor,
    )


@router.get("/metrics")
def metrics(db: DbSession, _: AdminUser) -> PlatformKpisOut:
    return PlatformKpisOut.model_validate(platform_kpis(db))


@router.get("/funnel")
def product_funnel(
    db: DbSession,
    _: AdminUser,
    role: MarketRole | None = None,
    city: Annotated[str | None, Query(max_length=100)] = None,
    category: MaterialCategory | None = None,
    cohort_month: date | None = None,
) -> FunnelSnapshotOut:
    snapshot = analytics.funnel(
        db,
        role=role.value if role else None,
        city=city,
        category=category.value if category else None,
        cohort_month=cohort_month,
    )
    return FunnelSnapshotOut.model_validate(snapshot)


@router.get("/outbox/health")
def outbox_health(db: DbSession, _: AdminUser) -> OutboxHealthOut:
    return OutboxHealthOut.model_validate(outbox.health(db), from_attributes=True)


@router.get("/outbox")
def outbox_events(
    db: DbSession,
    _: AdminUser,
    page: PageParams,
) -> CursorPage[OutboxEventOut]:
    events = outbox.recent(db, page)
    return CursorPage(
        items=[OutboxEventOut.model_validate(event) for event in events.items],
        next_cursor=events.next_cursor,
    )


@router.post("/outbox/{event_id}/replay")
def replay_outbox_event(event_id: uuid.UUID, db: DbSession, admin: AdminUser) -> OutboxEventOut:
    event = db.get(OutboxEvent, event_id)
    if event is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evento de outbox no encontrado")
    try:
        event = outbox.replay(db, admin, event)
    except outbox.InvalidState as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, exc.message) from exc
    return OutboxEventOut.model_validate(event)
