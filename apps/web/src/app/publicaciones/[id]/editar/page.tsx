import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { removePhoto } from "@/app/actions/listings";
import { PublishWizard } from "@/app/publicar/wizard";
import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import type { Listing } from "@/lib/listings";
import { getToken, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Editar publicación · RexFy" };

export default function EditListingPage({
  params,
}: PageProps<"/publicaciones/[id]/editar">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Suspense fallback={<p className="text-muted">Cargando…</p>}>
          <Editor params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const [me, { id }] = await Promise.all([requireUser(), params]);
  const result = await apiFetch<Listing>(
    `/listings/${encodeURIComponent(id)}`,
    { token: await getToken() },
  );
  if (!result.ok) {
    if (result.status === 404 || result.status === 422) notFound();
    return <p className="text-warn">{result.message}</p>;
  }
  const listing = result.data;
  const owner = me.companies.find(
    (c) =>
      c.company_id === listing.company.id &&
      c.market_roles.includes("generator"),
  );
  // Archived listings stay closed; only their company edits the rest.
  if (!owner || listing.status === "archived") notFound();

  return (
    <>
      <PageHeader
        eyebrow={listing.status === "draft" ? "Borrador" : "Publicación activa"}
        title={
          listing.status === "draft"
            ? "Terminar publicación"
            : "Editar publicación"
        }
      />
      {listing.images.length > 0 && (
        <section className="mt-6 flex flex-col gap-2">
          <h2 className="text-sm font-medium">Fotos actuales</h2>
          <ul className="grid grid-cols-3 gap-2">
            {listing.images.map((image) => (
              <li key={image.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- photos come from the API's storage */}
                <img
                  src={image.url}
                  alt=""
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <form action={removePhoto} className="absolute right-1 top-1">
                  <input type="hidden" name="listing_id" value={listing.id} />
                  <input type="hidden" name="image_id" value={image.id} />
                  <button className="rounded-md bg-surface/90 px-2 py-1 text-xs font-medium shadow">
                    Quitar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="mt-6">
        <PublishWizard
          companies={[{ id: owner.company_id, name: owner.legal_name }]}
          listing={listing}
        />
      </div>
    </>
  );
}
