import type { Metadata } from "next";
import { Suspense } from "react";

import {
  markAllRead,
  openNotification,
} from "@/app/actions/notifications";
import { SiteHeader } from "@/components/site-header";
import { EmptyState, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/deals";
import { getToken, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Notificaciones · RexFy" };

type Notification = {
  id: string;
  title: string;
  body: string;
  link: string;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
        <PageHeader
          title="Notificaciones"
          actions={
            <form action={markAllRead}>
              <button className="btn btn-secondary text-sm">
                Marcar todo como leído
              </button>
            </form>
          }
        />
        <Suspense fallback={<p className="text-muted">Cargando…</p>}>
          <Inbox />
        </Suspense>
      </main>
    </>
  );
}

async function Inbox() {
  await requireUser();
  const result = await apiFetch<Notification[]>("/notifications", {
    token: await getToken(),
  });
  if (!result.ok) return <p className="text-warn">{result.message}</p>;
  if (result.data.length === 0)
    return (
      <EmptyState>
        Aquí verás mensajes, cotizaciones y novedades de tus órdenes.
      </EmptyState>
    );
  return (
    <ul className="divide-y divide-border card">
      {result.data.map((n) => (
        <li key={n.id}>
          <form action={openNotification}>
            <input type="hidden" name="id" value={n.id} />
            <input type="hidden" name="link" value={n.link} />
            <button className="flex w-full gap-3 px-4 py-3 text-left text-sm hover:bg-surface-sunken">
              <span
                className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-signal"}`}
                aria-label={n.read_at ? undefined : "Sin leer"}
              />
              <span className="min-w-0 flex-1">
                <span
                  className={`block ${n.read_at ? "" : "font-semibold"}`}
                >
                  {n.title}
                </span>
                {n.body && (
                  <span className="mt-0.5 block truncate text-muted">
                    {n.body}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-mono text-xs text-muted">
                {formatDateTime(n.created_at)}
              </span>
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
