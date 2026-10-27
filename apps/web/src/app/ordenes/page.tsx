import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { OrderProgress } from "@/components/order-progress";
import { SiteHeader } from "@/components/site-header";
import { EmptyState, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCop, type Transaction } from "@/lib/deals";
import { formatQuantity } from "@/lib/listings";
import { getToken, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Órdenes · RexFy" };

export default function OrdenesPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <PageHeader
          title="Órdenes"
          description="Tus compras y ventas cerradas en RexFy."
        />
        <Suspense
          fallback={<p className="mt-6 text-muted">Cargando órdenes…</p>}
        >
          <Orders />
        </Suspense>
      </main>
    </>
  );
}

async function Orders() {
  await requireUser();
  const result = await apiFetch<Transaction[]>("/transactions", {
    token: await getToken(),
  });
  if (!result.ok) return <p className="mt-6 text-warn">{result.message}</p>;
  if (result.data.length === 0) {
    return (
      <EmptyState className="mt-6">
        Cuando aceptes una cotización, la orden aparecerá aquí.
      </EmptyState>
    );
  }
  return (
    <ul className="mt-6 flex flex-col gap-3">
      {result.data.map((order) => (
        <li key={order.id} className="card p-4">
          <Link href={`/ordenes/${order.id}`} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">{order.listing.title}</span>
              <span className="text-xs text-muted">
                {order.code} · {order.my_role === "buyer" ? "Compra" : "Venta"}
              </span>
            </div>
            <p className="text-sm text-muted">
              {order.my_role === "buyer"
                ? order.seller.legal_name
                : order.buyer.legal_name}{" "}
              · {formatQuantity(order.quantity, order.quantity_unit)}
              {order.total !== null && ` · ${formatCop(order.total)}`}
            </p>
            <OrderProgress status={order.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
