"use server";

import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { ThreadDetail, Transaction } from "@/lib/deals";
import { getToken } from "@/lib/session";

export type ActionState = { message?: string } | undefined;

async function token(): Promise<string> {
  const value = await getToken();
  if (!value) redirect("/ingresar");
  return value;
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export async function startThread(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await apiFetch<ThreadDetail>("/threads", {
    method: "POST",
    token: await token(),
    body: {
      listing_id: text(formData, "listing_id"),
      company_id: text(formData, "company_id"),
      body: text(formData, "body"),
    },
  });
  if (!result.ok) return { message: result.message };
  redirect(`/mensajes/${result.data.id}`);
}

export async function sendMessage(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData, "thread_id");
  const result = await apiFetch(`/threads/${id}/messages`, {
    method: "POST",
    token: await token(),
    body: { body: text(formData, "body") },
  });
  if (!result.ok) return { message: result.message };
  redirect(`/mensajes/${id}`);
}

export async function sendOffer(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData, "thread_id");
  const notes = text(formData, "notes");
  const result = await apiFetch(`/threads/${id}/offers`, {
    method: "POST",
    token: await token(),
    body: {
      quantity: Number(text(formData, "quantity").replace(",", ".")),
      price: Number(text(formData, "price").replace(",", ".")),
      price_unit: text(formData, "price_unit"),
      valid_hours: Number(text(formData, "valid_hours")),
      notes: notes || null,
    },
  });
  if (!result.ok) return { message: result.message };
  redirect(`/mensajes/${id}`);
}

export async function respondToOffer(formData: FormData) {
  const thread = text(formData, "thread_id");
  const offer = text(formData, "offer_id");
  const decision =
    text(formData, "decision") === "accept" ? "accept" : "decline";
  const result = await apiFetch<Transaction>(`/offers/${offer}/${decision}`, {
    method: "POST",
    token: await token(),
  });
  if (result.ok && decision === "accept")
    redirect(`/ordenes/${result.data.id}?nueva=1`);
  redirect(`/mensajes/${thread}`);
}

export async function confirmReceipt(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData, "transaction_id");
  const result = await apiFetch(`/transactions/${id}/confirm-receipt`, {
    method: "POST",
    token: await token(),
  });
  if (!result.ok) return { message: result.message };
  redirect(`/ordenes/${id}`);
}
