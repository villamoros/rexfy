import type { Schemas } from "@/lib/api";

export type DisputeReason = Schemas["DisputeReason"];

export const DISPUTE_REASONS: Record<DisputeReason, string> = {
  quality: "El material no es el acordado",
  quantity: "Llegó menos cantidad",
  delivery: "No llegó o llegó tarde",
  payment: "Pago pendiente o incompleto",
  other: "Otro problema",
};

export type Dispute = Schemas["DisputeOut"];
export type AdminDispute = Schemas["AdminDisputeOut"];
export type Review = Schemas["ReviewOut"];
export type CompanyProfile = Schemas["CompanyProfile"];

export function stars(rating: number): string {
  return "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
}
