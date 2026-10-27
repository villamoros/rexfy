import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { confirmReceipt } from "@/app/actions/deals";
import { acceptTransportQuote } from "@/app/actions/logistics";
import { AutoRefresh } from "@/components/auto-refresh";
import { OrderProgress } from "@/components/order-progress";
import { ShipmentTimeline } from "@/components/shipment-timeline";
import { SiteHeader } from "@/components/site-header";
import { apiFetch } from "@/lib/api";
import {
  TRANSACTION_STATUS,
  formatCop,
  formatDateTime,
  type Transaction,
} from "@/lib/deals";
import { formatQuantity } from "@/lib/listings";
import {
  SHIPMENT_STATUS,
  VEHICLES,
  formatDate,
  type Shipment,
} from "@/lib/logistics";
import { getToken, requireUser } from "@/lib/session";

import { ShipmentRequestForm } from "./shipment-request-form";

export const metadata: Metadata = { title: "Orden · RexFy" };

export default function OrderPage({
  params,
  searchParams,
}: PageProps<"/ordenes/[id]">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Suspense fallback={<p className="text-muted">Cargando orden…</p>}>
          <Order params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function Order({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const result = await apiFetch<Transaction>(
    `/transactions/${encodeURIComponent(id)}`,
    {
      token: await getToken(),
    },
  );
  if (!result.ok) {
    if (result.status === 404 || result.status === 422) notFound();
    return <p className="text-warn">{result.message}</p>;
  }
  const order = result.data;
  const shipment = await apiFetch<Shipment>(
    `/transactions/${order.id}/shipment`,
    {
      token: await getToken(),
    },
  );
  const rows: [string, string][] = [
    ["Vendedor", order.seller.legal_name],
    ["Comprador", order.buyer.legal_name],
    ["Cantidad", formatQuantity(order.quantity, order.quantity_unit)],
    ["Precio", `${formatCop(order.price)} / ${order.price_unit}`],
    ...(order.total !== null
      ? [["Total", formatCop(order.total)] as [string, string]]
      : []),
    ["Acordada el", formatDateTime(order.created_at)],
    ["Estado", TRANSACTION_STATUS[order.status]],
  ];

  return (
    <article className="flex flex-col gap-6">
      {query.nueva === "1" && (
        <p className="rounded-lg border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-brand">
          ¡Trato cerrado! Ya pueden coordinar la entrega.
        </p>
      )}
      <header>
        <p className="text-xs text-muted">
          {order.code} · {order.my_role === "buyer" ? "Compra" : "Venta"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{order.listing.title}</h1>
      </header>
      <OrderProgress status={order.status} />
      <dl className="divide-y divide-border rounded-xl border border-border text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/mensajes/${order.thread_id}`}
          className="rounded-lg border border-border px-4 py-2.5 text-sm hover:border-brand"
        >
          Ir al chat
        </Link>
        {order.my_role === "buyer" && order.status !== "completed" && (
          <form action={confirmReceipt}>
            <input type="hidden" name="transaction_id" value={order.id} />
            <button className="rounded-lg bg-brand-strong px-4 py-2.5 text-sm font-medium text-white hover:opacity-90">
              Confirmar recepción del material
            </button>
          </form>
        )}
      </div>
      <Logistics order={order} shipment={shipment.ok ? shipment.data : null} />
    </article>
  );
}

function Logistics({
  order,
  shipment,
}: {
  order: Transaction;
  shipment: Shipment | null;
}) {
  if (!shipment) {
    if (order.status !== "agreed") return null;
    return (
      <section className="flex flex-col gap-3 rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold">Transporte</h2>
        <p className="text-sm text-muted">
          Pide cotizaciones a transportistas de RexFy. Si el comprador recoge en
          planta, puedes omitir este paso.
        </p>
        <ShipmentRequestForm
          transactionId={order.id}
          pickupCity={order.listing.city}
        />
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <AutoRefresh seconds={15} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Transporte</h2>
        <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-medium text-brand">
          {SHIPMENT_STATUS[shipment.status]}
        </span>
      </div>
      <p className="text-sm">
        {shipment.pickup_city} → {shipment.delivery_city} ·{" "}
        {VEHICLES[shipment.vehicle_type]} · recogida el{" "}
        {formatDate(shipment.pickup_date)}
      </p>
      {shipment.transporter && (
        <p className="text-sm">
          Transportador:{" "}
          <span className="font-medium">{shipment.transporter.legal_name}</span>
        </p>
      )}
      {shipment.status === "requested" &&
        (shipment.quotes.length === 0 ? (
          <p className="text-sm text-muted">
            Esperando cotizaciones de transportistas…
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {shipment.quotes.map((quote, i) => (
              <li
                key={quote.id}
                className="rounded-lg border border-border p-4 text-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {quote.transporter.legal_name}
                  </span>
                  <span className="text-lg font-semibold">
                    {formatCop(quote.price)}
                  </span>
                </div>
                <p className="mt-1 text-muted">
                  Recogida {formatDate(quote.pickup_date)} · entrega estimada{" "}
                  {formatDate(quote.delivery_date)} ·{" "}
                  {quote.includes_insurance
                    ? "seguro de carga incluido"
                    : "sin seguro de carga"}
                  {i === 0 && shipment.quotes.length > 1 && " · Menor precio"}
                </p>
                {quote.notes && <p className="mt-1">{quote.notes}</p>}
                <form action={acceptTransportQuote} className="mt-3">
                  <input type="hidden" name="quote_id" value={quote.id} />
                  <input type="hidden" name="transaction_id" value={order.id} />
                  <button className="rounded-lg bg-brand-strong px-4 py-2 font-medium text-white hover:opacity-90">
                    Aceptar {formatCop(quote.price)}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ))}
      <ShipmentTimeline events={shipment.events} />
    </section>
  );
}
