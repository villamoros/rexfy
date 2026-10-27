from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.application.identity import resolve_user
from app.infrastructure.auth.clerk import Clerk, ClerkUnavailable, get_clerk
from app.infrastructure.db.models import User
from app.infrastructure.db.session import get_db

DbSession = Annotated[Session, Depends(get_db)]
ClerkDep = Annotated[Clerk, Depends(get_clerk)]

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    db: DbSession,
    clerk: ClerkDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    clerk_user_id = clerk.verify(credentials.credentials)
    if clerk_user_id is None:
        raise unauthorized
    try:
        user = resolve_user(db, clerk_user_id, clerk.profile)
    except ClerkUnavailable:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "No pudimos validar tu cuenta, intenta de nuevo"
        ) from None
    if not user.is_active:
        raise unauthorized
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_optional_user(
    db: DbSession,
    clerk: ClerkDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User | None:
    if credentials is None:
        return None
    return get_current_user(db, clerk, credentials)


def get_admin(user: CurrentUser) -> User:
    if not user.is_platform_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Solo para el equipo de RexFy")
    return user


AdminUser = Annotated[User, Depends(get_admin)]

OptionalUser = Annotated[User | None, Depends(get_optional_user)]
