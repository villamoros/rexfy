import uuid
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from app.domain.logistics.enums import ShipmentStatus, VehicleType


@dataclass(frozen=True)
class RequestShipment:
    pickup_city: str
    pickup_address: str
    delivery_city: str
    delivery_address: str
    vehicle_type: VehicleType
    pickup_date: date
    requirements: str | None


@dataclass(frozen=True)
class SubmitTransportQuote:
    company_id: uuid.UUID
    price: Decimal
    pickup_date: date
    delivery_date: date
    includes_insurance: bool
    notes: str | None


@dataclass(frozen=True)
class AdvanceShipment:
    status: ShipmentStatus
    note: str | None
