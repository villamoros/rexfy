"""Trust & safety operations for RexFy's own team (users with is_platform_admin)."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.application import audit
from app.application.notifications import notify
from app.domain.listings.enums import ListingStatus
from app.infrastructure.db.models import Company, CompanyMember, Listing, User


def companies(db: Session, *, verified: bool | None = None) -> list[tuple[Company, int]]:
    """Companies with their member count, newest first; unverified ones are the review queue."""
    members = (
        select(CompanyMember.company_id, func.count().label("n"))
        .group_by(CompanyMember.company_id)
        .subquery()
    )
    stmt = (
        select(Company, func.coalesce(members.c.n, 0))
        .outerjoin(members, members.c.company_id == Company.id)
        .order_by(Company.created_at.desc())
    )
    if verified is not None:
        stmt = stmt.where(Company.is_verified.is_(verified))
    return [(c, n) for c, n in db.execute(stmt)]


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


def listings(db: Session, *, status: ListingStatus | None = None) -> list[Listing]:
    stmt = select(Listing).order_by(Listing.created_at.desc()).limit(100)
    if status is not None:
        stmt = stmt.where(Listing.status == status)
    return list(db.scalars(stmt))


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
