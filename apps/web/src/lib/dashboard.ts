export type CompanyKpis = {
  company_id: string;
  seller: {
    active_listings: number;
    leads_30d: number;
    avg_first_reply_hours: number | null;
    orders: number;
    tons_sold: number;
    revenue: number;
  } | null;
  buyer: {
    open_negotiations: number;
    orders: number;
    tons_bought: number;
    spend: number;
    avg_days_to_secure: number | null;
  } | null;
  transporter: {
    quotes_sent: number;
    quotes_won: number;
    win_rate: number | null;
    trips_active: number;
    trips_delivered: number;
  } | null;
};

export type PlatformKpis = {
  tons_reused: number;
  gmv_30d: number;
  orders_30d: number;
  completed_rate: number | null;
  listings_published_30d: number;
  active_companies_30d: number;
  companies_pending_verification: number;
  open_disputes: number;
  dispute_rate: number | null;
  avg_dispute_resolution_hours: number | null;
  logistics_attach_rate: number | null;
};
