import type { MarketRole } from "@/lib/api";

export type AdminCompany = {
  id: string;
  legal_name: string;
  nit: string;
  city: string;
  market_roles: MarketRole[];
  is_verified: boolean;
  created_at: string;
  members: number;
};

export type AuditEntry = {
  id: string;
  created_at: string;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  data: Record<string, unknown>;
};

export type OutboxHealth = {
  pending: number;
  processing: number;
  retry: number;
  failed: number;
  processed_24h: number;
  due: number;
  oldest_unprocessed_at: string | null;
};

export type OutboxEvent = {
  id: string;
  kind: string;
  status: "pending" | "processing" | "retry" | "processed" | "failed";
  attempts: number;
  created_at: string;
  last_error: string | null;
};

export const AUDIT_ACTIONS: Record<string, string> = {
  "company.created": "registró una empresa",
  "company.verified": "verificó una empresa",
  "company.unverified": "quitó la verificación",
  "listing.created": "guardó un borrador",
  "listing.published": "publicó material",
  "listing.updated": "editó una publicación",
  "listing.archived": "archivó una publicación",
  "listing.taken_down": "retiró una publicación",
  "listing.images_added": "subió fotos",
  "member.added": "agregó a alguien al equipo",
  "member.invited": "invitó a alguien al equipo",
  "member.role_changed": "cambió un rol del equipo",
  "member.removed": "quitó a alguien del equipo",
  "offer.sent": "envió una cotización",
  "offer.accepted": "aceptó una cotización",
  "offer.declined": "rechazó una cotización",
  "order.completed": "confirmó la recepción",
  "shipment.requested": "pidió transporte",
  "transport_quote.accepted": "eligió transportador",
  "shipment.advanced": "actualizó un envío",
  "dispute.opened": "abrió una disputa",
  "dispute.resolved": "resolvió una disputa",
  "review.created": "calificó a una empresa",
  "outbox.replayed": "reprogramó una notificación",
};
