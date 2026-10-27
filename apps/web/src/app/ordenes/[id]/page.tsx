import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { confirmReceipt } from "@/app/actions/deals";
import { OrderProgress } from "@/components/order-progress";
import { SiteHeader } from "@/components/site-header";
import { apiFetch } from "@/lib/api";
import {
  TRANSACTION_STATUS,
  formatCop,
  formatDateTime,
  type Transaction,
} from "@/lib/deals";
import { formatQuantity } from "@/lib/listings";
import { getToken, requireUser } from "@/lib/session";

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
    </article>
  );
}
