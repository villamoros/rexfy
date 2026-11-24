import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BrandLoader } from "@/components/brand-loader";
import { Stat, StatGrid, formatNumber, formatPercent } from "@/components/kpi";
import { RequestError } from "@/components/request-error";
import { SiteHeader } from "@/components/site-header";
import { EmptyState, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import type { PlatformKpis, ProductFunnel } from "@/lib/dashboard";
import { formatCop, formatDateTime } from "@/lib/deals";
import { formatPrice, formatQuantity, type Listing } from "@/lib/listings";
import { getToken, requireUser } from "@/lib/session";
import { DISPUTE_REASONS, type AdminDispute } from "@/lib/trust";
import type { CursorPage } from "@/lib/pagination";

import { ResolveForm } from "./resolve-form";
import { TakeDownForm } from "./take-down-form";
import { Activity, Companies, OutboxSection } from "./operational-sections";
import type {
  AdminCompany,
  AuditEntry,
  OutboxEvent,
  OutboxHealth,
} from "./model";

export const metadata: Metadata = { title: "Admin · RexFy" };

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
        <Suspense fallback={<BrandLoader overlay boundary />}>
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
  const [
    metrics,
    funnel,
    disputes,
    pending,
    verified,
    listings,
    activity,
    outboxHealth,
    outboxEvents,
  ] = await Promise.all([
    apiFetch<PlatformKpis>("/admin/metrics", { token }),
    apiFetch<ProductFunnel>("/admin/funnel", { token }),
    apiFetch<AdminDispute[]>("/admin/disputes?status=open", { token }),
    apiFetch<CursorPage<AdminCompany>>(
      "/admin/companies?verified=false&limit=100",
      { token },
    ),
    apiFetch<CursorPage<AdminCompany>>(
      "/admin/companies?verified=true&limit=100",
      { token },
    ),
    apiFetch<CursorPage<Listing>>(
      "/admin/listings?status=published&limit=100",
      { token },
    ),
    apiFetch<CursorPage<AuditEntry>>("/admin/audit?limit=30", { token }),
    apiFetch<OutboxHealth>("/admin/outbox/health", { token }),
    apiFetch<CursorPage<OutboxEvent>>("/admin/outbox?limit=30", { token }),
  ]);

  const m = metrics.ok ? metrics.data : null;
  return (
    <>
      {!metrics.ok && (
        <RequestError message={metrics.message} requestId={metrics.requestId} />
      )}
      {m && (
        <Section title="La plataforma">
          <StatGrid>
            <Stat
              label="Toneladas reutilizadas"
              value={formatNumber(m.tons_reused)}
              hint="Órdenes cerradas, histórico"
            />
            <Stat
              label="GMV"
              value={formatCop(m.gmv_30d)}
              hint={`${m.orders_30d} órdenes, últimos 30 días`}
            />
            <Stat
              label="Transacciones exitosas"
              value={formatPercent(m.completed_rate)}
            />
            <Stat
              label="Publicaciones nuevas"
              value={m.listings_published_30d}
              hint="Últimos 30 días"
            />
            <Stat
              label="Empresas activas"
              value={m.active_companies_30d}
              hint="Con mensajes en 30 días"
            />
            <Stat
              label="Con logística RexFy"
              value={formatPercent(m.logistics_attach_rate)}
            />
            <Stat
              label="Disputas abiertas"
              value={m.open_disputes}
              hint={`Tasa ${formatPercent(m.dispute_rate)}`}
            />
            <Stat
              label="Resolución de disputas"
              value={
                m.avg_dispute_resolution_hours === null
                  ? "—"
                  : `${formatNumber(m.avg_dispute_resolution_hours)} h`
              }
            />
            <Stat
              label="Por verificar"
              value={m.companies_pending_verification}
            />
          </StatGrid>
        </Section>
      )}
      <Section title="Funnel de producto">
        {!funnel.ok ? (
          <RequestError message={funnel.message} requestId={funnel.requestId} />
        ) : (
          <>
            <p className="text-sm text-muted">
              Ventana móvil de {funnel.data.window_days} días · zona horaria{" "}
              {funnel.data.timezone}. Cada paso cuenta entidades únicas.
            </p>
            <StatGrid>
              {funnel.data.steps.map((step) => (
                <Stat
                  key={step.key}
                  label={step.label}
                  value={step.entities}
                  hint={
                    step.conversion_from_previous === null
                      ? "Inicio del funnel"
                      : `${formatPercent(step.conversion_from_previous)} desde el paso anterior`
                  }
                />
              ))}
            </StatGrid>
            {funnel.data.segments.length === 0 ? (
              <EmptyState>
                Aún no hay volumen suficiente para mostrar segmentos sin exponer
                grupos pequeños.
              </EmptyState>
            ) : (
              <ul className="card divide-y divide-border text-sm">
                {funnel.data.segments.map((segment) => (
                  <li
                    key={`${segment.dimension}-${segment.value}`}
                    className="flex flex-wrap justify-between gap-3 px-4 py-3"
                  >
                    <span className="font-medium">
                      {segment.dimension} · {segment.value}
                    </span>
                    <span className="text-muted">
                      {segment.events} eventos · {segment.companies} empresas
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Section>
      <Section title="Entrega de notificaciones">
        <OutboxSection health={outboxHealth} events={outboxEvents} />
      </Section>
      <Section title="Disputas abiertas">
        {!disputes.ok ? (
          <RequestError
            message={disputes.message}
            requestId={disputes.requestId}
          />
        ) : disputes.data.length === 0 ? (
          <EmptyState>No hay disputas abiertas.</EmptyState>
        ) : (
          <ul className="divide-y divide-border card">
            {disputes.data.map((d) => (
              <li key={d.id} className="flex flex-col gap-2 px-4 py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">
                    {d.order_code} · {DISPUTE_REASONS[d.reason]}
                  </span>
                  <span className="text-muted">
                    {formatDateTime(d.created_at)}
                  </span>
                </div>
                <p className="text-muted">
                  {d.buyer.legal_name} compra a {d.seller.legal_name} · reporta{" "}
                  {d.opened_by.legal_name}
                </p>
                <p className="whitespace-pre-line">{d.description}</p>
                <ResolveForm dispute={d} />
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Empresas por verificar">
        <Companies result={pending} verify />
      </Section>
      <Section title="Publicaciones activas">
        {!listings.ok ? (
          <RequestError
            message={listings.message}
            requestId={listings.requestId}
          />
        ) : listings.data.items.length === 0 ? (
          <EmptyState>No hay publicaciones activas.</EmptyState>
        ) : (
          <ul className="divide-y divide-border card">
            {listings.data.items.map((l) => (
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
        <Activity result={activity} />
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
