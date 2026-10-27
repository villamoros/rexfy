import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.domain.listings.enums import (
    Availability,
    ListingStatus,
    MaterialCategory,
    MaterialCondition,
    PricingType,
    QuantityUnit,
)

Quantity = Field(gt=0, max_digits=14, decimal_places=3)


class ListingFields(BaseModel):
    category: MaterialCategory
    title: str = Field(min_length=5, max_length=160)
    description: str = Field(default="", max_length=4000)
    condition: MaterialCondition
    is_recurring: bool = False
    quantity: Decimal = Quantity
    quantity_unit: QuantityUnit
    min_order_quantity: Decimal | None = Field(default=None, gt=0, max_digits=14, decimal_places=3)
    availability: Availability
    available_from: date | None = None
    city: str = Field(min_length=2, max_length=100)
    facility_name: str | None = Field(default=None, max_length=160)
    pickup_allowed: bool = True
    pricing_type: PricingType
    price: Decimal | None = Field(default=None, gt=0, max_digits=14, decimal_places=2)
    price_unit: QuantityUnit | None = None
    price_negotiable: bool = False
    conditions: str | None = Field(default=None, max_length=2000)


class ListingCreate(ListingFields):
    company_id: uuid.UUID


class ListingUpdate(BaseModel):
    """Every field optional; only the ones sent are changed."""

    category: MaterialCategory | None = None
    title: str | None = Field(default=None, min_length=5, max_length=160)
    description: str | None = Field(default=None, max_length=4000)
    condition: MaterialCondition | None = None
    is_recurring: bool | None = None
    quantity: Decimal | None = Field(default=None, gt=0, max_digits=14, decimal_places=3)
    quantity_unit: QuantityUnit | None = None
    min_order_quantity: Decimal | None = Field(default=None, gt=0, max_digits=14, decimal_places=3)
    availability: Availability | None = None
    available_from: date | None = None
    city: str | None = Field(default=None, min_length=2, max_length=100)
    facility_name: str | None = Field(default=None, max_length=160)
    pickup_allowed: bool | None = None
    pricing_type: PricingType | None = None
    price: Decimal | None = Field(default=None, gt=0, max_digits=14, decimal_places=2)
    price_unit: QuantityUnit | None = None
    price_negotiable: bool | None = None
    conditions: str | None = Field(default=None, max_length=2000)


class ListingCompany(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    legal_name: str
    city: str
    is_verified: bool


class ListingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: ListingStatus
    published_at: datetime | None
    created_at: datetime
    company: ListingCompany
    category: MaterialCategory
    title: str
    description: str
    condition: MaterialCondition
    is_recurring: bool
    quantity: float
    quantity_unit: QuantityUnit
    min_order_quantity: float | None
    availability: Availability
    available_from: date | None
    city: str
    facility_name: str | None
    pickup_allowed: bool
    pricing_type: PricingType
    price: float | None
    price_unit: QuantityUnit | None
    price_negotiable: bool
    conditions: str | None


class ListingPage(BaseModel):
    items: list[ListingOut]
    total: int
    limit: int
    offset: int
