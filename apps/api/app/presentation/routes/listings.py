import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.application import listings as service
from app.domain.listings.enums import Availability, MaterialCategory, PricingType
from app.infrastructure.db.models import Listing
from app.presentation.deps import CurrentUser, DbSession, OptionalUser
from app.presentation.schemas.listings import ListingCreate, ListingOut, ListingPage, ListingUpdate

router = APIRouter(tags=["listings"])

_FORBIDDEN = HTTPException(
    status.HTTP_403_FORBIDDEN, "Solo empresas generadoras de las que eres miembro pueden hacer esto"
)


def _invalid(message: str) -> HTTPException:
    return HTTPException(
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        [{"loc": ["body"], "msg": message, "type": "value_error"}],
    )


def _load(db: DbSession, user: OptionalUser, listing_id: uuid.UUID) -> Listing:
    listing = service.get_listing_for(db, user, listing_id)
    if listing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Publicación no encontrada")
    return listing


@router.get("/materials")
def materials() -> list[MaterialCategory]:
    return list(MaterialCategory)


@router.get("/listings")
def search(
    db: DbSession,
    q: str | None = None,
    category: Annotated[list[MaterialCategory], Query()] = [],  # noqa: B006
    city: str | None = None,
    availability: Annotated[list[Availability], Query()] = [],  # noqa: B006
    pricing_type: PricingType | None = None,
    recurring: bool | None = None,
    sort: service.SortOrder = "recent",
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ListingPage:
    filters = service.ListingSearch(
        q=q,
        categories=category,
        city=city,
        availability=availability,
        pricing_type=pricing_type,
        recurring=recurring,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    items, total = service.search_listings(db, filters)
    return ListingPage(
        items=[ListingOut.model_validate(i) for i in items], total=total, limit=limit, offset=offset
    )


@router.get("/me/listings")
def my_listings(db: DbSession, user: CurrentUser) -> list[ListingOut]:
    return [ListingOut.model_validate(i) for i in service.listings_of(db, user)]


@router.post("/listings", status_code=status.HTTP_201_CREATED)
def create(body: ListingCreate, db: DbSession, user: CurrentUser) -> ListingOut:
    try:
        listing = service.create_listing(db, user, body.model_dump())
    except service.NotAllowed:
        raise _FORBIDDEN from None
    except ValueError as exc:
        raise _invalid(str(exc)) from None
    return ListingOut.model_validate(listing)


@router.get("/listings/{listing_id}")
def read(listing_id: uuid.UUID, db: DbSession, user: OptionalUser) -> ListingOut:
    return ListingOut.model_validate(_load(db, user, listing_id))


@router.patch("/listings/{listing_id}")
def update(
    listing_id: uuid.UUID, body: ListingUpdate, db: DbSession, user: CurrentUser
) -> ListingOut:
    listing = _load(db, user, listing_id)
    try:
        listing = service.update_listing(db, user, listing, body.model_dump(exclude_unset=True))
    except service.NotAllowed:
        raise _FORBIDDEN from None
    except service.InvalidState:
        raise HTTPException(status.HTTP_409_CONFLICT, "La publicación está archivada") from None
    except ValueError as exc:
        db.rollback()
        raise _invalid(str(exc)) from None
    return ListingOut.model_validate(listing)


@router.post("/listings/{listing_id}/publish")
def publish(listing_id: uuid.UUID, db: DbSession, user: CurrentUser) -> ListingOut:
    listing = _load(db, user, listing_id)
    try:
        listing = service.publish_listing(db, user, listing)
    except service.NotAllowed:
        raise _FORBIDDEN from None
    except service.InvalidState:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Solo se pueden publicar borradores"
        ) from None
    return ListingOut.model_validate(listing)


@router.post("/listings/{listing_id}/archive")
def archive(listing_id: uuid.UUID, db: DbSession, user: CurrentUser) -> ListingOut:
    listing = _load(db, user, listing_id)
    try:
        listing = service.archive_listing(db, user, listing)
    except service.NotAllowed:
        raise _FORBIDDEN from None
    return ListingOut.model_validate(listing)
