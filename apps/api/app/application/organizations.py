import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application import audit
from app.domain.organizations.roles import MarketRole, MemberRole
from app.infrastructure.db.models import Company, CompanyMember, User


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
