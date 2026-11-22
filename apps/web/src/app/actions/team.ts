"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import {
  mutationFailure,
  mutationSuccess,
  type MutationState,
} from "@/lib/action-state";
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

export async function changeRole(
  _: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const companyId = encodeURIComponent(text(formData, "company_id"));
  const userId = encodeURIComponent(text(formData, "user_id"));
  const result = await apiFetch(`/companies/${companyId}/team/${userId}`, {
    method: "PATCH",
    token: await token(),
    body: { role: text(formData, "role") },
  });
  if (!result.ok) return mutationFailure(result);
  revalidatePath(path(companyId));
  return mutationSuccess("Rol actualizado.");
}

export async function removeMember(
  _: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const companyId = encodeURIComponent(text(formData, "company_id"));
  const userId = encodeURIComponent(text(formData, "user_id"));
  const leaving = formData.get("self") === "true";
  const result = await apiFetch(`/companies/${companyId}/team/${userId}`, {
    method: "DELETE",
    token: await token(),
  });
  if (!result.ok) return mutationFailure(result);
  if (leaving) redirect("/panel");
  revalidatePath(path(companyId));
  return mutationSuccess("Miembro eliminado del equipo.");
}

export async function cancelInvitation(
  _: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const companyId = encodeURIComponent(text(formData, "company_id"));
  const id = encodeURIComponent(text(formData, "invitation_id"));
  const result = await apiFetch(`/companies/${companyId}/team/invitations/${id}`, {
    method: "DELETE",
    token: await token(),
  });
  if (!result.ok) return mutationFailure(result);
  revalidatePath(path(companyId));
  return mutationSuccess("Invitación cancelada.");
}
