import uuid
from datetime import date
from typing import Any

from sqlalchemy import Date, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import TimestampedModel


class ProductEvent(TimestampedModel):
    """First-party, non-PII event committed with the business change it describes."""

    __tablename__ = "product_events"
    __table_args__ = (
        Index("ix_product_events_name_created", "name", "created_at"),
        Index("ix_product_events_role_created", "role", "created_at"),
    )

    name: Mapped[str] = mapped_column(String(80), index=True)
    schema_version: Mapped[int] = mapped_column(Integer, default=1)
    actor_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    company_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("companies.id", ondelete="SET NULL"), index=True
    )
    role: Mapped[str] = mapped_column(String(40), index=True)
    entity_type: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[uuid.UUID] = mapped_column(index=True)
    city: Mapped[str | None] = mapped_column(String(100), index=True)
    category: Mapped[str | None] = mapped_column(String(50), index=True)
    cohort_month: Mapped[date | None] = mapped_column(Date, index=True)
    properties: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
