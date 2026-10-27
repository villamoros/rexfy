import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.deals.enums import OfferStatus, TransactionStatus
from app.domain.listings.enums import QuantityUnit
from app.infrastructure.db.base import TimestampedModel
from app.infrastructure.db.models.identity import User
from app.infrastructure.db.models.listings import Listing, enum_column
from app.infrastructure.db.models.organizations import Company


class Thread(TimestampedModel):
    """One negotiation between a buyer company and the company that published a listing."""

    __tablename__ = "chat_threads"
    __table_args__ = (UniqueConstraint("listing_id", "buyer_company_id"),)

    listing_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"))
    buyer_company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    seller_company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    last_activity_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    listing: Mapped[Listing] = relationship(lazy="joined")
    buyer: Mapped[Company] = relationship(foreign_keys=[buyer_company_id], lazy="joined")
    seller: Mapped[Company] = relationship(foreign_keys=[seller_company_id], lazy="joined")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="thread", order_by="Message.created_at"
    )
    offers: Mapped[list["Offer"]] = relationship(
        back_populates="thread", order_by="Offer.created_at"
    )


class Message(TimestampedModel):
    __tablename__ = "chat_messages"

    thread_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("chat_threads.id", ondelete="CASCADE"), index=True
    )
    sender_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    sender_company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"))
    body: Mapped[str] = mapped_column(Text)

    thread: Mapped[Thread] = relationship(back_populates="messages")
    sender: Mapped[User] = relationship(lazy="joined")


class Offer(TimestampedModel):
    """A formal quote inside a thread. Only one offer per thread is pending at a time."""

    __tablename__ = "offers"

    thread_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("chat_threads.id", ondelete="CASCADE"), index=True
    )
    from_company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"))
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    status: Mapped[OfferStatus] = mapped_column(
        enum_column(OfferStatus, "offer_status"), default=OfferStatus.PENDING
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    quantity_unit: Mapped[QuantityUnit] = mapped_column(enum_column(QuantityUnit, "quantity_unit"))
    price: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    price_unit: Mapped[QuantityUnit] = mapped_column(enum_column(QuantityUnit, "quantity_unit"))
    notes: Mapped[str | None] = mapped_column(Text)
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    thread: Mapped[Thread] = relationship(back_populates="offers")


class Transaction(TimestampedModel):
    """The order created when an offer is accepted. Its terms are copied from the offer."""

    __tablename__ = "transactions"

    code: Mapped[str] = mapped_column(String(16), unique=True)
    offer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("offers.id"), unique=True)
    listing_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("listings.id"))
    buyer_company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), index=True)
    seller_company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), index=True)
    status: Mapped[TransactionStatus] = mapped_column(
        enum_column(TransactionStatus, "transaction_status"), default=TransactionStatus.AGREED
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    quantity_unit: Mapped[QuantityUnit] = mapped_column(enum_column(QuantityUnit, "quantity_unit"))
    price: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    price_unit: Mapped[QuantityUnit] = mapped_column(enum_column(QuantityUnit, "quantity_unit"))
    total: Mapped[Decimal | None] = mapped_column(Numeric(16, 2))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    listing: Mapped[Listing] = relationship(lazy="joined")
    buyer: Mapped[Company] = relationship(foreign_keys=[buyer_company_id], lazy="joined")
    seller: Mapped[Company] = relationship(foreign_keys=[seller_company_id], lazy="joined")
    offer: Mapped[Offer] = relationship(lazy="joined")

    @property
    def thread_id(self) -> uuid.UUID:
        return self.offer.thread_id
