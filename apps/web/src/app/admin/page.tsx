import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { setCompanyVerified } from "@/app/actions/admin";
import { SiteHeader } from "@/components/site-header";
import { EmptyState, PageHeader } from "@/components/ui";
import { apiFetch, type MarketRole } from "@/lib/api";
import { formatDateTime } from "@/lib/deals";
import { formatPrice, formatQuantity, type Listing } from "@/lib/listings";
import { roleLabel } from "@/lib/roles";
import { getToken, requireUser } from "@/lib/session";

import { TakeDownForm } from "./take-down-form";

export const metadata: Metadata = { title: "Admin · RexFy" };

type AdminCompany = {
  id: string;
  legal_name: string;
  nit: string;
  city: string;
  market_roles: MarketRole[];
  is_verified: boolean;
  created_at: string;
  members: number;
};

type AuditEntry = {
  id: string;
  created_at: string;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  data: Record<string, unknown>;
};

const ACTIONS: Record<string, string> = {
  "company.created": "registró una empresa",
  "company.verified": "verificó una empresa",
  "company.unverified": "quitó la verificación",
  "listing.created": "guardó un borrador",
  "listing.published": "publicó material",
  "listing.updated": "editó una publicación",
  "listing.archived": "archivó una publicación",
  "listing.taken_down": "retiró una publicación",
  "offer.sent": "envió una cotización",
  "offer.accepted": "aceptó una cotización",
  "offer.declined": "rechazó una cotización",
  "order.completed": "confirmó la recepción",
  "shipment.requested": "pidió transporte",
  "transport_quote.accepted": "eligió transportador",
  "shipment.advanced": "actualizó un envío",
  "dispute.opened": "abrió una disputa",
  "dispute.resolved": "resolvió una disputa",
  "review.created": "calificó a una empresa",
};

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
        <PageHeader
          eyebrow="Confianza y seguridad"
          title="Admin"
          description="Verifica empresas, modera publicaciones y revisa la actividad de la plataforma."
        />
        <Suspense fallback={<p className="text-muted">Cargando…</p>}>
          <Console />
        </Suspense>
      </main>
    </>
  );
}

async function Console() {
  const me = await requireUser();
  if (!me.is_platform_admin) notFound();
  const token = await getToken();
  const [pending, verified, listings, activity] = await Promise.all([
    apiFetch<AdminCompany[]>("/admin/companies?verified=false", { token }),
    apiFetch<AdminCompany[]>("/admin/companies?verified=true", { token }),
    apiFetch<Listing[]>("/admin/listings?status=published", { token }),
    apiFetch<AuditEntry[]>("/admin/audit?limit=30", { token }),
  ]);

  return (
    <>
      <Section title="Empresas por verificar">
        <Companies result={pending} verify />
      </Section>
      <Section title="Publicaciones activas">
        {!listings.ok || listings.data.length === 0 ? (
          <EmptyState>No hay publicaciones activas.</EmptyState>
        ) : (
          <ul className="divide-y divide-border card">
            {listings.data.map((l) => (
              <li key={l.id} className="flex flex-col gap-2 px-4 py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <Link
                    href={`/publicaciones/${l.id}`}
                    className="font-medium hover:underline"
                  >
                    {l.title}
                  </Link>
                  <span className="text-muted">
                    {l.company.legal_name}
                    {l.company.is_verified ? "" : " · sin verificar"}
                  </span>
                </div>
                <p className="text-muted">
                  {formatQuantity(l.quantity, l.quantity_unit)} ·{" "}
                  {formatPrice(l)} · {l.city}
                </p>
                <TakeDownForm listingId={l.id} />
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Empresas verificadas">
        <Companies result={verified} />
      </Section>
      <Section title="Actividad reciente">
        {!activity.ok || activity.data.length === 0 ? (
          <EmptyState>Sin actividad todavía.</EmptyState>
        ) : (
          <ul className="divide-y divide-border card text-sm">
            {activity.data.map((e) => (
              <li key={e.id} className="flex justify-between gap-4 px-4 py-2">
                <span>
                  <span className="font-medium">
                    {e.actor_name ?? "Sistema"}
                  </span>{" "}
                  {ACTIONS[e.action] ?? e.action}
                  {typeof e.data.reason === "string" && (
                    <span className="text-muted"> · {e.data.reason}</span>
                  )}
                </span>
                <span className="shrink-0 font-mono text-xs text-muted">
                  {formatDateTime(e.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Companies({
  result,
  verify = false,
}: {
  result: Awaited<ReturnType<typeof apiFetch<AdminCompany[]>>>;
  verify?: boolean;
}) {
  if (!result.ok) return <p className="text-sm text-warn">{result.message}</p>;
  if (result.data.length === 0)
    return (
      <EmptyState>
        {verify ? "No hay empresas esperando revisión." : "Ninguna todavía."}
      </EmptyState>
    );
  return (
    <ul className="divide-y divide-border card">
      {result.data.map((c) => (
        <li
          key={c.id}
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
        >
          <div className="min-w-0">
            <p className="font-medium">{c.legal_name}</p>
            <p className="text-muted">
              NIT <span className="font-mono">{c.nit}</span> · {c.city} ·{" "}
              {c.market_roles.map(roleLabel).join(", ")} · {c.members}{" "}
              {c.members === 1 ? "miembro" : "miembros"} · desde{" "}
              {formatDateTime(c.created_at)}
            </p>
          </div>
          <form action={setCompanyVerified}>
            <input type="hidden" name="company_id" value={c.id} />
            <input type="hidden" name="verified" value={String(verify)} />
            <button
              className={`btn text-sm ${verify ? "btn-primary" : "btn-secondary"}`}
            >
              {verify ? "Verificar" : "Quitar verificación"}
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
