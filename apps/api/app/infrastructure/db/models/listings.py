import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.listings.enums import (
    Availability,
    ListingStatus,
    MaterialCategory,
    MaterialCondition,
    PricingType,
    QuantityUnit,
)
from app.infrastructure.db.base import TimestampedModel
from app.infrastructure.db.models.organizations import Company


def enum_column(cls: type[StrEnum], name: str) -> Enum:
    return Enum(cls, name=name, values_callable=lambda e: [m.value for m in e])


class Listing(TimestampedModel):
    __tablename__ = "listings"

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[ListingStatus] = mapped_column(
        enum_column(ListingStatus, "listing_status"), default=ListingStatus.DRAFT, index=True
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Material
    category: Mapped[MaterialCategory] = mapped_column(
        enum_column(MaterialCategory, "material_category"), index=True
    )
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text, default="")
    condition: Mapped[MaterialCondition] = mapped_column(
        enum_column(MaterialCondition, "material_condition")
    )
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)

    # Quantity and availability
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    quantity_unit: Mapped[QuantityUnit] = mapped_column(enum_column(QuantityUnit, "quantity_unit"))
    min_order_quantity: Mapped[Decimal | None] = mapped_column(Numeric(14, 3))
    availability: Mapped[Availability] = mapped_column(enum_column(Availability, "availability"))
    available_from: Mapped[date | None] = mapped_column(Date)

    # Location
    city: Mapped[str] = mapped_column(String(100), index=True)
    facility_name: Mapped[str | None] = mapped_column(String(160))
    pickup_allowed: Mapped[bool] = mapped_column(Boolean, default=True)

    # Price (COP)
    pricing_type: Mapped[PricingType] = mapped_column(enum_column(PricingType, "pricing_type"))
    price: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    price_unit: Mapped[QuantityUnit | None] = mapped_column(
        enum_column(QuantityUnit, "quantity_unit")
    )
    price_negotiable: Mapped[bool] = mapped_column(Boolean, default=False)
    conditions: Mapped[str | None] = mapped_column(Text)

    company: Mapped[Company] = relationship(lazy="joined")
