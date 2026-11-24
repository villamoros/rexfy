import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BrandLoader } from "@/components/brand-loader";
import { OrderProgress } from "@/components/order-progress";
import { CursorNextLink } from "@/components/cursor-next-link";
import { SiteHeader } from "@/components/site-header";
import { RequestError } from "@/components/request-error";
import { EmptyState, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCop, type Transaction } from "@/lib/deals";
import { formatQuantity } from "@/lib/listings";
import { getToken, requireUser } from "@/lib/session";
import type { CursorPage } from "@/lib/pagination";

export const metadata: Metadata = { title: "Órdenes · RexFy" };

export default function OrdenesPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <PageHeader
          title="Órdenes"
          description="Tus compras y ventas cerradas en RexFy."
        />
        <Suspense fallback={<BrandLoader overlay boundary />}>
          <Orders searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function Orders({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  await requireUser();
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const result = await apiFetch<CursorPage<Transaction>>(`/transactions${query}`, {
    token: await getToken(),
  });
  if (!result.ok)
    return (
      <RequestError
        message={result.message}
        requestId={result.requestId}
        className="mt-6"
      />
    );
  if (result.data.items.length === 0) {
    return (
      <EmptyState className="mt-6">
        Cuando aceptes una cotización, la orden aparecerá aquí.
      </EmptyState>
    );
  }
  return (
    <>
    <ul className="mt-6 flex flex-col gap-3">
      {result.data.items.map((order) => (
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
    <CursorNextLink pathname="/ordenes" cursor={result.data.next_cursor} />
    </>
  );
}
