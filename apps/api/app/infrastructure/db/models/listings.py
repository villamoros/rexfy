import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
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
from app.infrastructure.storage import get_storage


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
    # Why RexFy took the listing down, shown to its company.
    moderation_note: Mapped[str | None] = mapped_column(Text)

    company: Mapped[Company] = relationship(lazy="joined")
    images: Mapped[list["ListingImage"]] = relationship(
        back_populates="listing",
        order_by="ListingImage.position",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


class ListingImage(TimestampedModel):
    """A photo of the material. The file lives in storage under `key`."""

    __tablename__ = "listing_images"

    listing_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("listings.id", ondelete="CASCADE"), index=True
    )
    key: Mapped[str] = mapped_column(String(300), unique=True)
    content_type: Mapped[str] = mapped_column(String(50))
    size_bytes: Mapped[int] = mapped_column(Integer)
    position: Mapped[int] = mapped_column(Integer, default=0)

    listing: Mapped[Listing] = relationship(back_populates="images")

    @property
    def url(self) -> str:
        return get_storage().url(self.key)
