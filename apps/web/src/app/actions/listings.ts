"use server";

import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { Listing } from "@/lib/listings";
import { getToken } from "@/lib/session";

export type PublishState =
  | { message?: string; fieldErrors?: Record<string, string> }
  | undefined;

function text(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value === "" ? null : value;
}

function num(formData: FormData, name: string): number | null {
  const value = text(formData, name);
  return value === null ? null : Number(value.replace(",", "."));
}

export async function publishListing(
  _: PublishState,
  formData: FormData,
): Promise<PublishState> {
  const token = await getToken();
  if (!token) redirect("/ingresar");

  const free = formData.get("pricing_type") === "free";
  const body = {
    company_id: text(formData, "company_id"),
    category: text(formData, "category"),
    title: text(formData, "title"),
    description: text(formData, "description") ?? "",
    condition: text(formData, "condition"),
    is_recurring: formData.get("is_recurring") === "on",
    quantity: num(formData, "quantity"),
    quantity_unit: text(formData, "quantity_unit"),
    min_order_quantity: num(formData, "min_order_quantity"),
    availability: text(formData, "availability"),
    available_from:
      formData.get("availability") === "specific_date"
        ? text(formData, "available_from")
        : null,
    city: text(formData, "city"),
    facility_name: text(formData, "facility_name"),
    pickup_allowed: formData.get("pickup_allowed") === "on",
    pricing_type: free ? "free" : "paid",
    price: free ? null : num(formData, "price"),
    price_unit: free ? null : text(formData, "price_unit"),
    price_negotiable: formData.get("price_negotiable") === "on",
    conditions: text(formData, "conditions"),
  };

  const created = await apiFetch<Listing>("/listings", {
    method: "POST",
    token,
    body,
  });
  if (!created.ok) {
    if (created.status === 401) redirect("/ingresar");
    const fieldErrors = { ...created.fieldErrors };
    const general = fieldErrors.body;
    delete fieldErrors.body;
    return { message: general ?? created.message, fieldErrors };
  }

  const published = await apiFetch<Listing>(
    `/listings/${created.data.id}/publish`,
    {
      method: "POST",
      token,
    },
  );
  if (!published.ok) {
    return {
      message:
        "Guardamos el borrador pero no pudimos publicarlo. Intenta desde tu panel.",
    };
  }
  redirect(`/publicaciones/${created.data.id}?nueva=1`);
}

export async function archiveListing(formData: FormData) {
  const token = await getToken();
  if (!token) redirect("/ingresar");
  await apiFetch(`/listings/${String(formData.get("id"))}/archive`, {
    method: "POST",
    token,
  });
  redirect("/panel");
}
