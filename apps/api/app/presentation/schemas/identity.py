import uuid

from pydantic import BaseModel, EmailStr, Field

from app.domain.organizations.roles import MarketRole, MemberRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=200)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MembershipOut(BaseModel):
    company_id: uuid.UUID
    legal_name: str
    market_roles: list[MarketRole]
    role: MemberRole


class MeResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    is_platform_admin: bool
    companies: list[MembershipOut]
