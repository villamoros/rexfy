import uuid

from fastapi import APIRouter, HTTPException, status

from app.application.organizations import NitAlreadyRegistered, create_company, get_company
from app.presentation.deps import CurrentUser, DbSession
from app.presentation.schemas.organizations import CompanyCreate, CompanyOut

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
