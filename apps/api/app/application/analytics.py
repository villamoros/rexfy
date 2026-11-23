"""Transactional first-party product events and a privacy-aware funnel."""

import uuid
from collections import Counter
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.product.events import SCHEMA_VERSION, ProductEventName
from app.infrastructure.db.models import Company, ProductEvent, User

WINDOW_DAYS = 30
TIMEZONE = "UTC"
MIN_SEGMENT_SIZE = 3
FORBIDDEN_PROPERTY_KEYS = {
    "address",
    "body",
    "email",
    "full_name",
    "message",
    "nit",
    "notes",
    "phone",
}
VALID_ROLES = {"unassigned", "generator", "buyer", "transporter"}

FUNNEL = (
    ("registration", "Registro", (ProductEventName.USER_REGISTERED,)),
    ("company", "Empresa creada", (ProductEventName.COMPANY_CREATED,)),
    (
        "activation",
        "Publicación o contacto",
        (ProductEventName.LISTING_PUBLISHED, ProductEventName.CONTACT_STARTED),
    ),
    ("offer", "Oferta enviada", (ProductEventName.OFFER_SENT,)),
    ("order", "Orden creada", (ProductEventName.ORDER_CREATED,)),
    ("delivery", "Entrega", (ProductEventName.SHIPMENT_DELIVERED,)),
)


@dataclass(frozen=True)
class FunnelStep:
    key: str
    label: str
    entities: int
    conversion_from_previous: float | None


@dataclass(frozen=True)
class FunnelSegment:
    dimension: str
    value: str
    events: int
    companies: int


@dataclass(frozen=True)
class FunnelSnapshot:
    window_days: int
    timezone: str
    since: datetime
    role: str | None
    city: str | None
    category: str | None
    cohort_month: date | None
    steps: list[FunnelStep]
    segments: list[FunnelSegment]


def _cohort(company: Company | None) -> date | None:
    if company is None:
        return None
    created = company.created_at
    return date(created.year, created.month, 1)


def _property_keys(value: Any) -> set[str]:
    if isinstance(value, dict):
        return set(value).union(*(_property_keys(item) for item in value.values()))
    if isinstance(value, list):
        return set().union(*(_property_keys(item) for item in value))
    return set()


def track(
    db: Session,
    name: ProductEventName,
    *,
    actor: User,
    entity: object,
    role: str,
    company: Company | None = None,
    city: str | None = None,
    category: str | None = None,
    properties: dict[str, Any] | None = None,
) -> ProductEvent:
    """Add an event to the current transaction; callers own the commit boundary."""
    payload = properties or {}
    forbidden = FORBIDDEN_PROPERTY_KEYS.intersection(_property_keys(payload))
    if forbidden:
        raise ValueError(f"Product analytics cannot contain PII fields: {sorted(forbidden)}")
    if role not in VALID_ROLES:
        raise ValueError(f"Unknown product analytics role: {role}")
    if role != "unassigned" and company is None:
        raise ValueError("Contextual product events require a company")
    entity_id = getattr(entity, "id", None)
    if not isinstance(entity_id, uuid.UUID):
        raise ValueError("Product event entities must have a persisted UUID")
    event = ProductEvent(
        name=name.value,
        schema_version=SCHEMA_VERSION,
        actor_user_id=actor.id,
        company_id=company.id if company else None,
        role=role,
        entity_type=type(entity).__name__,
        entity_id=entity_id,
        city=(city or (company.city if company else None)),
        category=category,
        cohort_month=_cohort(company),
        properties=payload,
    )
    db.add(event)
    return event


def _segments(events: list[ProductEvent]) -> list[FunnelSegment]:
    result: list[FunnelSegment] = []
    dimensions = {
        "role": lambda event: event.role,
        "city": lambda event: event.city,
        "category": lambda event: event.category,
        "cohort_month": lambda event: (
            event.cohort_month.isoformat() if event.cohort_month else None
        ),
    }
    for dimension, value_of in dimensions.items():
        counts = Counter(value_of(event) for event in events if value_of(event))
        for value, count in sorted(counts.items()):
            if count < MIN_SEGMENT_SIZE:
                continue
            companies = {
                event.company_id
                for event in events
                if value_of(event) == value and event.company_id is not None
            }
            result.append(FunnelSegment(dimension, str(value), count, len(companies)))
    return result


def funnel(
    db: Session,
    *,
    role: str | None = None,
    city: str | None = None,
    category: str | None = None,
    cohort_month: date | None = None,
    now: datetime | None = None,
) -> FunnelSnapshot:
    end = now or datetime.now(UTC)
    since = end - timedelta(days=WINDOW_DAYS)
    stmt = select(ProductEvent).where(ProductEvent.created_at >= since)
    all_events = list(db.scalars(stmt.order_by(ProductEvent.created_at)))

    def matches_context(event: ProductEvent) -> bool:
        return (
            (role is None or event.role == role)
            and (city is None or event.city == city)
            and (category is None or event.category == category)
            and (cohort_month is None or event.cohort_month == cohort_month)
        )

    contextual = [event for event in all_events if matches_context(event)]
    matching_companies = {event.company_id for event in contextual if event.company_id}
    matching_actors = {event.actor_user_id for event in contextual}
    events = [
        event
        for event in all_events
        if (
            matches_context(event)
            or (
                event.name == ProductEventName.USER_REGISTERED
                and event.actor_user_id in matching_actors
            )
            or (
                category is not None
                and event.category is None
                and event.company_id in matching_companies
                and (role is None or event.role == role)
                and (city is None or event.city == city)
                and (cohort_month is None or event.cohort_month == cohort_month)
            )
        )
    ]
    steps: list[FunnelStep] = []
    previous: int | None = None
    for key, label, names in FUNNEL:
        accepted = {name.value for name in names}
        count = len({event.entity_id for event in events if event.name in accepted})
        conversion = round(count / previous, 4) if previous else None
        steps.append(FunnelStep(key, label, count, conversion))
        previous = count
    return FunnelSnapshot(
        window_days=WINDOW_DAYS,
        timezone=TIMEZONE,
        since=since,
        role=role,
        city=city,
        category=category,
        cohort_month=cohort_month,
        steps=steps,
        segments=_segments(events),
    )
