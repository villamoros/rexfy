from fastapi import APIRouter

from app.application.dashboard import company_kpis
from app.presentation.deps import CurrentUser, DbSession
from app.presentation.schemas.dashboard import CompanyKpisOut
from app.presentation.schemas.identity import MembershipOut, MeResponse

router = APIRouter(tags=["auth"])


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
                is_verified=m.company.is_verified,
                role=m.role,
            )
            for m in user.memberships
        ],
    )


@router.get("/me/dashboard")
def dashboard(user: CurrentUser, db: DbSession) -> list[CompanyKpisOut]:
    return [CompanyKpisOut.model_validate(k, from_attributes=True) for k in company_kpis(db, user)]
