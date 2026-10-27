import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.domain.deals.enums import OfferStatus, TransactionStatus
from app.domain.listings.enums import QuantityUnit


class CompanyRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    legal_name: str
    city: str
    is_verified: bool


class ListingRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    category: str
    quantity: float
    quantity_unit: QuantityUnit
    price: float | None
    price_unit: QuantityUnit | None
    city: str


class ThreadStart(BaseModel):
    listing_id: uuid.UUID
    company_id: uuid.UUID
    body: str = Field(min_length=1, max_length=4000)


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class OfferCreate(BaseModel):
    quantity: Decimal = Field(gt=0, max_digits=14, decimal_places=3)
    price: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    price_unit: QuantityUnit
    valid_hours: int = Field(default=48, ge=1, le=24 * 30)
    notes: str | None = Field(default=None, max_length=2000)


class MessageOut(BaseModel):
    id: uuid.UUID
    body: str
    sender_name: str
    sender_company_id: uuid.UUID
    created_at: datetime


class OfferOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    from_company_id: uuid.UUID
    status: OfferStatus
    quantity: float
    quantity_unit: QuantityUnit
    price: float
    price_unit: QuantityUnit
    total: float | None
    notes: str | None
    valid_until: datetime
    created_at: datetime


class ThreadSummary(BaseModel):
    id: uuid.UUID
    listing: ListingRef
    counterpart: CompanyRef
    my_company_id: uuid.UUID
    last_message: str | None
    last_activity_at: datetime
    pending_offer_from_me: bool | None


class ThreadDetail(BaseModel):
    id: uuid.UUID
    listing: ListingRef
    buyer: CompanyRef
    seller: CompanyRef
    my_company_id: uuid.UUID
    messages: list[MessageOut]
    offers: list[OfferOut]
    transaction_id: uuid.UUID | None


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    status: TransactionStatus
    listing: ListingRef
    buyer: CompanyRef
    seller: CompanyRef
    quantity: float
    quantity_unit: QuantityUnit
    price: float
    price_unit: QuantityUnit
    total: float | None
    created_at: datetime
    completed_at: datetime | None
    thread_id: uuid.UUID
    my_role: str = ""
