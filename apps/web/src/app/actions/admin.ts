"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/session";

async function token(): Promise<string> {
  const value = await getToken();
  if (!value) redirect("/ingresar");
  return value;
}

export async function setCompanyVerified(formData: FormData) {
  const id = encodeURIComponent(String(formData.get("company_id")));
  const verb = formData.get("verified") === "true" ? "verify" : "unverify";
  await apiFetch(`/admin/companies/${id}/${verb}`, {
    method: "POST",
    token: await token(),
  });
  revalidatePath("/admin");
}

export type TakeDownState = { message?: string; done?: boolean } | undefined;

export async function takeDownListing(
  _: TakeDownState,
  formData: FormData,
): Promise<TakeDownState> {
  const id = encodeURIComponent(String(formData.get("listing_id")));
  const result = await apiFetch(`/admin/listings/${id}/take-down`, {
    method: "POST",
    token: await token(),
    body: { reason: String(formData.get("reason") ?? "").trim() },
  });
  if (!result.ok)
    return { message: result.fieldErrors.reason ?? result.message };
  revalidatePath("/admin");
  return { done: true };
}
