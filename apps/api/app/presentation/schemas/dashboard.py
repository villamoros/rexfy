import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class _Kpis(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class SellerKpisOut(_Kpis):
    active_listings: int
    leads_30d: int
    avg_first_reply_hours: float | None
    orders: int
    tons_sold: float
    revenue: float


class BuyerKpisOut(_Kpis):
    open_negotiations: int
    orders: int
    tons_bought: float
    spend: float
    avg_days_to_secure: float | None


class TransporterKpisOut(_Kpis):
    quotes_sent: int
    quotes_won: int
    win_rate: float | None
    trips_active: int
    trips_delivered: int


class CompanyKpisOut(_Kpis):
    company_id: uuid.UUID
    seller: SellerKpisOut | None
    buyer: BuyerKpisOut | None
    transporter: TransporterKpisOut | None


class PlatformKpisOut(_Kpis):
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


class FunnelStepOut(_Kpis):
    key: str
    label: str
    entities: int
    conversion_from_previous: float | None


class FunnelSegmentOut(_Kpis):
    dimension: str
    value: str
    events: int
    companies: int


class FunnelSnapshotOut(_Kpis):
    window_days: int
    timezone: str
    since: datetime
    role: str | None
    city: str | None
    category: str | None
    cohort_month: date | None
    steps: list[FunnelStepOut]
    segments: list[FunnelSegmentOut]
