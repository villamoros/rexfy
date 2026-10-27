import uuid
from datetime import datetime

from sqlalchemy import ARRAY, Boolean, DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.organizations.roles import MarketRole, MemberRole
from app.infrastructure.db.base import TimestampedModel
from app.infrastructure.db.models.identity import User


class Company(TimestampedModel):
    __tablename__ = "companies"

    legal_name: Mapped[str] = mapped_column(String(200))
    nit: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    city: Mapped[str] = mapped_column(String(100))
    market_roles: Mapped[list[MarketRole]] = mapped_column(
        ARRAY(Enum(MarketRole, name="market_role", values_callable=lambda e: [m.value for m in e]))
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    members: Mapped[list["CompanyMember"]] = relationship(back_populates="company")


class CompanyMember(TimestampedModel):
    __tablename__ = "company_members"
    __table_args__ = (UniqueConstraint("company_id", "user_id"),)

    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role: Mapped[MemberRole] = mapped_column(
        Enum(MemberRole, name="member_role", values_callable=lambda e: [m.value for m in e])
    )

    company: Mapped[Company] = relationship(back_populates="members", lazy="joined")
    user: Mapped[User] = relationship(back_populates="memberships")


class CompanyInvitation(TimestampedModel):
    """An email invited to join a company before they have a RexFy account."""

    __tablename__ = "company_invitations"
    __table_args__ = (UniqueConstraint("company_id", "email"),)

    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    email: Mapped[str] = mapped_column(String(320), index=True)
    role: Mapped[MemberRole] = mapped_column(
        Enum(MemberRole, name="member_role", values_callable=lambda e: [m.value for m in e])
    )
    invited_by_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    company: Mapped[Company] = relationship(lazy="joined")
