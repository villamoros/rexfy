from collections.abc import Callable

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.infrastructure.auth.clerk import Profile
from app.infrastructure.db.models import User


def resolve_user(db: Session, clerk_user_id: str, fetch_profile: Callable[[str], Profile]) -> User:
    """The local user for a Clerk account, created on first sign-in.

    A user that already exists with the same email (created before Clerk) is linked instead.
    """
    user = db.scalar(select(User).where(User.clerk_user_id == clerk_user_id))
    if user is not None:
        return user
    profile = fetch_profile(clerk_user_id)
    user = db.scalar(
        select(User).where(func.lower(User.email) == profile.email, User.clerk_user_id.is_(None))
    )
    if user is None:
        user = User(email=profile.email, full_name=profile.full_name)
        db.add(user)
    user.clerk_user_id = clerk_user_id
    try:
        db.commit()
    except IntegrityError:
        # Two first requests raced; the other one created the user.
        db.rollback()
        return db.scalars(select(User).where(User.clerk_user_id == clerk_user_id)).one()
    return user
