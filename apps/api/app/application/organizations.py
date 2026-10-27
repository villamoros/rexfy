import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.application import audit
from app.core.config import get_settings
from app.domain.organizations.roles import MarketRole, MemberRole
from app.infrastructure.db.models import Company, CompanyInvitation, CompanyMember, User
from app.infrastructure.email import send_email
from app.infrastructure.tasks import enqueue


class NitAlreadyRegistered(Exception):
    pass


def create_company(
    db: Session,
    *,
    owner: User,
    legal_name: str,
    nit: str,
    city: str,
    market_roles: list[MarketRole],
) -> Company:
    """Register a company and make `owner` its first member. `nit` must already be normalized."""
    if db.scalar(select(Company.id).where(Company.nit == nit)):
        raise NitAlreadyRegistered
    company = Company(
        legal_name=legal_name.strip(),
        nit=nit,
        city=city.strip(),
        market_roles=sorted(set(market_roles)),
    )
    db.add(company)
    db.add(CompanyMember(company=company, user=owner, role=MemberRole.OWNER))
    audit.record(
        db, owner, "company.created", company, company_id=None, nit=nit, roles=company.market_roles
    )
    db.commit()
    db.refresh(owner)
    return company


def get_company(db: Session, company_id: uuid.UUID) -> Company | None:
    return db.get(Company, company_id)


class NotAllowed(Exception):
    pass


class InvalidTeamChange(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def membership(user: User, company_id: uuid.UUID) -> CompanyMember | None:
    return next((m for m in user.memberships if m.company_id == company_id), None)


def require_committer(user: User, company_id: uuid.UUID) -> None:
    """Owners and admins commit the company (accept quotes, close orders, manage the team)."""
    m = membership(user, company_id)
    if m is None or not m.role.can_commit:
        raise NotAllowed


def team(db: Session, user: User, company_id: uuid.UUID):
    if membership(user, company_id) is None:
        raise NotAllowed
    members = list(
        db.scalars(
            select(CompanyMember)
            .where(CompanyMember.company_id == company_id)
            .order_by(CompanyMember.created_at)
        )
    )
    pending = list(
        db.scalars(
            select(CompanyInvitation)
            .where(
                CompanyInvitation.company_id == company_id,
                CompanyInvitation.accepted_at.is_(None),
            )
            .order_by(CompanyInvitation.created_at)
        )
    )
    return members, pending


def invite(
    db: Session, user: User, company_id: uuid.UUID, *, email: str, role: MemberRole
) -> CompanyMember | CompanyInvitation:
    """Add a teammate. Someone already on RexFy joins at once; anyone else when they sign up."""
    require_committer(user, company_id)
    if role is MemberRole.OWNER:
        raise InvalidTeamChange("Una empresa tiene un solo dueño")
    email = email.strip().lower()
    company = db.get(Company, company_id)
    existing = db.scalar(select(User).where(func.lower(User.email) == email))
    if existing is not None:
        if membership(existing, company_id) is not None:
            raise InvalidTeamChange("Esa persona ya es parte del equipo")
        added = CompanyMember(company_id=company_id, user_id=existing.id, role=role)
        db.add(added)
        audit.record(db, user, "member.added", company, company_id=company_id, email=email)
        db.commit()
        enqueue(
            send_email,
            email,
            f"RexFy · Ahora eres parte de {company.legal_name}",
            f"{user.full_name} te agregó al equipo de {company.legal_name} en RexFy.\n\n"
            f"Entra en {get_settings().public_web_url}/panel\n",
        )
        return added
    if db.scalar(
        select(CompanyInvitation.id).where(
            CompanyInvitation.company_id == company_id, CompanyInvitation.email == email
        )
    ):
        raise InvalidTeamChange("Ya invitaste a ese email")
    invitation = CompanyInvitation(
        company_id=company_id, email=email, role=role, invited_by_user_id=user.id
    )
    db.add(invitation)
    audit.record(db, user, "member.invited", company, company_id=company_id, email=email)
    db.commit()
    enqueue(
        send_email,
        email,
        f"RexFy · {user.full_name} te invita a {company.legal_name}",
        f"{user.full_name} te invitó al equipo de {company.legal_name} en RexFy, el "
        f"marketplace de materiales recuperados.\n\nCrea tu cuenta con este email en "
        f"{get_settings().public_web_url}/registro\n",
    )
    return invitation


def cancel_invitation(
    db: Session, user: User, company_id: uuid.UUID, invitation_id: uuid.UUID
) -> None:
    require_committer(user, company_id)
    invitation = db.get(CompanyInvitation, invitation_id)
    if invitation is None or invitation.company_id != company_id:
        raise LookupError
    db.delete(invitation)
    db.commit()


def _member(db: Session, company_id: uuid.UUID, user_id: uuid.UUID) -> CompanyMember:
    found = db.scalar(
        select(CompanyMember).where(
            CompanyMember.company_id == company_id, CompanyMember.user_id == user_id
        )
    )
    if found is None:
        raise LookupError
    return found


def change_role(
    db: Session, user: User, company_id: uuid.UUID, user_id: uuid.UUID, role: MemberRole
) -> CompanyMember:
    require_committer(user, company_id)
    target = _member(db, company_id, user_id)
    if target.role is MemberRole.OWNER or role is MemberRole.OWNER:
        raise InvalidTeamChange("El dueño de la empresa no cambia de rol")
    target.role = role
    audit.record(db, user, "member.role_changed", target.company, company_id=company_id, role=role)
    db.commit()
    return target


def remove_member(db: Session, user: User, company_id: uuid.UUID, user_id: uuid.UUID) -> None:
    """Managers remove teammates; anyone but the owner may leave on their own."""
    target = _member(db, company_id, user_id)
    if target.user_id != user.id:
        require_committer(user, company_id)
    if target.role is MemberRole.OWNER:
        raise InvalidTeamChange("El dueño no puede salir de la empresa")
    audit.record(db, user, "member.removed", target.company, company_id=company_id, user_id=user_id)
    db.delete(target)
    db.commit()


def accept_invitations(db: Session, user: User) -> None:
    """Join every company that invited this user's email. Called once their email is verified."""
    pending = db.scalars(
        select(CompanyInvitation).where(
            CompanyInvitation.email == user.email.lower(), CompanyInvitation.accepted_at.is_(None)
        )
    ).all()
    for invitation in pending:
        if membership(user, invitation.company_id) is None:
            db.add(
                CompanyMember(
                    company_id=invitation.company_id, user_id=user.id, role=invitation.role
                )
            )
        invitation.accepted_at = datetime.now(UTC)
