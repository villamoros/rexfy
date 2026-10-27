import type { CompanyRef } from "@/lib/deals";
import type { QuantityUnit } from "@/lib/listings";

export type VehicleType =
  | "single_truck"
  | "double_axle"
  | "tractor_trailer"
  | "bulk"
  | "special";
export type ShipmentStatus =
  | "requested"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered";
export type QuoteStatus = "pending" | "accepted" | "rejected";

export type TransportQuote = {
  id: string;
  transporter: CompanyRef;
  status: QuoteStatus;
  price: number;
  pickup_date: string;
  delivery_date: string;
  includes_insurance: boolean;
  notes: string | null;
  created_at: string;
};

export type ShipmentEvent = {
  id: string;
  status: ShipmentStatus;
  note: string | null;
  created_at: string;
};

export type Shipment = {
  id: string;
  status: ShipmentStatus;
  order: {
    id: string;
    code: string;
    listing_title: string;
    quantity: number;
    quantity_unit: QuantityUnit;
    // Null for transporters that are only bidding.
    buyer: CompanyRef | null;
    seller: CompanyRef | null;
  };
  pickup_city: string;
  delivery_city: string;
  pickup_address: string | null;
  delivery_address: string | null;
  vehicle_type: VehicleType;
  pickup_date: string;
  requirements: string | null;
  transporter: CompanyRef | null;
  quotes: TransportQuote[];
  events: ShipmentEvent[];
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
