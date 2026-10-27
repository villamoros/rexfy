from fastapi import APIRouter

from app.presentation.deps import CurrentUser
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
                role=m.role,
            )
            for m in user.memberships
        ],
    )
