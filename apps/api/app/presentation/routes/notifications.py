import uuid
from datetime import datetime

from fastapi import APIRouter, status
from pydantic import BaseModel, ConfigDict

from app.application import notifications as service
from app.presentation.deps import CurrentUser, DbSession

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    kind: str
    title: str
    body: str
    link: str
    read_at: datetime | None
    created_at: datetime


class UnreadCount(BaseModel):
    unread: int


@router.get("")
def inbox(db: DbSession, user: CurrentUser) -> list[NotificationOut]:
    return [NotificationOut.model_validate(n) for n in service.inbox(db, user)]


@router.get("/unread-count")
def unread(db: DbSession, user: CurrentUser) -> UnreadCount:
    return UnreadCount(unread=service.unread_count(db, user))


@router.post("/read", status_code=status.HTTP_204_NO_CONTENT)
def read_all(db: DbSession, user: CurrentUser) -> None:
    service.mark_read(db, user)


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def read_one(notification_id: uuid.UUID, db: DbSession, user: CurrentUser) -> None:
    service.mark_read(db, user, notification_id)
