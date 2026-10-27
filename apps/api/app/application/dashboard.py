"""The KPIs docs/01 asks for, per company role, and the platform-wide ones for RexFy's team."""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.domain.deals.enums import TransactionStatus
from app.domain.listings.enums import ListingStatus, QuantityUnit
from app.domain.logistics.enums import QuoteStatus, ShipmentStatus
from app.domain.organizations.roles import MarketRole
from app.domain.trust.enums import DisputeStatus
from app.infrastructure.db.models import (
    Company,
    Dispute,
    Listing,
    Message,
    Offer,
    Shipment,
    Thread,
    Transaction,
    TransportQuote,
    User,
)

WINDOW = timedelta(days=30)


def _tons(quantity, unit):
    """Quantity in tons for weight units; other units count as zero."""
    return case(
        (unit == QuantityUnit.TON, quantity),
        (unit == QuantityUnit.KG, quantity / 1000),
        else_=0,
    )


def _hours(seconds: float | None) -> float | None:
    return round(seconds / 3600, 1) if seconds is not None else None


@dataclass
class SellerKpis:
    active_listings: int
    leads_30d: int
    # Average hours from a buyer's first message to the first reply, last 30 days.
    avg_first_reply_hours: float | None
    orders: int
    tons_sold: float
    revenue: float


@dataclass
class BuyerKpis:
    open_negotiations: int
    orders: int
    tons_bought: float
    spend: float
    # Days from first contact to an agreed order.
    avg_days_to_secure: float | None


@dataclass
class TransporterKpis:
    quotes_sent: int
    quotes_won: int
    win_rate: float | None
    trips_active: int
    trips_delivered: int


@dataclass
class CompanyKpis:
    company_id: uuid.UUID
    seller: SellerKpis | None
    buyer: BuyerKpis | None
    transporter: TransporterKpis | None


def _first_reply_hours(db: Session, company_id: uuid.UUID, since: datetime) -> float | None:
    buyer_first = (
        select(Message.thread_id, func.min(Message.created_at).label("at"))
        .join(Thread, Thread.id == Message.thread_id)
        .where(
            Thread.seller_company_id == company_id,
            Message.sender_company_id == Thread.buyer_company_id,
            Thread.created_at >= since,
        )
        .group_by(Message.thread_id)
        .subquery()
    )
    seller_first = (
        select(Message.thread_id, func.min(Message.created_at).label("at"))
        .where(Message.sender_company_id == company_id)
        .group_by(Message.thread_id)
        .subquery()
    )
    seconds = db.scalar(
        select(func.avg(func.extract("epoch", seller_first.c.at - buyer_first.c.at)))
        .select_from(buyer_first)
        .join(seller_first, seller_first.c.thread_id == buyer_first.c.thread_id)
    )
    return _hours(float(seconds)) if seconds is not None else None


def _seller(db: Session, company_id: uuid.UUID, since: datetime) -> SellerKpis:
    active = db.scalar(
        select(func.count(Listing.id)).where(
            Listing.company_id == company_id, Listing.status == ListingStatus.PUBLISHED
        )
    )
    leads = db.scalar(
        select(func.count(Thread.id)).where(
            Thread.seller_company_id == company_id, Thread.created_at >= since
        )
    )
    orders, tons, revenue = db.execute(
        select(
            func.count(Transaction.id),
            func.coalesce(func.sum(_tons(Transaction.quantity, Transaction.quantity_unit)), 0),
            func.coalesce(func.sum(Transaction.total), 0),
        ).where(Transaction.seller_company_id == company_id)
    ).one()
    return SellerKpis(
        active_listings=active or 0,
        leads_30d=leads or 0,
        avg_first_reply_hours=_first_reply_hours(db, company_id, since),
        orders=orders,
        tons_sold=float(tons),
        revenue=float(revenue),
    )


def _buyer(db: Session, company_id: uuid.UUID) -> BuyerKpis:
    closed = (
        select(Offer.id)
        .join(Transaction, Transaction.offer_id == Offer.id)
        .where(Offer.thread_id == Thread.id)
    )
    open_threads = db.scalar(
        select(func.count(Thread.id)).where(Thread.buyer_company_id == company_id, ~closed.exists())
    )
    orders, tons, spend = db.execute(
        select(
            func.count(Transaction.id),
            func.coalesce(func.sum(_tons(Transaction.quantity, Transaction.quantity_unit)), 0),
            func.coalesce(func.sum(Transaction.total), 0),
        ).where(Transaction.buyer_company_id == company_id)
    ).one()
    seconds = db.scalar(
        select(func.avg(func.extract("epoch", Transaction.created_at - Thread.created_at)))
        .select_from(Transaction)
        .join(Offer, Offer.id == Transaction.offer_id)
        .join(Thread, Thread.id == Offer.thread_id)
        .where(Transaction.buyer_company_id == company_id)
    )
    days = round(float(seconds) / 86400, 1) if seconds is not None else None
    return BuyerKpis(
        open_negotiations=open_threads or 0,
        orders=orders,
        tons_bought=float(tons),
        spend=float(spend),
        avg_days_to_secure=days,
    )


def _transporter(db: Session, company_id: uuid.UUID) -> TransporterKpis:
    sent, won = db.execute(
        select(
            func.count(TransportQuote.id),
            func.count(TransportQuote.id).filter(TransportQuote.status == QuoteStatus.ACCEPTED),
        ).where(TransportQuote.transporter_company_id == company_id)
    ).one()
    active, delivered = db.execute(
        select(
            func.count(Shipment.id).filter(Shipment.status != ShipmentStatus.DELIVERED),
            func.count(Shipment.id).filter(Shipment.status == ShipmentStatus.DELIVERED),
        ).where(Shipment.transporter_company_id == company_id)
    ).one()
    return TransporterKpis(
        quotes_sent=sent,
        quotes_won=won,
        win_rate=round(won / sent, 2) if sent else None,
        trips_active=active,
        trips_delivered=delivered,
    )


def company_kpis(db: Session, user: User) -> list[CompanyKpis]:
    since = datetime.now(UTC) - WINDOW
    result = []
    for m in user.memberships:
        roles = m.company.market_roles
        result.append(
            CompanyKpis(
                company_id=m.company_id,
                seller=_seller(db, m.company_id, since) if MarketRole.GENERATOR in roles else None,
                buyer=_buyer(db, m.company_id) if MarketRole.BUYER in roles else None,
                transporter=_transporter(db, m.company_id)
                if MarketRole.TRANSPORTER in roles
                else None,
            )
        )
    return result


@dataclass
class PlatformKpis:
    # North Star in docs/01: tons reused, counted on closed orders.
    tons_reused: float
    gmv_30d: float
    orders_30d: int
    completed_rate: float | None
    listings_published_30d: int
    active_companies_30d: int
    companies_pending_verification: int
    open_disputes: int
    dispute_rate: float | None
    avg_dispute_resolution_hours: float | None
    logistics_attach_rate: float | None


def platform_kpis(db: Session) -> PlatformKpis:
    since = datetime.now(UTC) - WINDOW
    tons = db.scalar(
        select(
            func.coalesce(func.sum(_tons(Transaction.quantity, Transaction.quantity_unit)), 0)
        ).where(Transaction.status == TransactionStatus.COMPLETED)
    )
    orders_total, completed, gmv, orders_30d = db.execute(
        select(
            func.count(Transaction.id),
            func.count(Transaction.id).filter(Transaction.status == TransactionStatus.COMPLETED),
            func.coalesce(func.sum(Transaction.total).filter(Transaction.created_at >= since), 0),
            func.count(Transaction.id).filter(Transaction.created_at >= since),
        )
    ).one()
    with_shipment = db.scalar(select(func.count(Shipment.id))) or 0
    listings_30d = db.scalar(select(func.count(Listing.id)).where(Listing.published_at >= since))
    active = db.scalar(
        select(func.count(func.distinct(Message.sender_company_id))).where(
            Message.created_at >= since
        )
    )
    pending = db.scalar(select(func.count(Company.id)).where(Company.is_verified.is_(False)))
    open_disputes, disputed_orders = db.execute(
        select(
            func.count(Dispute.id).filter(Dispute.status == DisputeStatus.OPEN),
            func.count(func.distinct(Dispute.transaction_id)),
        )
    ).one()
    resolution = db.scalar(
        select(func.avg(func.extract("epoch", Dispute.resolved_at - Dispute.created_at))).where(
            Dispute.resolved_at.is_not(None)
        )
    )

    def rate(part: int, whole: int) -> float | None:
        return round(part / whole, 2) if whole else None

    return PlatformKpis(
        tons_reused=float(tons or Decimal(0)),
        gmv_30d=float(gmv),
        orders_30d=orders_30d,
        completed_rate=rate(completed, orders_total),
        listings_published_30d=listings_30d or 0,
        active_companies_30d=active or 0,
        companies_pending_verification=pending or 0,
        open_disputes=open_disputes,
        dispute_rate=rate(disputed_orders, orders_total),
        avg_dispute_resolution_hours=_hours(float(resolution)) if resolution is not None else None,
        logistics_attach_rate=rate(with_shipment, orders_total),
    )
