import type { Schemas } from "@/lib/api";

export type CompanyRef = Schemas["CompanyRef"];

export type ListingRef = Schemas["ListingRef"];

export type OfferStatus = Schemas["OfferStatus"];

export type Offer = Schemas["OfferOut"];

export type ThreadMessage = Schemas["MessageOut"];

export type ThreadSummary = Schemas["ThreadSummary"];

export type ThreadDetail = Schemas["ThreadDetail"];

export type TransactionStatus = Schemas["TransactionStatus"];

export type Transaction = Omit<Schemas["TransactionOut"], "my_role"> & {
  my_role: "buyer" | "seller";
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
