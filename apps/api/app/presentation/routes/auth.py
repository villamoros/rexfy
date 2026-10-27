from fastapi import APIRouter, HTTPException, status

from app.application.identity import EmailAlreadyRegistered, authenticate, register_user
from app.core.security import create_access_token
from app.presentation.deps import CurrentUser, DbSession
from app.presentation.schemas.identity import (
    LoginRequest,
    MembershipOut,
    MeResponse,
    RegisterRequest,
    TokenResponse,
)

router = APIRouter(tags=["auth"])


@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: DbSession) -> TokenResponse:
    try:
        user = register_user(db, email=body.email, password=body.password, full_name=body.full_name)
    except EmailAlreadyRegistered:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Ya existe una cuenta con ese correo"
        ) from None
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/auth/login")
def login(body: LoginRequest, db: DbSession) -> TokenResponse:
    user = authenticate(db, email=body.email, password=body.password)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo o contraseña incorrectos")
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me")
def me(user: CurrentUser) -> MeResponse:
    return MeResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_platform_admin=user.is_platform_admin,
        companies=[
            MembershipOut(
                company_id=m.company.id,
                legal_name=m.company.legal_name,
                market_roles=m.company.market_roles,
                role=m.role,
            )
            for m in user.memberships
        ],
    )
