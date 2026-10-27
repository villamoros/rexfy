"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/session";

/** Marks the notification read and goes where it points. */
export async function openNotification(formData: FormData) {
  const token = await getToken();
  if (!token) redirect("/ingresar");
  const id = encodeURIComponent(String(formData.get("id")));
  const link = String(formData.get("link"));
  await apiFetch(`/notifications/${id}/read`, { method: "POST", token });
  // Only paths inside the app.
  redirect(link.startsWith("/") && !link.startsWith("//") ? link : "/panel");
}

export async function markAllRead() {
  const token = await getToken();
  if (!token) redirect("/ingresar");
  await apiFetch("/notifications/read", { method: "POST", token });
  revalidatePath("/notificaciones");
}
