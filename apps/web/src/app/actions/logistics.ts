"use server";

import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/session";

export type ActionState =
  | { message?: string; fieldErrors?: Record<string, string> }
  | undefined;

async function token(): Promise<string> {
  const value = await getToken();
  if (!value) redirect("/ingresar");
  return value;
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export async function requestShipment(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const order = text(formData, "transaction_id");
  const result = await apiFetch(`/transactions/${order}/shipment`, {
    method: "POST",
    token: await token(),
    body: {
      pickup_city: text(formData, "pickup_city"),
      pickup_address: text(formData, "pickup_address"),
      delivery_city: text(formData, "delivery_city"),
      delivery_address: text(formData, "delivery_address"),
      vehicle_type: text(formData, "vehicle_type"),
      pickup_date: text(formData, "pickup_date"),
      requirements: text(formData, "requirements") || null,
    },
  });
  if (!result.ok)
    return { message: result.message, fieldErrors: result.fieldErrors };
  redirect(`/ordenes/${order}`);
}

export async function submitTransportQuote(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await apiFetch(
    `/shipments/${text(formData, "shipment_id")}/quotes`,
    {
      method: "POST",
      token: await token(),
      body: {
        company_id: text(formData, "company_id"),
        price: Number(text(formData, "price")),
        pickup_date: text(formData, "pickup_date"),
        delivery_date: text(formData, "delivery_date"),
        includes_insurance: formData.get("includes_insurance") === "on",
        notes: text(formData, "notes") || null,
      },
    },
  );
  if (!result.ok)
    return { message: result.message, fieldErrors: result.fieldErrors };
  redirect("/transporte");
}

export async function acceptTransportQuote(formData: FormData) {
  await apiFetch(`/transport-quotes/${text(formData, "quote_id")}/accept`, {
    method: "POST",
    token: await token(),
  });
  redirect(`/ordenes/${text(formData, "transaction_id")}`);
}

export async function advanceShipment(formData: FormData) {
  await apiFetch(`/shipments/${text(formData, "shipment_id")}/events`, {
    method: "POST",
    token: await token(),
    body: {
      status: text(formData, "status"),
      note: text(formData, "note") || null,
    },
  });
  redirect("/transporte");
}
