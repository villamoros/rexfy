"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ListingCard } from "@/components/listing-card";
import { RequestError } from "@/components/request-error";
import { EmptyState } from "@/components/ui";
import type { ApiResult } from "@/lib/api";
import type { ListingPage } from "@/lib/listings";

const PAGE_SIZE = 20;
const MAX_CACHE_AGE_MS = 30 * 60 * 1000;

type CachedPage = { savedAt: number; data: ListingPage };

export function readCachedPage(raw: string | null, now: number): ListingPage | null {
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as CachedPage;
    if (
      typeof stored.savedAt !== "number" ||
      !stored.data ||
      now - stored.savedAt > MAX_CACHE_AGE_MS
    ) {
      return null;
    }
    return stored.data;
  } catch {
    return null;
  }
}

export function Results({
  result,
  queryString,
  offset,
}: {
  result: ApiResult<ListingPage>;
  queryString: string;
  offset: number;
}) {
  const [cached, setCached] = useState<ListingPage | null>(null);
  const cacheKey = `rexfy:marketplace:${queryString}`;

  useEffect(() => {
    if (result.ok) {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({ savedAt: Date.now(), data: result.data } satisfies CachedPage),
      );
      return;
    }
    const raw = sessionStorage.getItem(cacheKey);
    const stored = readCachedPage(raw, Date.now());
    if (stored) {
      const load = window.setTimeout(() => setCached(stored), 0);
      return () => window.clearTimeout(load);
    }
    if (raw) {
      sessionStorage.removeItem(cacheKey);
    }
  }, [cacheKey, result]);

  const data = result.ok ? result.data : cached;
  return (
    <>
      {!result.ok && (
        <RequestError message={result.message} requestId={result.requestId} />
      )}
      {!result.ok && cached && (
        <p className="my-3 rounded-md bg-surface-sunken px-3 py-2 text-sm text-muted">
          Mostrando el último resultado disponible para estos filtros. Puede tener hasta 30 minutos.
        </p>
      )}
      {data && (
        <>
          <p className="mb-3 font-mono text-xs text-muted">
            {data.total === 1 ? "1 resultado" : `${data.total} resultados`}
          </p>
          {data.items.length === 0 ? (
            <EmptyState>No hay material con esos filtros todavía.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </ul>
          )}
          <Pager queryString={queryString} offset={offset} total={data.total} />
        </>
      )}
    </>
  );
}

function Pager({
  queryString,
  offset,
  total,
}: {
  queryString: string;
  offset: number;
  total: number;
}) {
  if (total <= PAGE_SIZE) return null;
  const link = (to: number) => {
    const next = new URLSearchParams(queryString);
    next.delete("limit");
    if (to > 0) next.set("offset", String(to));
    else next.delete("offset");
    return `/marketplace?${next}`;
  };
  return (
    <nav className="mt-6 flex items-center justify-between text-sm">
      {offset > 0 ? (
        <Link href={link(Math.max(0, offset - PAGE_SIZE))} className="underline">
          ← Anterior
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted">
        {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} de {total}
      </span>
      {offset + PAGE_SIZE < total ? (
        <Link href={link(offset + PAGE_SIZE)} className="underline">
          Siguiente →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
