"""Trust & safety operations for RexFy's own team (users with is_platform_admin)."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.application import audit
from app.application.notifications import notify
from app.application.pagination import Page, PageRequest, paginate
from app.domain.listings.enums import ListingStatus
from app.infrastructure.db.models import Company, CompanyMember, Listing, User


def companies(
    db: Session, page: PageRequest, *, verified: bool | None = None
) -> Page[tuple[Company, int]]:
    """Companies with their member count, newest first; unverified ones are the review queue."""
    stmt = select(Company)
    if verified is not None:
        stmt = stmt.where(Company.is_verified.is_(verified))
    companies_page = paginate(db, stmt, page, model=Company)
    counts = dict(
        db.execute(
            select(CompanyMember.company_id, func.count())
            .where(CompanyMember.company_id.in_([company.id for company in companies_page.items]))
            .group_by(CompanyMember.company_id)
        )
    )
    return Page(
        items=[(company, counts.get(company.id, 0)) for company in companies_page.items],
        next_cursor=companies_page.next_cursor,
    )


def set_verified(db: Session, admin: User, company: Company, verified: bool) -> Company:
    if company.is_verified != verified:
        company.is_verified = verified
        audit.record(db, admin, "company.verified" if verified else "company.unverified", company)
        if verified:
            notify(
                db,
                company.id,
                kind="company_verified",
                title="Tu empresa está verificada",
                body=f"{company.legal_name} ya muestra el sello de empresa verificada.",
                link="/panel",
            )
        db.commit()
    return company


def listings(
    db: Session, page: PageRequest, *, status: ListingStatus | None = None
) -> Page[Listing]:
    stmt = select(Listing)
    if status is not None:
        stmt = stmt.where(Listing.status == status)
    return paginate(db, stmt, page, model=Listing)


def take_down(db: Session, admin: User, listing: Listing, reason: str) -> Listing:
    """Archive a listing that breaks the rules, telling its company why."""
    listing.status = ListingStatus.ARCHIVED
    listing.moderation_note = reason.strip()
    audit.record(
        db, admin, "listing.taken_down", listing, company_id=listing.company_id, reason=reason
    )
    notify(
        db,
        listing.company_id,
        kind="listing_taken_down",
        title="RexFy retiró una publicación",
        body=f"{listing.title}: {reason.strip()}",
        link=f"/publicaciones/{listing.id}",
    )
    db.commit()
    return listing


def get_company(db: Session, company_id: uuid.UUID) -> Company | None:
    return db.get(Company, company_id)


def get_listing(db: Session, listing_id: uuid.UUID) -> Listing | None:
    return db.get(Listing, listing_id)
