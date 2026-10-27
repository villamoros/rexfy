from datetime import date
from decimal import Decimal

from app.domain.listings.enums import Availability, PricingType, QuantityUnit


def check_listing_terms(
    *,
    quantity: Decimal,
    min_order_quantity: Decimal | None,
    availability: Availability,
    available_from: date | None,
    pricing_type: PricingType,
    price: Decimal | None,
    price_unit: QuantityUnit | None,
) -> None:
    """Cross-field rules for every listing. Raises ValueError with a user-facing message."""
    if min_order_quantity is not None and min_order_quantity > quantity:
        raise ValueError("La cantidad mínima no puede superar la cantidad disponible")
    if availability is Availability.SPECIFIC_DATE and available_from is None:
        raise ValueError("Indica la fecha desde la que el material está disponible")
    if pricing_type is PricingType.PAID and (price is None or price_unit is None):
        raise ValueError("Indica el precio y su unidad, o marca el material como gratuito")
