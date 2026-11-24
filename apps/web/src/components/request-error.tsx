"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RequestError({
  message,
  requestId,
  className = "",
}: {
  message: string;
  requestId?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="alert"
      className={`rounded-xl border border-warn/30 bg-warn/5 p-4 text-sm ${className}`}
    >
      <p className="font-medium text-foreground">{message}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          className="btn btn-secondary text-sm"
          onClick={() => startTransition(() => router.refresh())}
        >
          {pending ? "Reintentando…" : "Reintentar"}
        </button>
        <Link href="/estado" className="text-sm text-brand underline">
          Ver estado del servicio
        </Link>
        <a
          href="mailto:soporte@rexfy.co"
          className="text-sm text-brand underline"
        >
          Contactar soporte
        </a>
        {requestId && (
          <span className="font-mono text-[10px] text-muted">
            Referencia: {requestId}
          </span>
        )}
      </div>
    </div>
  );
}
