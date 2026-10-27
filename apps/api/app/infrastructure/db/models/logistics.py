import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.logistics.enums import QuoteStatus, ShipmentStatus, VehicleType
from app.infrastructure.db.base import TimestampedModel
from app.infrastructure.db.models.deals import Transaction
from app.infrastructure.db.models.listings import enum_column
from app.infrastructure.db.models.organizations import Company


class Shipment(TimestampedModel):
    """A transport request for an order. MVP: at most one per order."""

    __tablename__ = "shipments"

    transaction_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("transactions.id", ondelete="CASCADE"), unique=True
    )
    requested_by_company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"))
    status: Mapped[ShipmentStatus] = mapped_column(
        enum_column(ShipmentStatus, "shipment_status"), default=ShipmentStatus.REQUESTED, index=True
    )
    pickup_city: Mapped[str] = mapped_column(String(100))
    pickup_address: Mapped[str] = mapped_column(String(300))
    delivery_city: Mapped[str] = mapped_column(String(100))
    delivery_address: Mapped[str] = mapped_column(String(300))
    vehicle_type: Mapped[VehicleType] = mapped_column(enum_column(VehicleType, "vehicle_type"))
    pickup_date: Mapped[date] = mapped_column(Date)
    requirements: Mapped[str | None] = mapped_column(Text)
    transporter_company_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("companies.id"), index=True
    )

    transaction: Mapped[Transaction] = relationship(lazy="joined")
    transporter: Mapped[Company | None] = relationship(
        foreign_keys=[transporter_company_id], lazy="joined"
    )
    quotes: Mapped[list["TransportQuote"]] = relationship(
        back_populates="shipment", order_by="TransportQuote.price"
    )
    events: Mapped[list["ShipmentEvent"]] = relationship(
        back_populates="shipment", order_by="ShipmentEvent.created_at"
    )


class TransportQuote(TimestampedModel):
    __tablename__ = "transport_quotes"
    __table_args__ = (UniqueConstraint("shipment_id", "transporter_company_id"),)

    shipment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("shipments.id", ondelete="CASCADE"), index=True
    )
    transporter_company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"))
    status: Mapped[QuoteStatus] = mapped_column(
        enum_column(QuoteStatus, "transport_quote_status"), default=QuoteStatus.PENDING
    )
    price: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    pickup_date: Mapped[date] = mapped_column(Date)
    delivery_date: Mapped[date] = mapped_column(Date)
    includes_insurance: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text)

    shipment: Mapped[Shipment] = relationship(back_populates="quotes")
    transporter: Mapped[Company] = relationship(lazy="joined")


class ShipmentEvent(TimestampedModel):
    __tablename__ = "shipment_events"

    shipment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("shipments.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[ShipmentStatus] = mapped_column(enum_column(ShipmentStatus, "shipment_status"))
    note: Mapped[str | None] = mapped_column(Text)
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    shipment: Mapped[Shipment] = relationship(back_populates="events")
