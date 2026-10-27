"""Loads demo companies and published listings so the marketplace has something to show.

Run from apps/api:  uv run python -m app.cli.seed
Safe to run twice: companies that already exist (by NIT) are skipped.
"""

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.domain.listings.enums import (
    Availability,
    ListingStatus,
    MaterialCategory,
    MaterialCondition,
    PricingType,
    QuantityUnit,
)
from app.domain.organizations.nit import check_digit
from app.domain.organizations.roles import MarketRole, MemberRole
from app.infrastructure.db.models import Company, CompanyMember, Listing, User
from app.infrastructure.db.session import SessionLocal

T, KG = QuantityUnit.TON, QuantityUnit.KG

# (legal name, NIT base, city, market roles, listings)
# Each listing: (category, title, description, condition, quantity, unit, price per unit or None)
DEMO = [
    (
        "Plásticos Andinos S.A.S. (demo)",
        "901000101",
        "Bogotá",
        [MarketRole.GENERATOR],
        [
            (
                MaterialCategory.PLASTIC,
                "PET transparente prensado",
                "Pacas de 300 kg, sin etiquetas.",
                MaterialCondition.CLEAN_SEPARATED,
                "12",
                T,
                "1450000",
            ),
            (
                MaterialCategory.PLASTIC,
                "Polietileno de baja densidad (strech)",
                "Película de embalaje.",
                MaterialCondition.MIXED,
                "4.5",
                T,
                "900000",
            ),
        ],
    ),
    (
        "Metales del Valle S.A.S. (demo)",
        "901000202",
        "Cali",
        [MarketRole.GENERATOR, MarketRole.BUYER],
        [
            (
                MaterialCategory.METAL,
                "Chatarra de aluminio perfil",
                "Recortes de carpintería metálica.",
                MaterialCondition.PREPROCESSED,
                "3",
                T,
                "5200000",
            ),
            (
                MaterialCategory.METAL,
                "Cobre de cableado",
                "Cable pelado, grado 2.",
                MaterialCondition.CLEAN_SEPARATED,
                "800",
                KG,
                "28000",
            ),
        ],
    ),
    (
        "Cartones de Antioquia S.A.S. (demo)",
        "901000303",
        "Medellín",
        [MarketRole.GENERATOR],
        [
            (
                MaterialCategory.PAPER_CARDBOARD,
                "Cartón corrugado",
                "Cajas desarmadas, secas.",
                MaterialCondition.CLEAN_SEPARATED,
                "20",
                T,
                "450000",
            ),
            (
                MaterialCategory.WOOD,
                "Estibas de madera dañadas",
                "Para astillar o reparar.",
                MaterialCondition.NEEDS_SORTING,
                "150",
                QuantityUnit.UNIT,
                None,
            ),
        ],
    ),
]


def seed(db: Session) -> int:
    """Create the demo data that is missing. Returns how many companies were created."""
    created = 0
    now = datetime.now(UTC)
    for i, (name, base, city, roles, listings) in enumerate(DEMO):
        nit = f"{base}-{check_digit(base)}"
        if db.scalar(select(Company.id).where(Company.nit == nit)):
            continue
        user = User(email=f"demo{i + 1}@rexfy.example", full_name=f"Contacto {name.split()[0]}")
        company = Company(legal_name=name, nit=nit, city=city, market_roles=roles, is_verified=True)
        db.add_all(
            [user, company, CompanyMember(company=company, user=user, role=MemberRole.OWNER)]
        )
        for j, (category, title, description, condition, qty, unit, price) in enumerate(listings):
            db.add(
                Listing(
                    company=company,
                    status=ListingStatus.PUBLISHED,
                    published_at=now - timedelta(hours=i * 3 + j),
                    category=category,
                    title=title,
                    description=description,
                    condition=condition,
                    quantity=Decimal(qty),
                    quantity_unit=unit,
                    availability=Availability.IMMEDIATE,
                    city=city,
                    pickup_allowed=True,
                    pricing_type=PricingType.PAID if price else PricingType.FREE,
                    price=Decimal(price) if price else None,
                    price_unit=unit if price else None,
                    price_negotiable=bool(price),
                )
            )
        created += 1
    db.commit()
    return created


def main() -> None:
    if get_settings().env not in ("local", "test"):
        raise SystemExit("Los datos de demo solo se cargan en local (REXFY_ENV=local).")
    with SessionLocal() as db:
        created = seed(db)
    print(f"Listo: {created} empresas de demo creadas ({len(DEMO) - created} ya existían).")


if __name__ == "__main__":
    main()
