"""Reviews, disputes and the trust profile that sums them up."""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.application import audit
from app.application.deals import InvalidState, NotAllowed
from app.domain.deals.enums import TransactionStatus
from app.domain.listings.enums import ListingStatus
from app.domain.trust.enums import DisputeReason, DisputeStatus
from app.domain.trust.score import trust_score
from app.infrastructure.db.models import Company, Dispute, Listing, Review, Transaction, User


def _my_side(user: User, transaction: Transaction) -> tuple[uuid.UUID, uuid.UUID]:
    """(the user's company, the counterpart) in an order. Raises NotAllowed for outsiders."""
    mine = {m.company_id for m in user.memberships}
    buyer, seller = transaction.buyer_company_id, transaction.seller_company_id
    if buyer in mine and seller not in mine:
        return buyer, seller
    if seller in mine and buyer not in mine:
        return seller, buyer
    raise NotAllowed


def leave_review(
    db: Session, user: User, transaction: Transaction, *, rating: int, comment: str | None
) -> Review:
    """Rate the other side once the order is closed. Each side reviews an order once."""
    mine, other = _my_side(user, transaction)
    if transaction.status is not TransactionStatus.COMPLETED:
        raise InvalidState("Podrás calificar cuando la orden esté cerrada")
    review = Review(
        transaction_id=transaction.id,
        from_company_id=mine,
        to_company_id=other,
        created_by_user_id=user.id,
        rating=rating,
        comment=(comment or "").strip() or None,
    )
    db.add(review)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise InvalidState("Tu empresa ya calificó esta orden") from None
    audit.record(db, user, "review.created", review, company_id=mine, rating=rating)
    db.commit()
    return review


def reviewed_by(db: Session, user: User, transaction: Transaction) -> bool:
    mine = {m.company_id for m in user.memberships}
    return bool(
        db.scalar(
            select(Review.id).where(
                Review.transaction_id == transaction.id, Review.from_company_id.in_(mine)
            )
        )
    )


def open_dispute(
    db: Session,
    user: User,
    transaction: Transaction,
    *,
    reason: DisputeReason,
    description: str,
) -> Dispute:
    mine, _ = _my_side(user, transaction)
    if open_dispute_for(db, transaction) is not None:
        raise InvalidState("Esta orden ya tiene una disputa abierta")
    dispute = Dispute(
        transaction_id=transaction.id,
        opened_by_company_id=mine,
        opened_by_user_id=user.id,
        reason=reason,
        description=description.strip(),
    )
    db.add(dispute)
    audit.record(db, user, "dispute.opened", dispute, company_id=mine, reason=reason)
    db.commit()
    return dispute


def open_dispute_for(db: Session, transaction: Transaction) -> Dispute | None:
    return db.scalar(
        select(Dispute).where(
            Dispute.transaction_id == transaction.id, Dispute.status == DisputeStatus.OPEN
        )
    )


def disputes_of(db: Session, transaction: Transaction) -> list[Dispute]:
    stmt = (
        select(Dispute)
        .where(Dispute.transaction_id == transaction.id)
        .order_by(Dispute.created_at.desc())
    )
    return list(db.scalars(stmt).unique())


def disputes(db: Session, *, status: DisputeStatus | None = None) -> list[Dispute]:
    stmt = select(Dispute).order_by(Dispute.created_at.desc()).limit(100)
    if status is not None:
        stmt = stmt.where(Dispute.status == status)
    return list(db.scalars(stmt).unique())


def resolve_dispute(
    db: Session,
    admin: User,
    dispute: Dispute,
    *,
    resolution: str,
    at_fault_company_id: uuid.UUID | None,
) -> Dispute:
    if dispute.status is DisputeStatus.RESOLVED:
        raise InvalidState("La disputa ya está resuelta")
    t = dispute.transaction
    if at_fault_company_id not in (None, t.buyer_company_id, t.seller_company_id):
        raise InvalidState("La empresa responsable debe ser una de las partes")
    dispute.status = DisputeStatus.RESOLVED
    dispute.resolution = resolution.strip()
    dispute.at_fault_company_id = at_fault_company_id
    dispute.resolved_by_user_id = admin.id
    dispute.resolved_at = datetime.now(UTC)
    audit.record(
        db,
        admin,
        "dispute.resolved",
        dispute,
        at_fault_company_id=at_fault_company_id,
        reason=resolution,
    )
    db.commit()
    return dispute


@dataclass
class Profile:
    company: Company
    trust_score: int
    average_rating: Decimal | None
    review_count: int
    completed_orders: int
    lost_disputes: int
    reviews: list[Review]
    listings: list[Listing]


def profile(db: Session, company_id: uuid.UUID) -> Profile | None:
    company = db.get(Company, company_id)
    if company is None:
        return None
    average, count = db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.to_company_id == company_id
        )
    ).one()
    completed = (
        db.scalar(
            select(func.count(Transaction.id)).where(
                Transaction.status == TransactionStatus.COMPLETED,
                or_(
                    Transaction.buyer_company_id == company_id,
                    Transaction.seller_company_id == company_id,
                ),
            )
        )
        or 0
    )
    lost = (
        db.scalar(select(func.count(Dispute.id)).where(Dispute.at_fault_company_id == company_id))
        or 0
    )
    average = Decimal(average).quantize(Decimal("0.1")) if average is not None else None
    reviews = list(
        db.scalars(
            select(Review)
            .where(Review.to_company_id == company_id)
            .order_by(Review.created_at.desc())
            .limit(20)
        )
    )
    listings = list(
        db.scalars(
            select(Listing)
            .where(Listing.company_id == company_id, Listing.status == ListingStatus.PUBLISHED)
            .order_by(Listing.published_at.desc())
            .limit(12)
        )
    )
    return Profile(
        company=company,
        trust_score=trust_score(
            is_verified=company.is_verified,
            average_rating=average,
            review_count=count,
            completed_orders=completed,
            lost_disputes=lost,
        ),
        average_rating=average,
        review_count=count,
        completed_orders=completed,
        lost_disputes=lost,
        reviews=reviews,
        listings=listings,
    )
