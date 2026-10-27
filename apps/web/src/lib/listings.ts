import type { Schemas } from "@/lib/api";

export type MaterialCategory = Schemas["MaterialCategory"];
export type MaterialCondition = Schemas["MaterialCondition"];
export type QuantityUnit = Schemas["QuantityUnit"];
export type Availability = Schemas["Availability"];
export type PricingType = Schemas["PricingType"];
export type ListingStatus = Schemas["ListingStatus"];

export type Listing = Schemas["ListingOut"];

export const MAX_PHOTOS = 6;

export type ListingPage = Schemas["ListingPage"];

export const CATEGORIES: Record<MaterialCategory, string> = {
  plastic: "Plástico",
  metal: "Metal",
  paper_cardboard: "Cartón / papel",
  wood: "Madera",
  textile: "Textil",
  glass: "Vidrio",
  electronic: "Electrónico",
  agro: "Agroindustrial",
};

export const CONDITIONS: Record<MaterialCondition, string> = {
  clean_separated: "Limpio y separado",
  mixed: "Mezclado con otros materiales",
  preprocessed: "Pre-procesado / compactado",
  needs_sorting: "Requiere clasificación",
};

export const UNITS: Record<QuantityUnit, string> = {
  t: "toneladas",
  kg: "kg",
  unit: "unidades",
  m3: "m³",
  l: "litros",
};

const UNIT_SHORT: Record<QuantityUnit, string> = {
  t: "t",
  kg: "kg",
  unit: "ud",
  m3: "m³",
  l: "L",
};

export const AVAILABILITY: Record<Availability, string> = {
  immediate: "Inmediata",
  this_week: "Esta semana",
  this_month: "Este mes",
  specific_date: "Fecha específica",
};

export const STATUS: Record<ListingStatus, string> = {
  draft: "Borrador",
  published: "Publicada",
  archived: "Archivada",
};

const number = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 3 });
const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatQuantity(value: number, unit: QuantityUnit): string {
  return `${number.format(value)} ${UNIT_SHORT[unit]}`;
}

export function formatPrice(
  listing: Pick<Listing, "pricing_type" | "price" | "price_unit">,
) {
  if (listing.pricing_type === "free" || listing.price === null)
    return "Gratis";
  return `${cop.format(listing.price)} /${UNIT_SHORT[listing.price_unit ?? "kg"]}`;
}

export function availabilityLabel(
  listing: Pick<Listing, "availability" | "available_from">,
) {
  if (listing.availability === "specific_date" && listing.available_from) {
    const date = new Date(`${listing.available_from}T00:00:00`);
    return `Desde el ${date.toLocaleDateString("es-CO", { day: "numeric", month: "long" })}`;
  }
  return AVAILABILITY[listing.availability];
}
