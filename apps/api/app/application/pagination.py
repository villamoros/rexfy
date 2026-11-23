"""Stable keyset pagination shared by operational read models."""

import base64
import json
import uuid
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session


class InvalidCursor(ValueError):
    pass


@dataclass(frozen=True)
class Cursor:
    created_at: datetime
    entity_id: uuid.UUID


@dataclass(frozen=True)
class PageRequest:
    limit: int = 25
    after: Cursor | None = None


@dataclass(frozen=True)
class Page[T]:
    items: list[T]
    next_cursor: str | None


def encode_cursor(created_at: datetime, entity_id: uuid.UUID) -> str:
    payload = json.dumps(
        {"created_at": created_at.isoformat(), "id": str(entity_id)},
        separators=(",", ":"),
    ).encode()
    return base64.urlsafe_b64encode(payload).decode().rstrip("=")


def decode_cursor(value: str) -> Cursor:
    try:
        payload = json.loads(base64.urlsafe_b64decode(value + "=" * (-len(value) % 4)))
        return Cursor(
            created_at=datetime.fromisoformat(payload["created_at"]),
            entity_id=uuid.UUID(payload["id"]),
        )
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise InvalidCursor("Cursor de paginación no válido") from exc


def paginate[T](
    db: Session,
    stmt,
    request: PageRequest,
    *,
    model: type[T],
    created_at=None,
    entity_id=None,
    created_at_attribute: str = "created_at",
) -> Page[T]:
    """Execute a newest-first query with a deterministic `(created_at, id)` cursor."""
    created_at = model.created_at if created_at is None else created_at
    entity_id = model.id if entity_id is None else entity_id
    if request.after:
        stmt = stmt.where(
            or_(
                created_at < request.after.created_at,
                and_(
                    created_at == request.after.created_at,
                    entity_id < request.after.entity_id,
                ),
            )
        )
    stmt = stmt.order_by(created_at.desc(), entity_id.desc()).limit(request.limit + 1)
    rows = list(db.scalars(stmt).unique())
    has_more = len(rows) > request.limit
    items = rows[: request.limit]
    next_cursor = None
    if has_more and items:
        last = items[-1]
        next_cursor = encode_cursor(getattr(last, created_at_attribute), last.id)
    return Page(items=items, next_cursor=next_cursor)


def select_page[T](db: Session, model: type[T], request: PageRequest) -> Page[T]:
    return paginate(db, select(model), request, model=model)
