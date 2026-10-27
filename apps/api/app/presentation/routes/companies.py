import uuid

from fastapi import APIRouter, HTTPException, status

from app.application import organizations as service
from app.application.organizations import NitAlreadyRegistered, create_company, get_company
from app.infrastructure.db.models import User
from app.presentation.deps import CurrentUser, DbSession
from app.presentation.schemas.organizations import (
    CompanyCreate,
    CompanyOut,
    InvitationOut,
    InviteIn,
    MemberOut,
    RoleChange,
    TeamOut,
)

router = APIRouter(prefix="/companies", tags=["companies"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create(body: CompanyCreate, user: CurrentUser, db: DbSession) -> CompanyOut:
    try:
        company = create_company(
            db,
            owner=user,
            legal_name=body.legal_name,
            nit=body.nit,
            city=body.city,
            market_roles=body.market_roles,
        )
    except NitAlreadyRegistered:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Ya hay una empresa registrada con ese NIT"
        ) from None
    return CompanyOut.model_validate(company)


@router.get("/{company_id}")
def read(company_id: uuid.UUID, _: CurrentUser, db: DbSession) -> CompanyOut:
    company = get_company(db, company_id)
    if company is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa no encontrada")
    return CompanyOut.model_validate(company)


def _team_out(db: DbSession, user: User, company_id: uuid.UUID) -> TeamOut:
    try:
        members, pending = service.team(db, user, company_id)
    except service.NotAllowed:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa no encontrada") from None
    return TeamOut(
        members=[
            MemberOut(
                user_id=m.user_id, full_name=m.user.full_name, email=m.user.email, role=m.role
            )
            for m in members
        ],
        invitations=[InvitationOut.model_validate(i) for i in pending],
    )


def _team_errors(action):
    try:
        return action()
    except service.NotAllowed:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Solo el dueño o un admin de la empresa puede hacer esto"
        ) from None
    except service.InvalidTeamChange as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, exc.message) from None
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No encontrado") from None


@router.get("/{company_id}/team")
def team(company_id: uuid.UUID, user: CurrentUser, db: DbSession) -> TeamOut:
    return _team_out(db, user, company_id)


@router.post("/{company_id}/team", status_code=status.HTTP_201_CREATED)
def invite(company_id: uuid.UUID, body: InviteIn, user: CurrentUser, db: DbSession) -> TeamOut:
    _team_errors(lambda: service.invite(db, user, company_id, email=body.email, role=body.role))
    return _team_out(db, user, company_id)


@router.delete("/{company_id}/team/invitations/{invitation_id}")
def cancel_invitation(
    company_id: uuid.UUID, invitation_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> TeamOut:
    _team_errors(lambda: service.cancel_invitation(db, user, company_id, invitation_id))
    return _team_out(db, user, company_id)


@router.patch("/{company_id}/team/{user_id}")
def change_role(
    company_id: uuid.UUID, user_id: uuid.UUID, body: RoleChange, user: CurrentUser, db: DbSession
) -> TeamOut:
    _team_errors(lambda: service.change_role(db, user, company_id, user_id, body.role))
    return _team_out(db, user, company_id)


@router.delete("/{company_id}/team/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove(company_id: uuid.UUID, user_id: uuid.UUID, user: CurrentUser, db: DbSession) -> None:
    _team_errors(lambda: service.remove_member(db, user, company_id, user_id))
