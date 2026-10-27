"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/session";

export type TrustState = { message?: string; done?: boolean } | undefined;

async function token(): Promise<string> {
  const value = await getToken();
  if (!value) redirect("/ingresar");
  return value;
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export async function leaveReview(
  _: TrustState,
  formData: FormData,
): Promise<TrustState> {
  const id = encodeURIComponent(text(formData, "transaction_id"));
  const result = await apiFetch(`/transactions/${id}/reviews`, {
    method: "POST",
    token: await token(),
    body: {
      rating: Number(text(formData, "rating")),
      comment: text(formData, "comment") || null,
    },
  });
  if (!result.ok)
    return { message: result.fieldErrors.rating ?? result.message };
  revalidatePath(`/ordenes/${id}`);
  return { done: true };
}

export async function openDispute(
  _: TrustState,
  formData: FormData,
): Promise<TrustState> {
  const id = encodeURIComponent(text(formData, "transaction_id"));
  const result = await apiFetch(`/transactions/${id}/disputes`, {
    method: "POST",
    token: await token(),
    body: {
      reason: text(formData, "reason"),
      description: text(formData, "description"),
    },
  });
  if (!result.ok)
    return { message: result.fieldErrors.description ?? result.message };
  revalidatePath(`/ordenes/${id}`);
  return { done: true };
}

export async function resolveDispute(
  _: TrustState,
  formData: FormData,
): Promise<TrustState> {
  const id = encodeURIComponent(text(formData, "dispute_id"));
  const result = await apiFetch(`/admin/disputes/${id}`, {
    method: "PATCH",
    token: await token(),
    body: {
      resolution: text(formData, "resolution"),
      at_fault_company_id: text(formData, "at_fault_company_id") || null,
    },
  });
  if (!result.ok)
    return { message: result.fieldErrors.resolution ?? result.message };
  revalidatePath("/admin");
  return { done: true };
}
