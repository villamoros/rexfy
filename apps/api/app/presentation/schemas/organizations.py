import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domain.organizations.nit import normalize_nit
from app.domain.organizations.roles import MarketRole, MemberRole


class CompanyCreate(BaseModel):
    legal_name: str = Field(min_length=2, max_length=200)
    nit: str
    city: str = Field(min_length=2, max_length=100)
    market_roles: list[MarketRole] = Field(min_length=1)

    @field_validator("nit")
    @classmethod
    def _valid_nit(cls, value: str) -> str:
        return normalize_nit(value)


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    legal_name: str
    nit: str
    city: str
    market_roles: list[MarketRole]
    is_verified: bool
    created_at: datetime


class MemberOut(BaseModel):
    user_id: uuid.UUID
    full_name: str
    email: str
    role: MemberRole


class InvitationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    role: MemberRole
    created_at: datetime


class TeamOut(BaseModel):
    members: list[MemberOut]
    invitations: list[InvitationOut]


class InviteIn(BaseModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=320)
    role: MemberRole = MemberRole.MEMBER


class RoleChange(BaseModel):
    role: MemberRole
