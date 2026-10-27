"use client";

import { useEffect, useState } from "react";

type Readiness = { status: string; database: string; redis: string };

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function ApiStatus() {
  const [data, setData] = useState<Readiness | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${apiUrl}/health/ready`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setError(true));
  }, []);

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
    <ul className="w-full max-w-sm divide-y divide-border rounded-xl border border-border bg-surface text-sm">
      {rows.map(([label, value]) => (
        <li key={label} className="flex items-center justify-between px-4 py-3">
          <span className="text-muted">{label}</span>
          <span className={value === "ok" ? "font-medium text-brand" : "font-medium text-warn"}>
            {value}
          </span>
        </li>
      ))}
    </ul>
  );
}
