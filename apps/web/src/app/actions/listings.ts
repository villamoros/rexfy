"use server";

import { revalidatePath } from "next/cache";
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

/**
 * Saves the wizard. New listings are created (and published unless the user chose to keep a
 * draft) in one request; an existing one is updated, and a draft is published afterwards.
 */
export async function saveListing(
  _: PublishState,
  formData: FormData,
): Promise<PublishState> {
  const token = await getToken();
  if (!token) redirect("/ingresar");

  const listingId = text(formData, "listing_id");
  const asDraft = formData.get("intent") === "draft";
  const free = formData.get("pricing_type") === "free";
  const terms = {
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

  const saved = listingId
    ? await apiFetch<Listing>(`/listings/${encodeURIComponent(listingId)}`, {
        method: "PATCH",
        token,
        body: terms,
      })
    : await apiFetch<Listing>("/listings", {
        method: "POST",
        token,
        body: {
          ...terms,
          company_id: text(formData, "company_id"),
          publish: !asDraft,
        },
      });
  if (!saved.ok) {
    if (saved.status === 401) redirect("/ingresar");
    const fieldErrors = { ...saved.fieldErrors };
    const general = fieldErrors.body;
    delete fieldErrors.body;
    return { message: general ?? saved.message, fieldErrors };
  }

  const listing = saved.data;
  const photos = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  let photosFailed = false;
  if (photos.length > 0) {
    const upload = new FormData();
    for (const photo of photos) upload.append("files", photo);
    const uploaded = await apiFetch<Listing>(
      `/listings/${listing.id}/images`,
      { method: "POST", token, body: upload },
    );
    photosFailed = !uploaded.ok;
  }
  // The listing is saved either way; a failed upload is reported on its page.
  const notice = photosFailed ? "&fotos=error" : "";
  if (listing.status === "draft" && !asDraft) {
    const published = await apiFetch<Listing>(
      `/listings/${listing.id}/publish`,
      { method: "POST", token },
    );
    if (!published.ok) return { message: published.message };
    redirect(`/publicaciones/${listing.id}?nueva=1${notice}`);
  }
  if (asDraft) redirect(`/publicaciones/${listing.id}?borrador=1${notice}`);
  redirect(
    `/publicaciones/${listing.id}?${listingId ? "editada=1" : "nueva=1"}${notice}`,
  );
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

export async function removePhoto(formData: FormData) {
  const token = await getToken();
  if (!token) redirect("/ingresar");
  const listingId = encodeURIComponent(String(formData.get("listing_id")));
  const imageId = encodeURIComponent(String(formData.get("image_id")));
  await apiFetch(`/listings/${listingId}/images/${imageId}`, {
    method: "DELETE",
    token,
  });
  revalidatePath(`/publicaciones/${listingId}/editar`);
}
