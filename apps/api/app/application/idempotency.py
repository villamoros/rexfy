import hashlib
import json
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import delete, select, text
from sqlalchemy.orm import Session

from app.infrastructure.db.base import Base
from app.infrastructure.db.models import IdempotencyRecord, User

RETENTION = timedelta(hours=24)


class Conflict(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def fingerprint(payload: Any) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(canonical.encode()).hexdigest()


def _lock_id(user_id: uuid.UUID, scope: str, key: str) -> int:
    digest = hashlib.sha256(f"{user_id}:{scope}:{key}".encode()).digest()[:8]
    return int.from_bytes(digest, byteorder="big", signed=True)


def find(
    db: Session,
    user: User,
    *,
    scope: str,
    key: str,
    request_hash: str,
) -> IdempotencyRecord | None:
    """Serialize one command key and return its committed result, when present."""
    db.execute(
        text("SELECT pg_advisory_xact_lock(:lock_id)"),
        {"lock_id": _lock_id(user.id, scope, key)},
    )
    record = db.scalar(
        select(IdempotencyRecord).where(
            IdempotencyRecord.user_id == user.id,
            IdempotencyRecord.scope == scope,
            IdempotencyRecord.key == key,
        )
    )
    if record is None:
        return None
    if record.expires_at <= datetime.now(UTC):
        db.delete(record)
        db.flush()
        return None
    if record.request_hash != request_hash:
        raise Conflict("La clave de idempotencia ya se usó con datos diferentes")
    return record


def remember(
    db: Session,
    user: User,
    *,
    scope: str,
    key: str,
    request_hash: str,
    resource: Base,
) -> None:
    db.flush()
    db.add(
        IdempotencyRecord(
            user_id=user.id,
            scope=scope,
            key=key,
            request_hash=request_hash,
            resource_type=resource.__tablename__,
            resource_id=resource.id,
            expires_at=datetime.now(UTC) + RETENTION,
        )
    )


def replay[ModelT: Base](db: Session, record: IdempotencyRecord, model: type[ModelT]) -> ModelT:
    if record.resource_type != model.__tablename__:
        raise Conflict("La clave de idempotencia pertenece a otra operación")
    resource = db.get(model, record.resource_id)
    if resource is None:
        raise Conflict("El resultado idempotente ya no está disponible")
    return resource


def purge_expired(db: Session) -> int:
    """Maintenance hook for a future scheduled cleanup job."""
    result = db.execute(
        delete(IdempotencyRecord).where(IdempotencyRecord.expires_at <= datetime.now(UTC))
    )
    return result.rowcount or 0
