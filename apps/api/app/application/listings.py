import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Literal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.application import audit
from app.domain.listings.enums import Availability, ListingStatus, MaterialCategory, PricingType
from app.domain.listings.rules import check_listing_terms
from app.domain.organizations.roles import MarketRole
from app.infrastructure.db.models import Listing, User

TERM_FIELDS = (
    "quantity",
    "min_order_quantity",
    "availability",
    "available_from",
    "pricing_type",
    "price",
    "price_unit",
)

# Fields a PATCH may clear by sending null; a null for any other field is ignored.
NULLABLE_FIELDS = {
    "min_order_quantity",
    "available_from",
    "facility_name",
    "price",
    "price_unit",
    "conditions",
}


class NotAllowed(Exception):
    pass


class InvalidState(Exception):
    pass


def _company_ids(user: User) -> set[uuid.UUID]:
    return {m.company_id for m in user.memberships}


def _require_generator(user: User, company_id: uuid.UUID) -> None:
    membership = next((m for m in user.memberships if m.company_id == company_id), None)
    if membership is None or MarketRole.GENERATOR not in membership.company.market_roles:
        raise NotAllowed


def _check_terms(listing: Listing) -> None:
    check_listing_terms(**{name: getattr(listing, name) for name in TERM_FIELDS})


def create_listing(
    db: Session, user: User, data: dict[str, Any], *, publish: bool = False
) -> Listing:
    """Save a draft, or publish it in the same transaction so a failure leaves nothing behind."""
    _require_generator(user, data["company_id"])
    listing = Listing(**data, status=ListingStatus.DRAFT)
    if listing.pricing_type is PricingType.FREE:
        listing.price = listing.price_unit = None
    _check_terms(listing)
    if publish:
        listing.status = ListingStatus.PUBLISHED
        listing.published_at = datetime.now(UTC)
    db.add(listing)
    audit.record(
        db,
        user,
        "listing.published" if publish else "listing.created",
        listing,
        company_id=listing.company_id,
        title=listing.title,
    )
    db.commit()
    return listing


def get_listing_for(db: Session, user: User | None, listing_id: uuid.UUID) -> Listing | None:
    """Published listings are public; drafts and archived ones only for their company's members."""
    listing = db.get(Listing, listing_id)
    if listing is None:
        return None
    if listing.status is ListingStatus.PUBLISHED:
        return listing
    if user is not None and listing.company_id in _company_ids(user):
        return listing
    return None


def update_listing(db: Session, user: User, listing: Listing, changes: dict[str, Any]) -> Listing:
    _require_generator(user, listing.company_id)
    if listing.status is ListingStatus.ARCHIVED:
        raise InvalidState
    before = {name: getattr(listing, name) for name in changes}
    for name, value in changes.items():
        if value is not None or name in NULLABLE_FIELDS:
            setattr(listing, name, value)
    if listing.pricing_type is PricingType.FREE:
        listing.price = listing.price_unit = None
    _check_terms(listing)
    changed = {
        name: [before[name], getattr(listing, name)]
        for name in changes
        if before[name] != getattr(listing, name)
    }
    if changed:
        audit.record(
            db, user, "listing.updated", listing, company_id=listing.company_id, changes=changed
        )
    db.commit()
    return listing


def publish_listing(db: Session, user: User, listing: Listing) -> Listing:
    _require_generator(user, listing.company_id)
    if listing.status is not ListingStatus.DRAFT:
        raise InvalidState
    listing.status = ListingStatus.PUBLISHED
    listing.published_at = datetime.now(UTC)
    audit.record(db, user, "listing.published", listing, company_id=listing.company_id)
    db.commit()
    return listing


def archive_listing(db: Session, user: User, listing: Listing) -> Listing:
    _require_generator(user, listing.company_id)
    listing.status = ListingStatus.ARCHIVED
    audit.record(db, user, "listing.archived", listing, company_id=listing.company_id)
    db.commit()
    return listing


def listings_of(db: Session, user: User) -> list[Listing]:
    stmt = (
        select(Listing)
        .where(Listing.company_id.in_(_company_ids(user)))
        .order_by(Listing.created_at.desc())
    )
    return list(db.scalars(stmt))


SortOrder = Literal["recent", "price_asc"]


@dataclass
class ListingSearch:
    q: str | None = None
    categories: list[MaterialCategory] = field(default_factory=list)
    city: str | None = None
    availability: list[Availability] = field(default_factory=list)
    pricing_type: PricingType | None = None
    recurring: bool | None = None
    sort: SortOrder = "recent"
    limit: int = 20
    offset: int = 0


def _apply_filters(stmt: Select, f: ListingSearch) -> Select:
    stmt = stmt.where(Listing.status == ListingStatus.PUBLISHED)
    if f.q:
        pattern = f"%{f.q.strip()}%"
        stmt = stmt.where(or_(Listing.title.ilike(pattern), Listing.description.ilike(pattern)))
    if f.categories:
        stmt = stmt.where(Listing.category.in_(f.categories))
    if f.city:
        stmt = stmt.where(Listing.city.ilike(f"%{f.city.strip()}%"))
    if f.availability:
        stmt = stmt.where(Listing.availability.in_(f.availability))
    if f.pricing_type:
        stmt = stmt.where(Listing.pricing_type == f.pricing_type)
    if f.recurring is not None:
        stmt = stmt.where(Listing.is_recurring.is_(f.recurring))
    return stmt


def search_listings(db: Session, f: ListingSearch) -> tuple[list[Listing], int]:
    total = db.scalar(_apply_filters(select(func.count(Listing.id)), f)) or 0
    order = {
        "recent": [Listing.published_at.desc()],
        "price_asc": [Listing.price.asc().nulls_first(), Listing.published_at.desc()],
    }[f.sort]
    stmt = _apply_filters(select(Listing), f).order_by(*order).limit(f.limit).offset(f.offset)
    return list(db.scalars(stmt)), total
