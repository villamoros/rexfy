from decimal import Decimal

from app.domain.deals.pricing import offer_total
from app.domain.listings.enums import QuantityUnit as U


def test_totals_convert_tons_and_kilos() -> None:
    assert offer_total(Decimal("4.5"), U.TON, Decimal(820), U.KG) == Decimal("3690000.00")
    assert offer_total(Decimal(500), U.KG, Decimal(900000), U.TON) == Decimal("450000.00")
    assert offer_total(Decimal(200), U.UNIT, Decimal(15000), U.UNIT) == Decimal("3000000.00")


def test_total_unknown_for_incompatible_units() -> None:
    assert offer_total(Decimal(3), U.M3, Decimal(100), U.KG) is None
