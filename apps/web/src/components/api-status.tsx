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
    <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted">
      {rows.map(([label, value]) => (
        <li key={label} className="flex items-center gap-1.5">
          <span
            className={`size-1.5 rounded-full ${value === "ok" ? "bg-brand" : "bg-warn"}`}
          />
          {label}: {value}
        </li>
      ))}
    </ul>
  );
}
