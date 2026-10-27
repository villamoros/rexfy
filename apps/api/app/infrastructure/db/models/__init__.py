"""Import every model so Base.metadata is complete for Alembic and the mappers resolve."""

from app.infrastructure.db.models.deals import Message, Offer, Thread, Transaction
from app.infrastructure.db.models.identity import User
from app.infrastructure.db.models.listings import Listing
from app.infrastructure.db.models.logistics import Shipment, ShipmentEvent, TransportQuote
from app.infrastructure.db.models.organizations import Company, CompanyMember

__all__ = [
    "Company",
    "CompanyMember",
    "Listing",
    "Message",
    "Offer",
    "Shipment",
    "ShipmentEvent",
    "Thread",
    "Transaction",
    "TransportQuote",
    "User",
]
