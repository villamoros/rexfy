import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.notifications.enums import OutboxStatus
from app.infrastructure.db.base import TimestampedModel
from app.infrastructure.db.models.listings import enum_column


class OutboxEvent(TimestampedModel):
    """A durable side effect committed atomically with its business change."""

    __tablename__ = "outbox_events"
    __table_args__ = (Index("ix_outbox_events_created_cursor", "created_at", "id"),)

    kind: Mapped[str] = mapped_column(String(80), index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB)
    dedupe_key: Mapped[str] = mapped_column(String(255), unique=True)
    status: Mapped[OutboxStatus] = mapped_column(
        enum_column(OutboxStatus, "outbox_status"),
        default=OutboxStatus.PENDING,
        index=True,
    )
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_attempt_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_error: Mapped[str | None] = mapped_column(Text)

    deliveries: Mapped[list["OutboxDelivery"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )


class OutboxDelivery(TimestampedModel):
    """Per-recipient delivery ledger used to make handler replays idempotent."""

    __tablename__ = "outbox_deliveries"
    __table_args__ = (UniqueConstraint("event_id", "recipient"),)

    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("outbox_events.id", ondelete="CASCADE"), index=True
    )
    recipient: Mapped[str] = mapped_column(String(320))
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_error: Mapped[str | None] = mapped_column(Text)

    event: Mapped[OutboxEvent] = relationship(back_populates="deliveries")
