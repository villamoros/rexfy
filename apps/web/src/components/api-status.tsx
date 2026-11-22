"use client";

import { useEffect, useState } from "react";

type Readiness = { status: string; database: string; redis: string };

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function ApiStatus() {
  const [data, setData] = useState<Readiness | null>(null);
  const [error, setError] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const id = crypto.randomUUID();
    const timer = setTimeout(() => controller.abort(), 5_000);
    fetch(`${apiUrl}/health/ready`, {
      signal: controller.signal,
      headers: { "X-Request-ID": id },
    })
      .then(async (res) => {
        if (active) setRequestId(res.headers.get("x-request-id") ?? id);
        if (!res.ok) throw new Error("Health check failed");
        return (await res.json()) as Readiness;
      })
      .then((readiness) => {
        if (active) setData(readiness);
      })
      .catch(() => {
        if (active) {
          setRequestId(id);
          setError(true);
        }
      })
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [attempt]);

  const rows: [string, string][] = error
    ? [["API", "sin conexión"]]
    : data
      ? [
          ["API", data.status],
          ["Base de datos", data.database],
          ["Redis", data.redis],
        ]
      : [["API", "verificando…"]];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <ul
        aria-live="polite"
        className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted"
      >
        {rows.map(([label, value]) => (
          <li key={label} className="flex items-center gap-1.5">
            <span
              className={`size-1.5 rounded-full ${value === "ok" ? "bg-brand" : "bg-warn"}`}
            />
            {label}: {value}
          </li>
        ))}
      </ul>
      {error && (
        <button
          type="button"
          className="text-xs text-muted underline hover:text-foreground"
          title={requestId ? `Referencia ${requestId}` : undefined}
          onClick={() => {
            setData(null);
            setError(false);
            setRequestId(null);
            setAttempt((value) => value + 1);
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
