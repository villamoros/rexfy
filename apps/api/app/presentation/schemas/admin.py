import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.domain.notifications.enums import OutboxStatus
from app.presentation.schemas.organizations import CompanyOut


class AdminCompany(CompanyOut):
    members: int


class TakeDown(BaseModel):
    reason: str = Field(min_length=5, max_length=1000)


class AuditEntry(BaseModel):
    id: uuid.UUID
    created_at: datetime
    actor_name: str | None
    company_id: uuid.UUID | None
    action: str
    entity_type: str
    entity_id: uuid.UUID
    data: dict[str, Any]


class OutboxHealthOut(BaseModel):
    pending: int
    processing: int
    retry: int
    failed: int
    processed_24h: int
    due: int
    oldest_unprocessed_at: datetime | None


class OutboxEventOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    kind: str
    status: OutboxStatus
    attempts: int
    available_at: datetime
    created_at: datetime
    last_attempt_at: datetime | None
    processed_at: datetime | None
    failed_at: datetime | None
    last_error: str | None
