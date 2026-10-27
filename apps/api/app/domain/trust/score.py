"""RexFy's trust score: a 0-100 summary of the signals a B2B buyer checks first."""

from decimal import Decimal

# Points per signal; they add up to 100.
VERIFIED_POINTS = 40
RATING_POINTS = 40
HISTORY_POINTS = 20

# Ratings weigh in fully from this many reviews, so one 5-star review is not a perfect record.
FULL_WEIGHT_REVIEWS = 5
# Completed orders that earn the full history points.
FULL_HISTORY_ORDERS = 10


def trust_score(
    *,
    is_verified: bool,
    average_rating: Decimal | None,
    review_count: int,
    completed_orders: int,
    lost_disputes: int = 0,
) -> int:
    score = Decimal(VERIFIED_POINTS if is_verified else 0)
    if average_rating is not None and review_count:
        weight = Decimal(min(review_count, FULL_WEIGHT_REVIEWS)) / FULL_WEIGHT_REVIEWS
        score += (average_rating - 1) / 4 * RATING_POINTS * weight
    score += (
        Decimal(min(completed_orders, FULL_HISTORY_ORDERS)) / FULL_HISTORY_ORDERS * (HISTORY_POINTS)
    )
    # Each dispute resolved against the company costs a tenth of the scale.
    score -= 10 * lost_disputes
    return max(0, min(100, round(score)))
