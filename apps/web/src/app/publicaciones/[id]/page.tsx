import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { apiFetch, type Me } from "@/lib/api";
import {
  CATEGORIES,
  CONDITIONS,
  STATUS,
  availabilityLabel,
  formatPrice,
  formatQuantity,
  type Listing,
} from "@/lib/listings";
import { getToken } from "@/lib/session";

import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Publicación · RexFy" };

export default function ListingPage({
  params,
  searchParams,
}: PageProps<"/publicaciones/[id]">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Suspense
          fallback={<p className="text-muted">Cargando publicación…</p>}
        >
          <Detail params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function Detail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query, token] = await Promise.all([
    params,
    searchParams,
    getToken(),
  ]);
  const result = await apiFetch<Listing>(
    `/listings/${encodeURIComponent(id)}`,
    { token },
  );
  if (!result.ok) {
    if (result.status === 404 || result.status === 422) notFound();
    return <p className="text-warn">{result.message}</p>;
  }
  const listing = result.data;
  const me = token ? await apiFetch<Me>("/me", { token }) : null;
  const buyerCompanies = me?.ok
    ? me.data.companies
        .filter(
          (c) =>
            c.market_roles.includes("buyer") &&
            c.company_id !== listing.company.id,
        )
        .map((c) => ({ id: c.company_id, name: c.legal_name }))
    : [];
  const isOwner =
    me?.ok &&
    me.data.companies.some((c) => c.company_id === listing.company.id);
  const rows: [string, string][] = [
    ["Cantidad", formatQuantity(listing.quantity, listing.quantity_unit)],
    ...(listing.min_order_quantity !== null
      ? [
          [
            "Mínimo de compra",
            formatQuantity(listing.min_order_quantity, listing.quantity_unit),
          ] as [string, string],
        ]
      : []),
    ["Estado del material", CONDITIONS[listing.condition]],
    ["Disponibilidad", availabilityLabel(listing)],
    ["Ubicación", listing.city],
    ["Retiro en sitio", listing.pickup_allowed ? "Sí, disponible" : "No"],
    ["Tipo de oferta", listing.is_recurring ? "Recurrente" : "Puntual"],
  ];

  return (
    <article className="flex flex-col gap-6">
      {query.nueva === "1" && (
        <p className="rounded-lg border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-brand">
          ¡Publicación activa! Ya es visible para los compradores en el
          marketplace.
        </p>
      )}
      <header>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
          <span className="text-brand">{CATEGORIES[listing.category]}</span>
          {listing.status !== "published" && (
            <span className="rounded-full bg-warn/15 px-2 py-0.5 text-warn">
              {STATUS[listing.status]}
            </span>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-semibold">{listing.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {listing.company.legal_name} · {listing.company.city}
          {listing.company.is_verified ? " · Empresa verificada" : ""}
        </p>
      </header>

      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-2xl font-semibold">{formatPrice(listing)}</p>
        {listing.price_negotiable && (
          <p className="text-sm text-muted">Precio negociable</p>
        )}
        {listing.status !== "published" || isOwner ? null : !me?.ok ? (
          <Link
            href="/ingresar"
            className="mt-4 block rounded-lg bg-brand-strong px-4 py-2.5 text-center font-medium text-white hover:opacity-90"
          >
            Ingresa para contactar al generador
          </Link>
        ) : buyerCompanies.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Para negociar, tu empresa debe estar registrada como compradora.
          </p>
        ) : (
          <ContactForm listingId={listing.id} companies={buyerCompanies} />
        )}
      </div>

      {listing.description && (
        <p className="whitespace-pre-line">{listing.description}</p>
      )}

      <dl className="divide-y divide-border rounded-xl border border-border text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      {listing.conditions && (
        <section>
          <h2 className="font-medium">Condiciones adicionales</h2>
          <p className="mt-1 whitespace-pre-line text-sm text-muted">
            {listing.conditions}
          </p>
        </section>
      )}

      <Link href="/marketplace" className="text-sm text-brand underline">
        ← Volver al marketplace
      </Link>
    </article>
  );
}
