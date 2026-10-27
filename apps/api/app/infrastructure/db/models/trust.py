import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, SmallInteger, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.trust.enums import DisputeReason, DisputeStatus
from app.infrastructure.db.base import TimestampedModel
from app.infrastructure.db.models.deals import Transaction
from app.infrastructure.db.models.listings import enum_column
from app.infrastructure.db.models.organizations import Company


class Review(TimestampedModel):
    """What one side of a completed order says about the other. One per side and order."""

    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("transaction_id", "from_company_id"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="rating_range"),
    )

    transaction_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("transactions.id", ondelete="CASCADE")
    )
    from_company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"))
    to_company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), index=True)
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    rating: Mapped[int] = mapped_column(SmallInteger)
    comment: Mapped[str | None] = mapped_column(Text)

    from_company: Mapped[Company] = relationship(foreign_keys=[from_company_id], lazy="joined")


class Dispute(TimestampedModel):
    """A problem with an order that RexFy's team mediates."""

    __tablename__ = "disputes"

    transaction_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("transactions.id", ondelete="CASCADE"), index=True
    )
    opened_by_company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"))
    opened_by_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    reason: Mapped[DisputeReason] = mapped_column(enum_column(DisputeReason, "dispute_reason"))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[DisputeStatus] = mapped_column(
        enum_column(DisputeStatus, "dispute_status"), default=DisputeStatus.OPEN, index=True
    )
    resolution: Mapped[str | None] = mapped_column(Text)
    # The company the resolution went against, if any; it lowers their trust score.
    at_fault_company_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("companies.id"))
    resolved_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    transaction: Mapped[Transaction] = relationship(lazy="joined")
    opened_by: Mapped[Company] = relationship(foreign_keys=[opened_by_company_id], lazy="joined")
