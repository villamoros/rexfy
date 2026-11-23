from typing import Annotated

from fastapi import Depends, Header, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.application.identity import EmailNotVerified, resolve_user
from app.application.pagination import InvalidCursor, PageRequest, decode_cursor
from app.application.unit_of_work import SqlAlchemyUnitOfWork, unit_of_work
from app.infrastructure.auth.clerk import Clerk, ClerkUnavailable, get_clerk
from app.infrastructure.db.models import User
from app.infrastructure.db.session import get_db

DbSession = Annotated[Session, Depends(get_db)]


def get_unit_of_work(db: DbSession):
    yield from unit_of_work(db)


UnitOfWork = Annotated[SqlAlchemyUnitOfWork, Depends(get_unit_of_work)]


def get_page_request(
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    cursor: Annotated[str | None, Query(max_length=500)] = None,
) -> PageRequest:
    try:
        return PageRequest(limit=limit, after=decode_cursor(cursor) if cursor else None)
    except InvalidCursor as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc


PageParams = Annotated[PageRequest, Depends(get_page_request)]
ClerkDep = Annotated[Clerk, Depends(get_clerk)]
IdempotencyKey = Annotated[
    str,
    Header(
        alias="Idempotency-Key",
        min_length=8,
        max_length=255,
        pattern=r"^[A-Za-z0-9._:-]+$",
    ),
]

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
    except EmailNotVerified:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Confirma tu email en tu cuenta para continuar"
        ) from None
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
    try:
        return get_current_user(db, clerk, credentials)
    except HTTPException as exc:
        # An expired or bad token on a public page just means a visitor.
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            return None
        raise


def get_admin(user: CurrentUser) -> User:
    if not user.is_platform_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Solo para el equipo de RexFy")
    return user


AdminUser = Annotated[User, Depends(get_admin)]

OptionalUser = Annotated[User | None, Depends(get_optional_user)]
