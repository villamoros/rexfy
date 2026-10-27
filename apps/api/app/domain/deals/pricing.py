from decimal import Decimal

from app.domain.listings.enums import QuantityUnit

_KG_PER = {QuantityUnit.KG: Decimal(1), QuantityUnit.TON: Decimal(1000)}


def offer_total(
    quantity: Decimal, quantity_unit: QuantityUnit, price: Decimal, price_unit: QuantityUnit
) -> Decimal | None:
    """Total in COP, or None when the quantity and price units can't be converted."""
    if quantity_unit == price_unit:
        return (quantity * price).quantize(Decimal("0.01"))
    if quantity_unit in _KG_PER and price_unit in _KG_PER:
        in_price_units = quantity * _KG_PER[quantity_unit] / _KG_PER[price_unit]
        return (in_price_units * price).quantize(Decimal("0.01"))
    return None
