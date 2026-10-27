"""In-app notifications for companies, plus an email to their members once the change commits."""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import event, func, select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.infrastructure.db.models import CompanyMember, Notification, User
from app.infrastructure.email import send_email
from app.infrastructure.tasks import enqueue

# A busy chat would otherwise send an email per message.
QUIET_PERIOD = timedelta(minutes=30)

_OUTBOX = "rexfy_outbox"


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
    db.add(Notification(company_id=company_id, kind=kind, title=title, body=body, link=link))
    if email:
        db.info.setdefault(_OUTBOX, []).append((company_id, title, body, link))


@event.listens_for(Session, "after_commit")
def _send_outbox(session: Session) -> None:
    outbox = session.info.pop(_OUTBOX, [])
    for company_id, title, body, link in outbox:
        enqueue(email_company, str(company_id), title, body, link)


@event.listens_for(Session, "after_rollback")
def _drop_outbox(session: Session) -> None:
    session.info.pop(_OUTBOX, None)


def email_company(company_id: str, title: str, body: str, link: str) -> None:
    """Worker job: email every active member of the company."""
    from app.infrastructure.db.session import SessionLocal

    url = f"{get_settings().public_web_url.rstrip('/')}{link}"
    with SessionLocal() as db:
        emails = db.scalars(
            select(User.email)
            .join(CompanyMember, CompanyMember.user_id == User.id)
            .where(CompanyMember.company_id == uuid.UUID(company_id), User.is_active.is_(True))
        ).all()
    text = f"{body}\n\nVer en RexFy: {url}\n" if body else f"Ver en RexFy: {url}\n"
    for address in emails:
        send_email(address, f"RexFy · {title}", text)


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
