import uuid

from pydantic import BaseModel

from app.domain.organizations.roles import MarketRole, MemberRole


class MembershipOut(BaseModel):
    company_id: uuid.UUID
    legal_name: str
    market_roles: list[MarketRole]
    is_verified: bool
    role: MemberRole


class MeResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    is_platform_admin: bool
    companies: list[MembershipOut]
