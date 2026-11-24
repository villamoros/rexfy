"""Shared application policies that do not belong to a feature service."""

import uuid
from collections.abc import Collection

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.db.models import User


class NotAllowed(Exception):
    pass


class InvalidState(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def company_ids(user: User) -> set[uuid.UUID]:
    return {membership.company_id for membership in user.memberships}


def belongs_to(user: User, companies: Collection[uuid.UUID]) -> bool:
    return bool(company_ids(user).intersection(companies))


def lock(db: Session, row: object) -> None:
    """Lock and refresh one aggregate root for the rest of the transaction."""
    model = type(row)
    db.execute(select(model.id).where(model.id == row.id).with_for_update())
    db.refresh(row)
