import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { apiFetch } from "@/lib/api";
import { formatDateTime, type ThreadSummary } from "@/lib/deals";
import { getToken, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mensajes · RexFy" };

export default function MensajesPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Mensajes</h1>
        <Suspense
          fallback={<p className="mt-6 text-muted">Cargando conversaciones…</p>}
        >
          <Inbox />
        </Suspense>
      </main>
    </>
  );
}

async function Inbox() {
  await requireUser();
  const result = await apiFetch<ThreadSummary[]>("/threads", {
    token: await getToken(),
  });
  if (!result.ok) return <p className="mt-6 text-warn">{result.message}</p>;
  if (result.data.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-border bg-surface-sunken/50 p-8 text-center text-sm text-muted">
        Aún no tienes conversaciones. Busca material en el{" "}
        <Link href="/marketplace" className="text-brand underline">
          marketplace
        </Link>{" "}
        y contacta al generador.
      </p>
    );
  }
  return (
    <ul className="mt-6 divide-y divide-border card">
      {result.data.map((thread) => (
        <li key={thread.id}>
          <Link
            href={`/mensajes/${thread.id}`}
            className="flex flex-col gap-1 px-4 py-3 hover:bg-surface"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">
                {thread.counterpart.legal_name}
              </span>
              <span className="shrink-0 text-xs text-muted">
                {formatDateTime(thread.last_activity_at)}
              </span>
            </div>
            <span className="text-sm text-muted">{thread.listing.title}</span>
            {thread.pending_offer_from_me === false ? (
              <span className="text-sm font-medium text-brand">
                Tienes una cotización por responder
              </span>
            ) : (
              thread.last_message && (
                <span className="truncate text-sm">{thread.last_message}</span>
              )
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
