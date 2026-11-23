"""Import every model so Base.metadata is complete for Alembic and the mappers resolve."""

from app.infrastructure.db.models.analytics import ProductEvent
from app.infrastructure.db.models.audit import AuditLog
from app.infrastructure.db.models.deals import Message, Offer, Thread, Transaction
from app.infrastructure.db.models.idempotency import IdempotencyRecord
from app.infrastructure.db.models.identity import User
from app.infrastructure.db.models.listings import Listing, ListingImage
from app.infrastructure.db.models.logistics import Shipment, ShipmentEvent, TransportQuote
from app.infrastructure.db.models.notifications import Notification
from app.infrastructure.db.models.organizations import (
    Company,
    CompanyInvitation,
    CompanyMember,
)
from app.infrastructure.db.models.outbox import OutboxDelivery, OutboxEvent
from app.infrastructure.db.models.trust import Dispute, Review

__all__ = [
    "AuditLog",
    "Company",
    "CompanyInvitation",
    "CompanyMember",
    "Dispute",
    "IdempotencyRecord",
    "Listing",
    "ListingImage",
    "Message",
    "Notification",
    "Offer",
    "OutboxDelivery",
    "OutboxEvent",
    "ProductEvent",
    "Review",
    "Shipment",
    "ShipmentEvent",
    "Thread",
    "Transaction",
    "TransportQuote",
    "User",
]
