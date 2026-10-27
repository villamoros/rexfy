import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { respondToOffer } from "@/app/actions/deals";
import { AutoRefresh } from "@/components/auto-refresh";
import { SiteHeader } from "@/components/site-header";
import { apiFetch } from "@/lib/api";
import {
  OFFER_STATUS,
  formatCop,
  formatDateTime,
  type Offer,
  type ThreadDetail,
  type ThreadMessage,
} from "@/lib/deals";
import { formatPrice, formatQuantity } from "@/lib/listings";
import { getToken, requireUser } from "@/lib/session";

import { MessageComposer, OfferComposer } from "./composer";

export const metadata: Metadata = { title: "Negociación · RexFy" };

export default function ThreadPage({ params }: PageProps<"/mensajes/[id]">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Suspense
          fallback={<p className="text-muted">Cargando conversación…</p>}
        >
          <Conversation params={params} />
        </Suspense>
      </main>
    </>
  );
}

type Entry = { at: string } & (
  | { kind: "message"; message: ThreadMessage }
  | { kind: "offer"; offer: Offer }
);

async function Conversation({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const result = await apiFetch<ThreadDetail>(
    `/threads/${encodeURIComponent(id)}`,
    {
      token: await getToken(),
    },
  );
  if (!result.ok) {
    if (result.status === 404 || result.status === 422) notFound();
    return <p className="text-warn">{result.message}</p>;
  }
  const thread = result.data;
  const iAmBuyer = thread.my_company_id === thread.buyer.id;
  const counterpart = iAmBuyer ? thread.seller : thread.buyer;
  const pending = thread.offers.find((o) => o.status === "pending");
  const timeline: Entry[] = [
    ...thread.messages.map((m) => ({
      kind: "message" as const,
      at: m.created_at,
      message: m,
    })),
    ...thread.offers.map((o) => ({
      kind: "offer" as const,
      at: o.created_at,
      offer: o,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="flex flex-col gap-4">
      <AutoRefresh />
      <header className="card p-4">
        <Link href="/mensajes" className="text-xs text-muted underline">
          ← Mensajes
        </Link>
        <h1 className="mt-1 text-lg font-semibold">
          <Link
            href={`/empresas/${counterpart.id}`}
            className="underline-offset-2 hover:underline"
          >
            {counterpart.legal_name}
          </Link>
        </h1>
        <p className="text-sm text-muted">
          <Link
            href={`/publicaciones/${thread.listing.id}`}
            className="hover:underline"
          >
            {thread.listing.title}
          </Link>{" "}
          ·{" "}
          {formatQuantity(
            thread.listing.quantity,
            thread.listing.quantity_unit,
          )}{" "}
          disponibles ·{" "}
          {formatPrice({
            pricing_type: thread.listing.price === null ? "free" : "paid",
            price: thread.listing.price,
            price_unit: thread.listing.price_unit,
          })}
        </p>
      </header>

      {thread.transaction_id && (
        <Link
          href={`/ordenes/${thread.transaction_id}`}
          className="rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm font-medium text-brand"
        >
          Trato cerrado. Ver la orden →
        </Link>
      )}

      <ol className="flex flex-col gap-3">
        {timeline.map((entry) =>
          entry.kind === "message" ? (
            <Bubble
              key={entry.message.id}
              message={entry.message}
              mine={entry.message.sender_company_id === thread.my_company_id}
            />
          ) : (
            <OfferCard
              key={entry.offer.id}
              offer={entry.offer}
              threadId={thread.id}
              mine={entry.offer.from_company_id === thread.my_company_id}
              senderName={
                entry.offer.from_company_id === thread.buyer.id
                  ? thread.buyer.legal_name
                  : thread.seller.legal_name
              }
            />
          ),
        )}
      </ol>

      {!thread.transaction_id && (
        <OfferComposer
          threadId={thread.id}
          quantityUnit={thread.listing.quantity_unit}
          maxQuantity={thread.listing.quantity}
          defaultPrice={pending?.price ?? thread.listing.price}
          defaultPriceUnit={pending?.price_unit ?? thread.listing.price_unit}
          label={
            pending && pending.from_company_id !== thread.my_company_id
              ? "Contraofertar"
              : "Enviar cotización formal"
          }
        />
      )}
      <MessageComposer threadId={thread.id} />
    </div>
  );
}

function Bubble({ message, mine }: { message: ThreadMessage; mine: boolean }) {
  return (
    <li className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
          mine
            ? "bg-primary text-on-primary"
            : "border border-border bg-surface"
        }`}
      >
        {message.body}
      </div>
      <span className="mt-1 text-xs text-muted">
        {mine ? "" : `${message.sender_name} · `}
        {formatDateTime(message.created_at)}
      </span>
    </li>
  );
}

function OfferCard({
  offer,
  threadId,
  mine,
  senderName,
}: {
  offer: Offer;
  threadId: string;
  mine: boolean;
  senderName: string;
}) {
  const rows: [string, string][] = [
    ["Cantidad", formatQuantity(offer.quantity, offer.quantity_unit)],
    ["Precio", `${formatCop(offer.price)} / ${offer.price_unit}`],
    ...(offer.total !== null
      ? [["Total", formatCop(offer.total)] as [string, string]]
      : []),
    ...(offer.notes ? [["Condiciones", offer.notes] as [string, string]] : []),
  ];
  return (
    <li className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className="w-full max-w-sm rounded-2xl border-2 border-brand/40 bg-surface p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">
            Cotización formal · {senderName}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${offer.status === "pending" ? "bg-warn/15 text-warn" : offer.status === "accepted" ? "bg-brand/15 text-brand" : "bg-border text-muted"}`}
          >
            {OFFER_STATUS[offer.status]}
          </span>
        </div>
        <dl className="mt-3 flex flex-col gap-1.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-muted">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        {offer.status === "pending" && (
          <p className="mt-2 text-xs text-muted">
            Válida hasta el {formatDateTime(offer.valid_until)}
          </p>
        )}
        {offer.status === "pending" && !mine && (
          <form action={respondToOffer} className="mt-3 grid grid-cols-2 gap-2">
            <input type="hidden" name="thread_id" value={threadId} />
            <input type="hidden" name="offer_id" value={offer.id} />
            <button name="decision" value="accept" className="btn btn-primary">
              Aceptar
            </button>
            <button
              name="decision"
              value="decline"
              className="rounded-lg border border-border px-3 py-2 hover:border-warn"
            >
              Declinar
            </button>
          </form>
        )}
      </div>
    </li>
  );
}
