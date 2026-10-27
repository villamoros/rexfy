"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/session";

export type TeamState = { message?: string; done?: boolean } | undefined;

async function token(): Promise<string> {
  const value = await getToken();
  if (!value) redirect("/ingresar");
  return value;
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function path(companyId: string): string {
  return `/panel/equipo/${companyId}`;
}

export async function inviteMember(
  _: TeamState,
  formData: FormData,
): Promise<TeamState> {
  const companyId = encodeURIComponent(text(formData, "company_id"));
  const result = await apiFetch(`/companies/${companyId}/team`, {
    method: "POST",
    token: await token(),
    body: { email: text(formData, "email"), role: text(formData, "role") },
  });
  if (!result.ok)
    return {
      message: result.fieldErrors.email
        ? "Escribe un email válido"
        : result.message,
    };
  revalidatePath(path(companyId));
  return { done: true };
}

export async function changeRole(formData: FormData) {
  const companyId = encodeURIComponent(text(formData, "company_id"));
  const userId = encodeURIComponent(text(formData, "user_id"));
  await apiFetch(`/companies/${companyId}/team/${userId}`, {
    method: "PATCH",
    token: await token(),
    body: { role: text(formData, "role") },
  });
  revalidatePath(path(companyId));
}

export async function removeMember(formData: FormData) {
  const companyId = encodeURIComponent(text(formData, "company_id"));
  const userId = encodeURIComponent(text(formData, "user_id"));
  const leaving = formData.get("self") === "true";
  await apiFetch(`/companies/${companyId}/team/${userId}`, {
    method: "DELETE",
    token: await token(),
  });
  if (leaving) redirect("/panel");
  revalidatePath(path(companyId));
}

export async function cancelInvitation(formData: FormData) {
  const companyId = encodeURIComponent(text(formData, "company_id"));
  const id = encodeURIComponent(text(formData, "invitation_id"));
  await apiFetch(`/companies/${companyId}/team/invitations/${id}`, {
    method: "DELETE",
    token: await token(),
  });
  revalidatePath(path(companyId));
}
