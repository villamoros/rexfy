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

/** Marks the notification read and goes where it points. */
export async function openNotification(
  _: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const token = await getToken();
  if (!token) redirect("/ingresar");
  const id = encodeURIComponent(String(formData.get("id")));
  const link = String(formData.get("link"));
  const result = await apiFetch(`/notifications/${id}/read`, {
    method: "POST",
    token,
  });
  if (!result.ok) return mutationFailure(result);
  // Only paths inside the app.
  redirect(link.startsWith("/") && !link.startsWith("//") ? link : "/panel");
}

export async function markAllRead(): Promise<MutationState> {
  const token = await getToken();
  if (!token) redirect("/ingresar");
  const result = await apiFetch("/notifications/read", {
    method: "POST",
    token,
  });
  if (!result.ok) return mutationFailure(result);
  revalidatePath("/notificaciones");
  return mutationSuccess("Todas las notificaciones están marcadas como leídas.");
}
