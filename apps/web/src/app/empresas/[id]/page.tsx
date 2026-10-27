import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ListingCard } from "@/components/listing-card";
import { SiteHeader } from "@/components/site-header";
import { EmptyState } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/deals";
import { roleLabel } from "@/lib/roles";
import { stars, type CompanyProfile } from "@/lib/trust";

export const metadata: Metadata = { title: "Perfil de empresa · RexFy" };

export default function CompanyPage({ params }: PageProps<"/empresas/[id]">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Suspense fallback={<p className="text-muted">Cargando perfil…</p>}>
          <Profile params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function Profile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await apiFetch<CompanyProfile>(
    `/companies/${encodeURIComponent(id)}/profile`,
  );
  if (!result.ok) {
    if (result.status === 404 || result.status === 422) notFound();
    return <p className="text-warn">{result.message}</p>;
  }
  const p = result.data;
  const since = new Date(p.member_since).toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="eyebrow mb-2">Perfil de confianza</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{p.legal_name}</h1>
          <p className="mt-2 text-muted">
            {p.city} · {p.market_roles.map(roleLabel).join(", ")} · en RexFy
            desde {since}
          </p>
        </div>
        <div className="card px-5 py-4 text-center">
          <p className="font-mono text-4xl font-medium">{p.trust_score}</p>
          <p className="text-xs text-muted">Puntaje RexFy / 100</p>
        </div>
      </header>

      <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        <Signal
          label="Verificación"
          value={p.is_verified ? "Empresa verificada" : "Sin verificar"}
          good={p.is_verified}
        />
        <Signal
          label="Calificación"
          value={
            p.average_rating === null
              ? "Sin calificaciones"
              : `${p.average_rating.toFixed(1)} · ${p.review_count} ${p.review_count === 1 ? "reseña" : "reseñas"}`
          }
          good={p.average_rating !== null && p.average_rating >= 4}
        />
        <Signal
          label="Órdenes cerradas"
          value={String(p.completed_orders)}
          good={p.completed_orders > 0}
        />
      </dl>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Reseñas</h2>
        {p.reviews.length === 0 ? (
          <EmptyState>
            Aún no tiene reseñas. Las empresas se califican al cerrar una orden.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border card">
            {p.reviews.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">
                    {r.from_company.legal_name}
                  </span>
                  <span className="text-signal" aria-label={`${r.rating} de 5`}>
                    {stars(r.rating)}
                  </span>
                </div>
                {r.comment && <p>{r.comment}</p>}
                <p className="text-xs text-muted">
                  {formatDateTime(r.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {p.listings.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Material disponible</h2>
          <ul className="flex flex-col gap-3">
            {p.listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function Signal({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 flex items-center gap-2 font-medium">
        <span
          className={`size-1.5 rounded-full ${good ? "bg-signal" : "bg-border"}`}
          aria-hidden
        />
        {value}
      </dd>
    </div>
  );
}
