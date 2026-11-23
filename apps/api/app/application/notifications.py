"""In-app notifications and their durable email side effects."""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.application import outbox
from app.infrastructure.db.models import Notification, User

# A busy chat would otherwise send an email per message.
QUIET_PERIOD = timedelta(minutes=30)


def notify(
    db: Session,
    company_id: uuid.UUID,
    *,
    kind: str,
    title: str,
    body: str = "",
    link: str,
    email: bool = True,
) -> None:
    """Tell a company about something. Repeats about the same link within the quiet period
    refresh the unread notification instead of piling up, and are not emailed again."""
    since = datetime.now(UTC) - QUIET_PERIOD
    recent = db.scalar(
        select(Notification).where(
            Notification.company_id == company_id,
            Notification.link == link,
            Notification.kind == kind,
            Notification.read_at.is_(None),
            Notification.created_at >= since,
        )
    )
    if recent is not None:
        recent.title, recent.body = title, body
        return
    notification = Notification(company_id=company_id, kind=kind, title=title, body=body, link=link)
    db.add(notification)
    db.flush()
    if email:
        outbox.queue_company_email(
            db,
            company_id=company_id,
            title=title,
            body=body,
            link=link,
            dedupe_key=f"notification.email:{notification.id}",
        )


def _company_ids(user: User) -> list[uuid.UUID]:
    return [m.company_id for m in user.memberships]


def inbox(db: Session, user: User, *, limit: int = 30) -> list[Notification]:
    stmt = (
        select(Notification)
        .where(Notification.company_id.in_(_company_ids(user)))
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt))


def unread_count(db: Session, user: User) -> int:
    return (
        db.scalar(
            select(func.count(Notification.id)).where(
                Notification.company_id.in_(_company_ids(user)), Notification.read_at.is_(None)
            )
        )
        or 0
    )


def mark_read(db: Session, user: User, notification_id: uuid.UUID | None = None) -> None:
    stmt = update(Notification).where(
        Notification.company_id.in_(_company_ids(user)), Notification.read_at.is_(None)
    )
    if notification_id is not None:
        stmt = stmt.where(Notification.id == notification_id)
    db.execute(stmt.values(read_at=datetime.now(UTC)))
    db.commit()
