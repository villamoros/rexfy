import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { advanceShipment } from "@/app/actions/logistics";
import { ShipmentTimeline } from "@/components/shipment-timeline";
import { SiteHeader } from "@/components/site-header";
import { apiFetch } from "@/lib/api";
import { formatCop } from "@/lib/deals";
import { formatQuantity } from "@/lib/listings";
import {
  NEXT_ACTION,
  NEXT_STATUS,
  SHIPMENT_STATUS,
  VEHICLES,
  formatDate,
  type Shipment,
} from "@/lib/logistics";
import { getToken, requireUser } from "@/lib/session";

import { TransportQuoteForm } from "./quote-form";

export const metadata: Metadata = { title: "Transporte · RexFy" };

export default function TransportePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-semibold">Transporte</h1>
        <p className="mt-1 text-sm text-muted">
          Cotiza viajes de material reciclable y actualiza tus envíos.
        </p>
        <Suspense fallback={<p className="mt-6 text-muted">Cargando…</p>}>
          <Board />
        </Suspense>
      </main>
    </>
  );
}

async function Board() {
  const me = await requireUser();
  const companies = me.companies
    .filter((c) => c.market_roles.includes("transporter"))
    .map((c) => ({ id: c.company_id, name: c.legal_name }));
  if (companies.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-border bg-surface p-5 text-sm text-muted">
        Esta sección es para empresas transportadoras.{" "}
        <Link href="/onboarding" className="text-brand underline">
          Registra una empresa transportadora
        </Link>
        . Si compraste o vendiste material, el transporte se gestiona desde{" "}
        <Link href="/ordenes" className="text-brand underline">
          tus órdenes
        </Link>
        .
      </p>
    );
  }
  const token = await getToken();
  const [open, mine] = await Promise.all([
    apiFetch<Shipment[]>("/logistics/requests", { token }),
    apiFetch<Shipment[]>("/logistics/shipments", { token }),
  ]);

  return (
    <div className="mt-6 flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Mis envíos</h2>
        {!mine.ok || mine.data.length === 0 ? (
          <p className="text-sm text-muted">
            Cuando un cliente acepte tu cotización, el envío aparecerá aquí.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {mine.data.map((s) => {
              const next = NEXT_STATUS[s.status];
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 text-sm"
                >
                  <Route shipment={s} />
                  <p>
                    Recoger en{" "}
                    <span className="font-medium">{s.pickup_address}</span> ·
                    entregar en{" "}
                    <span className="font-medium">{s.delivery_address}</span>
                  </p>
                  <span className="w-fit rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-medium text-brand">
                    {SHIPMENT_STATUS[s.status]}
                  </span>
                  {next && (
                    <form
                      action={advanceShipment}
                      className="flex flex-col gap-2 sm:flex-row"
                    >
                      <input type="hidden" name="shipment_id" value={s.id} />
                      <input type="hidden" name="status" value={next} />
                      <input
                        name="note"
                        placeholder="Nota (placa, ubicación, novedades)"
                        aria-label="Nota"
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2"
                      />
                      <button className="rounded-lg bg-brand-strong px-4 py-2 font-medium text-white hover:opacity-90">
                        {NEXT_ACTION[next]}
                      </button>
                    </form>
                  )}
                  <ShipmentTimeline events={s.events} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Solicitudes abiertas</h2>
        {!open.ok || open.data.length === 0 ? (
          <p className="text-sm text-muted">
            No hay solicitudes de transporte abiertas en este momento.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {open.data.map((s) => {
              const myQuote = s.quotes[0];
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-3 rounded-xl border border-border p-4 text-sm"
                >
                  <Route shipment={s} />
                  {s.requirements && (
                    <p className="text-muted">{s.requirements}</p>
                  )}
                  {myQuote ? (
                    <p className="text-brand">
                      Ya cotizaste {formatCop(myQuote.price)}. Te avisaremos si
                      el cliente la acepta.
                    </p>
                  ) : (
                    <TransportQuoteForm
                      shipmentId={s.id}
                      companies={companies}
                      pickupDate={s.pickup_date}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Route({ shipment }: { shipment: Shipment }) {
  return (
    <div>
      <p className="font-medium">
        {shipment.pickup_city} → {shipment.delivery_city}
      </p>
      <p className="text-muted">
        {shipment.order.listing_title} ·{" "}
        {formatQuantity(shipment.order.quantity, shipment.order.quantity_unit)}{" "}
        · {VEHICLES[shipment.vehicle_type]} · recogida el{" "}
        {formatDate(shipment.pickup_date)}
      </p>
    </div>
  );
}
