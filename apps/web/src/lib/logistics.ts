import type { Schemas } from "@/lib/api";

export type VehicleType = Schemas["VehicleType"];
export type ShipmentStatus = Schemas["ShipmentStatus"];
export type QuoteStatus = Schemas["QuoteStatus"];

export type TransportQuote = Schemas["QuoteOut"];

export type ShipmentEvent = Schemas["EventOut"];

export type Shipment = Omit<Schemas["ShipmentOut"], "my_relation"> & {
  my_relation: "party" | "transporter" | "bidder";
};

export const VEHICLES: Record<VehicleType, string> = {
  single_truck: "Camión sencillo (hasta 5 t)",
  double_axle: "Doble troque (5 a 15 t)",
  tractor_trailer: "Tractomula (más de 15 t)",
  bulk: "Granel",
  special: "Carga especial",
};

export const SHIPMENT_STATUS: Record<ShipmentStatus, string> = {
  requested: "Esperando cotizaciones",
  assigned: "Transportador asignado",
  picked_up: "Material recogido",
  in_transit: "En ruta",
  delivered: "Entregado",
};

/** The status the assigned transporter can move to next, if any. */
export const NEXT_STATUS: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
  assigned: "picked_up",
  picked_up: "in_transit",
  in_transit: "delivered",
};

export const NEXT_ACTION: Partial<Record<ShipmentStatus, string>> = {
  picked_up: "Confirmar recogida",
  in_transit: "Marcar en ruta",
  delivered: "Confirmar entrega",
};

export function formatDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
  });
}
