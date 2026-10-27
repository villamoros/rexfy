import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.domain.listings.enums import QuantityUnit
from app.domain.logistics.enums import QuoteStatus, ShipmentStatus, VehicleType
from app.presentation.schemas.deals import CompanyRef


class ShipmentRequest(BaseModel):
    pickup_city: str = Field(min_length=2, max_length=100)
    pickup_address: str = Field(min_length=5, max_length=300)
    delivery_city: str = Field(min_length=2, max_length=100)
    delivery_address: str = Field(min_length=5, max_length=300)
    vehicle_type: VehicleType
    pickup_date: date
    requirements: str | None = Field(default=None, max_length=2000)


class QuoteCreate(BaseModel):
    company_id: uuid.UUID
    price: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    pickup_date: date
    delivery_date: date
    includes_insurance: bool = False
    notes: str | None = Field(default=None, max_length=2000)


class EventCreate(BaseModel):
    status: ShipmentStatus
    note: str | None = Field(default=None, max_length=1000)


class QuoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    transporter: CompanyRef
    status: QuoteStatus
    price: float
    pickup_date: date
    delivery_date: date
    includes_insurance: bool
    notes: str | None
    created_at: datetime


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: ShipmentStatus
    note: str | None
    created_at: datetime


class OrderRef(BaseModel):
    id: uuid.UUID
    code: str
    listing_title: str
    quantity: float
    quantity_unit: QuantityUnit
    buyer: CompanyRef
    seller: CompanyRef


class ShipmentOut(BaseModel):
    id: uuid.UUID
    status: ShipmentStatus
    order: OrderRef
    pickup_city: str
    delivery_city: str
    # Exact addresses are only shared with the order's parties and the assigned transporter.
    pickup_address: str | None
    delivery_address: str | None
    vehicle_type: VehicleType
    pickup_date: date
    requirements: str | None
    transporter: CompanyRef | None
    quotes: list[QuoteOut]
    events: list[EventOut]
    my_relation: str
