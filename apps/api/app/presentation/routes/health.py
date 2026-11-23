from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from redis import Redis
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.application import outbox
from app.core.config import get_settings
from app.infrastructure.db.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/ready")
def readiness(db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    checks: dict[str, str] = {}
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = "ok"
        outbox_health = outbox.health(db)
        oldest = outbox_health.oldest_unprocessed_at
        age_seconds = 0 if oldest is None else (datetime.now(UTC) - oldest).total_seconds()
        checks["outbox"] = (
            "ok" if age_seconds <= get_settings().outbox_alert_age_seconds else "error"
        )
    except Exception:
        checks["database"] = "error"
        checks["outbox"] = "error"
    try:
        Redis.from_url(get_settings().redis_url, socket_connect_timeout=2).ping()
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "error"
    checks["status"] = "ok" if all(v == "ok" for v in checks.values()) else "degraded"
    return checks
