import { replayOutboxEvent, setCompanyVerified } from "@/app/actions/admin";
import { Stat, StatGrid } from "@/components/kpi";
import { MutationForm } from "@/components/mutation-form";
import { RequestError } from "@/components/request-error";
import { EmptyState } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/deals";
import type { CursorPage } from "@/lib/pagination";
import { roleLabel } from "@/lib/roles";

import {
  AUDIT_ACTIONS,
  type AdminCompany,
  type AuditEntry,
  type OutboxEvent,
  type OutboxHealth,
} from "./model";

type ApiResult<T> = Awaited<ReturnType<typeof apiFetch<T>>>;

export function OutboxSection({
  health,
  events,
}: {
  health: ApiResult<OutboxHealth>;
  events: ApiResult<CursorPage<OutboxEvent>>;
}) {
  const pendingEvents = events.ok
    ? events.data.items.filter((event) => event.status !== "processed")
    : [];
  return (
    <>
      {!health.ok ? (
        <RequestError message={health.message} requestId={health.requestId} />
      ) : (
        <StatGrid>
          <Stat
            label="Pendientes"
            value={health.data.pending}
            hint={
              health.data.oldest_unprocessed_at
                ? `Más antigua: ${formatDateTime(health.data.oldest_unprocessed_at)}`
                : "Sin cola acumulada"
            }
          />
          <Stat label="En proceso" value={health.data.processing} />
          <Stat label="Reintentos" value={health.data.retry} />
          <Stat label="Agotados" value={health.data.failed} />
          <Stat label="Listos para enviar" value={health.data.due} />
          <Stat
            label="Entregados"
            value={health.data.processed_24h}
            hint="Últimas 24 horas"
          />
        </StatGrid>
      )}
      {!events.ok ? (
        <RequestError message={events.message} requestId={events.requestId} />
      ) : pendingEvents.length === 0 ? (
        <EmptyState>No hay entregas que requieran atención.</EmptyState>
      ) : (
        <ul className="card divide-y divide-border text-sm">
          {pendingEvents.map((event) => (
            <li
              key={event.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {event.kind} · {event.status} · intento {event.attempts}
                </p>
                <p className="truncate text-muted">
                  {event.last_error ??
                    `Creado ${formatDateTime(event.created_at)}`}
                </p>
              </div>
              {event.status === "failed" && (
                <MutationForm action={replayOutboxEvent}>
                  <input type="hidden" name="event_id" value={event.id} />
                  <button className="btn btn-secondary text-sm">
                    Reintentar
                  </button>
                </MutationForm>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function Companies({
  result,
  verify = false,
}: {
  result: ApiResult<CursorPage<AdminCompany>>;
  verify?: boolean;
}) {
  if (!result.ok) {
    return (
      <RequestError message={result.message} requestId={result.requestId} />
    );
  }
  if (result.data.items.length === 0) {
    return (
      <EmptyState>
        {verify ? "No hay empresas esperando revisión." : "Ninguna todavía."}
      </EmptyState>
    );
  }
  return (
    <ul className="card divide-y divide-border">
      {result.data.items.map((company) => (
        <li
          key={company.id}
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
        >
          <div className="min-w-0">
            <p className="font-medium">{company.legal_name}</p>
            <p className="text-muted">
              NIT <span className="font-mono">{company.nit}</span> ·{" "}
              {company.city} · {company.market_roles.map(roleLabel).join(", ")} ·{" "}
              {company.members} {company.members === 1 ? "miembro" : "miembros"} ·{" "}
              desde {formatDateTime(company.created_at)}
            </p>
          </div>
          <MutationForm action={setCompanyVerified}>
            <input type="hidden" name="company_id" value={company.id} />
            <input type="hidden" name="verified" value={String(verify)} />
            <button
              className={`btn text-sm ${verify ? "btn-primary" : "btn-secondary"}`}
            >
              {verify ? "Verificar" : "Quitar verificación"}
            </button>
          </MutationForm>
        </li>
      ))}
    </ul>
  );
}

export function Activity({
  result,
}: {
  result: ApiResult<CursorPage<AuditEntry>>;
}) {
  if (!result.ok) {
    return (
      <RequestError message={result.message} requestId={result.requestId} />
    );
  }
  if (result.data.items.length === 0) {
    return <EmptyState>Sin actividad todavía.</EmptyState>;
  }
  return (
    <ul className="card divide-y divide-border text-sm">
      {result.data.items.map((entry) => (
        <li key={entry.id} className="flex justify-between gap-4 px-4 py-2">
          <span>
            <span className="font-medium">{entry.actor_name ?? "Sistema"}</span>{" "}
            {AUDIT_ACTIONS[entry.action] ?? entry.action}
            {typeof entry.data.reason === "string" && (
              <span className="text-muted"> · {entry.data.reason}</span>
            )}
          </span>
          <span className="shrink-0 font-mono text-xs text-muted">
            {formatDateTime(entry.created_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}
