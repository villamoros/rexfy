import { SignOutButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { archiveListing } from "@/app/actions/listings";
import { Stat, StatGrid, formatNumber, formatPercent } from "@/components/kpi";
import { SiteHeader } from "@/components/site-header";
import { EmptyState, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import type { CompanyKpis } from "@/lib/dashboard";
import { formatCop } from "@/lib/deals";
import {
  STATUS,
  formatPrice,
  formatQuantity,
  type Listing,
} from "@/lib/listings";
import { roleLabel } from "@/lib/roles";
import { getToken, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Panel · RexFy" };

export default function PanelPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
        <Suspense fallback={<p className="text-muted">Cargando tu panel…</p>}>
          <Dashboard />
        </Suspense>
        <SignOutButton redirectUrl="/ingresar">
          <button className="self-start text-sm text-muted underline">
            Cerrar sesión
          </button>
        </SignOutButton>
      </main>
    </>
  );
}

async function Dashboard() {
  const me = await requireUser();
  if (me.companies.length === 0) redirect("/onboarding");
  const isGenerator = me.companies.some((c) =>
    c.market_roles.includes("generator"),
  );
  const token = await getToken();
  const [mine, kpis] = await Promise.all([
    isGenerator ? apiFetch<Listing[]>("/me/listings", { token }) : null,
    apiFetch<CompanyKpis[]>("/me/dashboard", { token }),
  ]);
  const kpisOf = (id: string) =>
    kpis.ok ? kpis.data.find((k) => k.company_id === id) : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Tu panel"
        title={`Hola, ${me.full_name.split(" ")[0]}`}
        actions={
          <>
            <Link href="/marketplace" className="btn btn-secondary">
              Buscar material
            </Link>
            {isGenerator && (
              <Link href="/publicar" className="btn btn-primary">
                Publicar material
              </Link>
            )}
          </>
        }
      />
      <ul className="flex flex-col gap-3">
        {me.companies.map((company) => (
          <li key={company.company_id} className="card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xl font-semibold">{company.legal_name}</p>
              <span className="flex gap-3 text-sm">
                <Link
                  href={`/empresas/${company.company_id}`}
                  className="text-muted underline hover:text-foreground"
                >
                  Perfil público
                </Link>
                <Link
                  href={`/panel/equipo/${company.company_id}`}
                  className="text-muted underline hover:text-foreground"
                >
                  Equipo
                </Link>
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {company.market_roles.map((role) => (
                <span key={role} className="chip">
                  {roleLabel(role)}
                </span>
              ))}
            </div>
            {company.is_verified ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                <span className="size-1.5 rounded-full bg-signal" />
                Empresa verificada por RexFy.
              </p>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                <span className="size-1.5 rounded-full bg-warn" />
                Pendiente de verificación. El equipo de RexFy revisa el NIT y
                los datos de la empresa.
              </p>
            )}
            <CompanyStats kpis={kpisOf(company.company_id)} />
          </li>
        ))}
      </ul>

      {mine?.ok && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Mis publicaciones</h2>
          {mine.data.length === 0 ? (
            <EmptyState>Aún no has publicado material.</EmptyState>
          ) : (
            <ul className="divide-y divide-border card">
              {mine.data.map((listing) => (
                <li
                  key={listing.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/publicaciones/${listing.id}`}
                      className="font-medium hover:underline"
                    >
                      {listing.title}
                    </Link>
                    <p className="text-muted">
                      {STATUS[listing.status]} ·{" "}
                      {formatQuantity(listing.quantity, listing.quantity_unit)}{" "}
                      · {formatPrice(listing)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {listing.status !== "archived" && (
                      <Link
                        href={`/publicaciones/${listing.id}/editar`}
                        className="text-muted underline hover:text-foreground"
                      >
                        {listing.status === "draft" ? "Continuar" : "Editar"}
                      </Link>
                    )}
                    {listing.status === "published" && (
                      <form action={archiveListing}>
                        <input type="hidden" name="id" value={listing.id} />
                        <button className="text-muted underline hover:text-foreground">
                          Archivar
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}

function hours(value: number | null): string {
  if (value === null) return "—";
  return value < 1
    ? `${Math.round(value * 60)} min`
    : `${formatNumber(value)} h`;
}

/** The numbers docs/01 tracks for each role the company plays. */
function CompanyStats({ kpis }: { kpis?: CompanyKpis }) {
  if (!kpis) return null;
  return (
    <div className="mt-4 flex flex-col gap-3">
      {kpis.seller && (
        <StatGrid>
          <Stat
            label="Publicaciones activas"
            value={kpis.seller.active_listings}
          />
          <Stat
            label="Compradores interesados"
            value={kpis.seller.leads_30d}
            hint="Últimos 30 días"
          />
          <Stat
            label="Tiempo de respuesta"
            value={hours(kpis.seller.avg_first_reply_hours)}
            hint="Promedio al primer mensaje"
          />
          <Stat label="Órdenes de venta" value={kpis.seller.orders} />
          <Stat
            label="Toneladas vendidas"
            value={formatNumber(kpis.seller.tons_sold)}
          />
          <Stat label="Ventas" value={formatCop(kpis.seller.revenue)} />
        </StatGrid>
      )}
      {kpis.buyer && (
        <StatGrid>
          <Stat
            label="Negociaciones abiertas"
            value={kpis.buyer.open_negotiations}
          />
          <Stat label="Órdenes de compra" value={kpis.buyer.orders} />
          <Stat
            label="Días para asegurar material"
            value={
              kpis.buyer.avg_days_to_secure === null
                ? "—"
                : formatNumber(kpis.buyer.avg_days_to_secure)
            }
            hint="Del primer mensaje a la orden"
          />
          <Stat
            label="Toneladas compradas"
            value={formatNumber(kpis.buyer.tons_bought)}
          />
          <Stat label="Compras" value={formatCop(kpis.buyer.spend)} />
        </StatGrid>
      )}
      {kpis.transporter && (
        <StatGrid>
          <Stat
            label="Cotizaciones enviadas"
            value={kpis.transporter.quotes_sent}
          />
          <Stat
            label="Tasa de éxito"
            value={formatPercent(kpis.transporter.win_rate)}
            hint={`${kpis.transporter.quotes_won} ganadas`}
          />
          <Stat label="Viajes en curso" value={kpis.transporter.trips_active} />
          <Stat
            label="Viajes entregados"
            value={kpis.transporter.trips_delivered}
          />
        </StatGrid>
      )}
    </div>
  );
}
