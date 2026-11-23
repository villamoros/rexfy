import {
  CATEGORIES,
  CONDITIONS,
  availabilityLabel,
  formatPrice,
  formatQuantity,
  type Availability,
  type Listing,
  type MaterialCategory,
  type MaterialCondition,
  type QuantityUnit,
} from "@/lib/listings";

export const STEPS = [
  "Material",
  "Cantidad",
  "Ubicación",
  "Precio",
  "Revisión",
] as const;

export const FIELD_LABELS: Record<string, string> = {
  title: "Título",
  description: "Descripción",
  quantity: "Cantidad",
  min_order_quantity: "Cantidad mínima",
  available_from: "Fecha de disponibilidad",
  city: "Ciudad",
  price: "Precio",
  price_unit: "Unidad del precio",
};

export type Company = { id: string; name: string };
export type Values = Record<string, string | boolean>;

function isFormControl(
  element: Element,
): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

export function readForm(form: HTMLFormElement): Values {
  const values: Values = {};
  for (const element of Array.from(form.elements)) {
    if (
      !isFormControl(element) ||
      !element.name ||
      ["hidden", "file"].includes(element.type)
    )
      continue;
    if (element instanceof HTMLInputElement && element.type === "checkbox")
      values[element.name] = element.checked;
    else if (element instanceof HTMLInputElement && element.type === "radio") {
      if (element.checked) values[element.name] = element.value;
    } else values[element.name] = element.value;
  }
  return values;
}

export function fillForm(form: HTMLFormElement, values: Values) {
  for (const element of Array.from(form.elements)) {
    if (
      !isFormControl(element) ||
      !(element.name in values) ||
      ["hidden", "file"].includes(element.type)
    )
      continue;
    const value = values[element.name];
    if (element instanceof HTMLInputElement && element.type === "checkbox")
      element.checked = value === true;
    else if (element instanceof HTMLInputElement && element.type === "radio")
      element.checked = element.value === value;
    else element.value = String(value);
  }
}

export function valuesOf(listing: Listing): Values {
  const text = (value: string | number | null) =>
    value === null ? "" : String(value);
  return {
    category: listing.category,
    title: listing.title,
    description: listing.description,
    condition: listing.condition,
    is_recurring: listing.is_recurring,
    quantity: text(listing.quantity),
    quantity_unit: listing.quantity_unit,
    min_order_quantity: text(listing.min_order_quantity),
    availability: listing.availability,
    available_from: text(listing.available_from),
    city: listing.city,
    facility_name: text(listing.facility_name),
    pickup_allowed: listing.pickup_allowed,
    pricing_type: listing.pricing_type,
    price: text(listing.price),
    price_unit: listing.price_unit ?? "kg",
    price_negotiable: listing.price_negotiable,
    conditions: text(listing.conditions),
  };
}

export function minimumError(quantity: string, minimum: string): string {
  return minimum && Number(minimum) > Number(quantity)
    ? "La cantidad mínima no puede superar la cantidad disponible"
    : "";
}

export function buildSummary(data: FormData): [string, string][] {
  const get = (name: string) => String(data.get(name) ?? "").trim();
  const unit = get("quantity_unit") as QuantityUnit;
  const rows: [string, string][] = [
    ["Material", CATEGORIES[get("category") as MaterialCategory]],
    ["Título", get("title")],
    ["Estado", CONDITIONS[get("condition") as MaterialCondition]],
    ["Cantidad", formatQuantity(Number(get("quantity")), unit)],
  ];
  if (get("min_order_quantity"))
    rows.push([
      "Mínimo de compra",
      formatQuantity(Number(get("min_order_quantity")), unit),
    ]);
  rows.push(
    [
      "Disponibilidad",
      availabilityLabel({
        availability: get("availability") as Availability,
        available_from: get("available_from") || null,
      }),
    ],
    ["Ubicación", get("city")],
    ["Retiro en sitio", data.get("pickup_allowed") === "on" ? "Sí" : "No"],
    [
      "Precio",
      formatPrice({
        pricing_type: get("pricing_type") === "free" ? "free" : "paid",
        price: get("price") ? Number(get("price")) : null,
        price_unit: (get("price_unit") || null) as QuantityUnit | null,
      }) + (data.get("price_negotiable") === "on" ? " · Negociable" : ""),
    ],
    ["Oferta", data.get("is_recurring") === "on" ? "Recurrente" : "Puntual"],
  );
  const photos = data
    .getAll("photos")
    .filter((file) => file instanceof File && file.size > 0).length;
  if (photos > 0)
    rows.push(["Fotos nuevas", `${photos} ${photos === 1 ? "foto" : "fotos"}`]);
  return rows;
}
