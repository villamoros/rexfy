import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

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
      <div className="mt-6">
        <PublishWizard
          companies={[{ id: owner.company_id, name: owner.legal_name }]}
          listing={listing}
        />
      </div>
    </>
  );
}
