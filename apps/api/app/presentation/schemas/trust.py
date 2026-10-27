import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.organizations.roles import MarketRole
from app.domain.trust.enums import DisputeReason, DisputeStatus
from app.presentation.schemas.deals import CompanyRef
from app.presentation.schemas.listings import ListingOut


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    rating: int
    comment: str | None
    from_company: CompanyRef
    created_at: datetime


class DisputeCreate(BaseModel):
    reason: DisputeReason
    description: str = Field(min_length=10, max_length=4000)


class DisputeResolve(BaseModel):
    resolution: str = Field(min_length=10, max_length=4000)
    at_fault_company_id: uuid.UUID | None = None


class DisputeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    transaction_id: uuid.UUID
    opened_by: CompanyRef
    reason: DisputeReason
    description: str
    status: DisputeStatus
    resolution: str | None
    at_fault_company_id: uuid.UUID | None
    created_at: datetime
    resolved_at: datetime | None


class AdminDisputeOut(DisputeOut):
    order_code: str
    buyer: CompanyRef
    seller: CompanyRef


class CompanyProfile(BaseModel):
    id: uuid.UUID
    legal_name: str
    city: str
    market_roles: list[MarketRole]
    is_verified: bool
    member_since: datetime
    trust_score: int
    average_rating: float | None
    review_count: int
    completed_orders: int
    reviews: list[ReviewOut]
    listings: list[ListingOut]
