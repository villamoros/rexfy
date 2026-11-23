"""Transactional outbox, retry policy, delivery ledger and operational health."""

import hashlib
import logging
import time
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.application import audit
from app.core.config import get_settings
from app.domain.notifications.enums import OutboxStatus
from app.infrastructure.db.models import (
    CompanyMember,
    OutboxDelivery,
    OutboxEvent,
    User,
)
from app.infrastructure.email import send_email

log = logging.getLogger("rexfy.outbox")

COMPANY_EMAIL = "company.email"
DIRECT_EMAIL = "direct.email"
BACKOFF = (
    timedelta(minutes=1),
    timedelta(minutes=5),
    timedelta(minutes=15),
    timedelta(hours=1),
    timedelta(hours=6),
    timedelta(hours=12),
    timedelta(hours=24),
)


class InvalidState(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


@dataclass
class DispatchResult:
    claimed: int = 0
    processed: int = 0
    retried: int = 0
    failed: int = 0


@dataclass
class Health:
    pending: int
    processing: int
    retry: int
    failed: int
    processed_24h: int
    due: int
    oldest_unprocessed_at: datetime | None


def _now() -> datetime:
    return datetime.now(UTC)


def queue_company_email(
    db: Session,
    *,
    company_id: uuid.UUID,
    title: str,
    body: str,
    link: str,
    dedupe_key: str,
) -> OutboxEvent:
    return _queue(
        db,
        kind=COMPANY_EMAIL,
        payload={"company_id": str(company_id), "title": title, "body": body, "link": link},
        dedupe_key=dedupe_key,
    )


def queue_email(
    db: Session,
    *,
    to: str,
    subject: str,
    text: str,
    dedupe_key: str,
) -> OutboxEvent:
    return _queue(
        db,
        kind=DIRECT_EMAIL,
        payload={"to": to.strip().lower(), "subject": subject, "text": text},
        dedupe_key=dedupe_key,
    )


def _queue(db: Session, *, kind: str, payload: dict[str, Any], dedupe_key: str) -> OutboxEvent:
    event = OutboxEvent(
        kind=kind,
        payload=payload,
        dedupe_key=dedupe_key,
        status=OutboxStatus.PENDING,
        attempts=0,
        available_at=_now(),
    )
    db.add(event)
    return event


def claim_due(db: Session, *, limit: int | None = None) -> list[uuid.UUID]:
    settings = get_settings()
    now = _now()
    stale = now - timedelta(seconds=settings.outbox_processing_timeout_seconds)
    stmt = (
        select(OutboxEvent)
        .where(
            or_(
                (
                    OutboxEvent.status.in_([OutboxStatus.PENDING, OutboxStatus.RETRY])
                    & (OutboxEvent.available_at <= now)
                ),
                (
                    (OutboxEvent.status == OutboxStatus.PROCESSING)
                    & (OutboxEvent.locked_at <= stale)
                ),
            )
        )
        .order_by(OutboxEvent.available_at, OutboxEvent.created_at)
        .limit(limit or settings.outbox_batch_size)
        .with_for_update(skip_locked=True)
    )
    events = list(db.scalars(stmt))
    for event in events:
        event.status = OutboxStatus.PROCESSING
        event.attempts += 1
        event.locked_at = now
        event.last_attempt_at = now
    db.commit()
    return [event.id for event in events]


def _recipients(db: Session, event: OutboxEvent) -> list[str]:
    if event.kind == DIRECT_EMAIL:
        return [str(event.payload["to"]).strip().lower()]
    if event.kind == COMPANY_EMAIL:
        company_id = uuid.UUID(str(event.payload["company_id"]))
        return list(
            db.scalars(
                select(User.email)
                .join(CompanyMember, CompanyMember.user_id == User.id)
                .where(CompanyMember.company_id == company_id, User.is_active.is_(True))
                .order_by(User.email)
            )
        )
    raise InvalidState(f"Tipo de outbox no soportado: {event.kind}")


def _content(event: OutboxEvent) -> tuple[str, str]:
    if event.kind == DIRECT_EMAIL:
        return str(event.payload["subject"]), str(event.payload["text"])
    settings = get_settings()
    title = str(event.payload["title"])
    body = str(event.payload.get("body", ""))
    link = str(event.payload["link"])
    url = f"{settings.public_web_url.rstrip('/')}{link}"
    text = f"{body}\n\nVer en RexFy: {url}\n" if body else f"Ver en RexFy: {url}\n"
    return f"RexFy · {title}", text


def _message_id(event_id: uuid.UUID, recipient: str) -> str:
    recipient_hash = hashlib.sha256(recipient.encode()).hexdigest()[:16]
    return f"<{event_id}.{recipient_hash}@outbox.rexfy.co>"


def _delivery(db: Session, event_id: uuid.UUID, recipient: str) -> OutboxDelivery:
    delivery = db.scalar(
        select(OutboxDelivery).where(
            OutboxDelivery.event_id == event_id,
            OutboxDelivery.recipient == recipient,
        )
    )
    if delivery is None:
        delivery = OutboxDelivery(event_id=event_id, recipient=recipient, attempts=0)
        db.add(delivery)
        db.flush()
    return delivery


def _record_failure(db: Session, event_id: uuid.UUID, error: Exception) -> OutboxStatus:
    db.rollback()
    event = db.get(OutboxEvent, event_id, with_for_update=True)
    if event is None:
        raise LookupError(event_id)
    message = f"{type(error).__name__}: {error}"[:4000]
    event.last_error = message
    event.locked_at = None
    settings = get_settings()
    if event.attempts >= settings.outbox_max_attempts:
        event.status = OutboxStatus.FAILED
        event.failed_at = _now()
        log.error(
            "Outbox agotado",
            extra={"fields": {"outbox_id": str(event.id), "attempts": event.attempts}},
        )
    else:
        event.status = OutboxStatus.RETRY
        delay = BACKOFF[min(max(event.attempts - 1, 0), len(BACKOFF) - 1)]
        event.available_at = _now() + delay
        log.warning(
            "Outbox reprogramado",
            extra={"fields": {"outbox_id": str(event.id), "attempts": event.attempts}},
        )
    db.commit()
    return event.status


def process_event(db: Session, event_id: uuid.UUID) -> OutboxStatus:
    event = db.get(OutboxEvent, event_id, with_for_update=True)
    if event is None:
        raise LookupError(event_id)
    if event.status is OutboxStatus.PROCESSED:
        return event.status
    if event.status is OutboxStatus.FAILED:
        return event.status
    if event.status is not OutboxStatus.PROCESSING:
        event.status = OutboxStatus.PROCESSING
        event.attempts += 1
        event.last_attempt_at = _now()
        event.locked_at = event.last_attempt_at
    db.commit()

    try:
        event = db.get(OutboxEvent, event_id)
        subject, text = _content(event)
        for recipient in _recipients(db, event):
            delivery = _delivery(db, event.id, recipient)
            if delivery.delivered_at is not None:
                continue
            delivery.attempts += 1
            db.commit()
            try:
                send_email(
                    recipient,
                    subject,
                    text,
                    message_id=_message_id(event.id, recipient),
                )
            except Exception as exc:
                delivery = db.get(OutboxDelivery, delivery.id)
                delivery.last_error = f"{type(exc).__name__}: {exc}"[:4000]
                db.commit()
                raise
            delivery = db.get(OutboxDelivery, delivery.id)
            delivery.delivered_at = _now()
            delivery.last_error = None
            db.commit()

        event = db.get(OutboxEvent, event_id, with_for_update=True)
        event.status = OutboxStatus.PROCESSED
        event.processed_at = _now()
        event.locked_at = None
        event.last_error = None
        db.commit()
        return event.status
    except Exception as exc:
        return _record_failure(db, event_id, exc)


def dispatch_due(db: Session, *, limit: int | None = None) -> DispatchResult:
    ids = claim_due(db, limit=limit)
    result = DispatchResult(claimed=len(ids))
    for event_id in ids:
        status = process_event(db, event_id)
        if status is OutboxStatus.PROCESSED:
            result.processed += 1
        elif status is OutboxStatus.RETRY:
            result.retried += 1
        elif status is OutboxStatus.FAILED:
            result.failed += 1
    return result


def run_forever() -> None:
    from app.infrastructure.db.session import SessionLocal

    settings = get_settings()
    log.info("Worker de outbox iniciado")
    while True:
        try:
            with SessionLocal() as db:
                result = dispatch_due(db)
            if result.claimed:
                log.info(
                    "Lote de outbox procesado",
                    extra={"fields": result.__dict__},
                )
        except Exception:
            log.exception("Falló el ciclo del outbox")
        time.sleep(settings.outbox_poll_seconds)


def health(db: Session) -> Health:
    counts = dict(
        db.execute(
            select(OutboxEvent.status, func.count(OutboxEvent.id)).group_by(OutboxEvent.status)
        ).all()
    )
    now = _now()
    unprocessed = [OutboxStatus.PENDING, OutboxStatus.RETRY, OutboxStatus.PROCESSING]
    return Health(
        pending=counts.get(OutboxStatus.PENDING, 0),
        processing=counts.get(OutboxStatus.PROCESSING, 0),
        retry=counts.get(OutboxStatus.RETRY, 0),
        failed=counts.get(OutboxStatus.FAILED, 0),
        processed_24h=db.scalar(
            select(func.count(OutboxEvent.id)).where(
                OutboxEvent.status == OutboxStatus.PROCESSED,
                OutboxEvent.processed_at >= now - timedelta(hours=24),
            )
        )
        or 0,
        due=db.scalar(
            select(func.count(OutboxEvent.id)).where(
                OutboxEvent.status.in_([OutboxStatus.PENDING, OutboxStatus.RETRY]),
                OutboxEvent.available_at <= now,
            )
        )
        or 0,
        oldest_unprocessed_at=db.scalar(
            select(func.min(OutboxEvent.created_at)).where(OutboxEvent.status.in_(unprocessed))
        ),
    )


def recent(db: Session, *, limit: int = 30) -> list[OutboxEvent]:
    return list(
        db.scalars(select(OutboxEvent).order_by(OutboxEvent.created_at.desc()).limit(limit))
    )


def replay(db: Session, admin: User, event: OutboxEvent) -> OutboxEvent:
    event = db.get(OutboxEvent, event.id, with_for_update=True)
    if event.status is not OutboxStatus.FAILED:
        raise InvalidState("Solo se pueden reintentar eventos agotados")
    event.status = OutboxStatus.RETRY
    event.available_at = _now()
    event.locked_at = None
    event.failed_at = None
    event.last_error = None
    audit.record(db, admin, "outbox.replayed", event, attempts=event.attempts)
    db.commit()
    return event
