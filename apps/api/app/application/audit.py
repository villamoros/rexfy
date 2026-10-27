import uuid
from decimal import Decimal
from enum import Enum
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.db.models import AuditLog, User


def _plain(value: Any) -> Any:
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, (Decimal, uuid.UUID)):
        return str(value)
    if isinstance(value, dict):
        return {k: _plain(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_plain(v) for v in value]
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def record(
    db: Session,
    actor: User | None,
    action: str,
    entity: Any,
    *,
    company_id: uuid.UUID | None = None,
    **data: Any,
) -> None:
    """Add an audit entry to the current transaction; it is saved with the action it records."""
    if entity.id is None:
        db.flush()  # New rows get their id on flush.
    db.add(
        AuditLog(
            actor_user_id=actor.id if actor else None,
            company_id=company_id,
            action=action,
            entity_type=type(entity).__tablename__,
            entity_id=entity.id,
            data=_plain(data),
        )
    )


def recent(db: Session, *, limit: int = 50, entity_id: uuid.UUID | None = None) -> list[AuditLog]:
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if entity_id is not None:
        stmt = stmt.where(AuditLog.entity_id == entity_id)
    return list(db.scalars(stmt))
