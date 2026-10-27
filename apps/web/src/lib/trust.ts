import type { MarketRole } from "@/lib/api";
import type { CompanyRef } from "@/lib/deals";
import type { Listing } from "@/lib/listings";

export type DisputeReason =
  | "quality"
  | "quantity"
  | "delivery"
  | "payment"
  | "other";

export const DISPUTE_REASONS: Record<DisputeReason, string> = {
  quality: "El material no es el acordado",
  quantity: "Llegó menos cantidad",
  delivery: "No llegó o llegó tarde",
  payment: "Pago pendiente o incompleto",
  other: "Otro problema",
};

export type Dispute = {
  id: string;
  transaction_id: string;
  opened_by: CompanyRef;
  reason: DisputeReason;
  description: string;
  status: "open" | "resolved";
  resolution: string | null;
  at_fault_company_id: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type AdminDispute = Dispute & {
  order_code: string;
  buyer: CompanyRef;
  seller: CompanyRef;
};

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  from_company: CompanyRef;
  created_at: string;
};

export type CompanyProfile = {
  id: string;
  legal_name: string;
  city: string;
  market_roles: MarketRole[];
  is_verified: boolean;
  member_since: string;
  trust_score: number;
  average_rating: number | null;
  review_count: number;
  completed_orders: number;
  reviews: Review[];
  listings: Listing[];
};

export function stars(rating: number): string {
  return "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
}
