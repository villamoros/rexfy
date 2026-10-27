import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

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
