import type { QuantityUnit } from "@/lib/listings";

export type CompanyRef = {
  id: string;
  legal_name: string;
  city: string;
  is_verified: boolean;
};

export type ListingRef = {
  id: string;
  title: string;
  category: string;
  quantity: number;
  quantity_unit: QuantityUnit;
  price: number | null;
  price_unit: QuantityUnit | null;
  city: string;
};

export type OfferStatus = "pending" | "accepted" | "declined" | "countered";

export type Offer = {
  id: string;
  from_company_id: string;
  status: OfferStatus;
  quantity: number;
  quantity_unit: QuantityUnit;
  price: number;
  price_unit: QuantityUnit;
  total: number | null;
  notes: string | null;
  valid_until: string;
  created_at: string;
};

export type ThreadMessage = {
  id: string;
  body: string;
  sender_name: string;
  sender_company_id: string;
  created_at: string;
};

export type ThreadSummary = {
  id: string;
  listing: ListingRef;
  counterpart: CompanyRef;
  my_company_id: string;
  last_message: string | null;
  last_activity_at: string;
  pending_offer_from_me: boolean | null;
};

export type ThreadDetail = {
  id: string;
  listing: ListingRef;
  buyer: CompanyRef;
  seller: CompanyRef;
  my_company_id: string;
  messages: ThreadMessage[];
  offers: Offer[];
  transaction_id: string | null;
};

export type TransactionStatus =
  | "agreed"
  | "in_transit"
  | "delivered"
  | "completed";

export type Transaction = {
  id: string;
  code: string;
  status: TransactionStatus;
  listing: ListingRef;
  buyer: CompanyRef;
  seller: CompanyRef;
  quantity: number;
  quantity_unit: QuantityUnit;
  price: number;
  price_unit: QuantityUnit;
  total: number | null;
  created_at: string;
  completed_at: string | null;
  thread_id: string;
  my_role: "buyer" | "seller";
  // Only filled when reading one order.
  reviewed_by_me: boolean;
  has_open_dispute: boolean;
};

export const OFFER_STATUS: Record<OfferStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  declined: "Declinada",
  countered: "Contraofertada",
};

export const TRANSACTION_STATUS: Record<TransactionStatus, string> = {
  agreed: "Acordada",
  in_transit: "En tránsito",
  delivered: "Entregada",
  completed: "Completada",
};

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCop(value: number): string {
  return cop.format(value);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
}
