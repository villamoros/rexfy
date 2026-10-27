from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.infrastructure.db.models import User


class EmailAlreadyRegistered(Exception):
    pass


def register_user(db: Session, *, email: str, password: str, full_name: str) -> User:
    email = email.lower()
    if db.scalar(select(User.id).where(func.lower(User.email) == email)):
        raise EmailAlreadyRegistered
    user = User(email=email, password_hash=hash_password(password), full_name=full_name.strip())
    db.add(user)
    db.commit()
    return user


def authenticate(db: Session, *, email: str, password: str) -> User | None:
    user = db.scalar(select(User).where(func.lower(User.email) == email.lower()))
    if user is None or not user.is_active or not verify_password(password, user.password_hash):
        return None
    return user
