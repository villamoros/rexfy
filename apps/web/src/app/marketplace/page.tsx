import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ListingCard } from "@/components/listing-card";
import { SiteHeader } from "@/components/site-header";
import { apiFetch } from "@/lib/api";
import { AVAILABILITY, CATEGORIES, type ListingPage } from "@/lib/listings";

export const metadata: Metadata = { title: "Marketplace · RexFy" };

const PAGE_SIZE = 20;

type Params = Record<string, string | string[] | undefined>;

function all(params: Params, key: string): string[] {
  const value = params[key];
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function one(params: Params, key: string): string {
  return all(params, key)[0] ?? "";
}

export default function MarketplacePage({
  searchParams,
}: PageProps<"/marketplace">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <p className="eyebrow">Material disponible</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Marketplace</h1>
        <p className="mt-2 max-w-xl text-muted">
          Material reciclable publicado por empresas en Colombia, listo para
          volver a la cadena productiva.
        </p>
        <Suspense
          fallback={<p className="mt-8 text-muted">Buscando material…</p>}
        >
          <Search searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function Search({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const offset = Math.max(0, Number(one(params, "offset")) || 0);

  const query = new URLSearchParams();
  for (const key of ["q", "city", "pricing_type", "sort"]) {
    if (one(params, key)) query.set(key, one(params, key));
  }
  for (const key of ["category", "availability"]) {
    for (const value of all(params, key)) query.append(key, value);
  }
  if (one(params, "recurring") === "true") query.set("recurring", "true");
  query.set("limit", String(PAGE_SIZE));
  query.set("offset", String(offset));

  const result = await apiFetch<ListingPage>(`/listings?${query}`);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[272px_1fr]">
      <Filters params={params} />
      <section aria-live="polite">
        {!result.ok ? (
          <p className="text-warn">{result.message}</p>
        ) : (
          <>
            <p className="mb-3 font-mono text-xs text-muted">
              {result.data.total === 1
                ? "1 resultado"
                : `${result.data.total} resultados`}
            </p>
            {result.data.items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface-sunken/50 p-8 text-center text-muted">
                No hay material con esos filtros todavía.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {result.data.items.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </ul>
            )}
            <Pager query={query} offset={offset} total={result.data.total} />
          </>
        )}
      </section>
    </div>
  );
}

function Filters({ params }: { params: Params }) {
  const categories = all(params, "category");
  const availability = all(params, "availability");
  const activeFilters =
    categories.length +
    availability.length +
    ["city", "pricing_type", "recurring"].filter((key) => one(params, key))
      .length;
  return (
    <form
      method="get"
      className="flex flex-col gap-5 self-start text-sm lg:sticky lg:rounded-[1.25rem] lg:border lg:border-border lg:bg-surface lg:top-24 lg:p-5"
    >
      <input
        type="search"
        name="q"
        defaultValue={one(params, "q")}
        placeholder="Buscar: PET, aluminio, pallets…"
        aria-label="Buscar"
        className="input text-base"
      />
      <details className="filters" open={activeFilters > 0}>
        <summary className="cursor-pointer btn btn-secondary w-full justify-between">
          Filtros{activeFilters > 0 ? ` (${activeFilters})` : ""}
        </summary>
        <div className="mt-3 flex flex-col gap-5 lg:mt-0">
          <Group title="Tipo de material">
            {Object.entries(CATEGORIES).map(([value, label]) => (
              <Check
                key={value}
                name="category"
                value={value}
                label={
                  <span
                    className="material flex items-center gap-2"
                    data-category={value}
                  >
                    <span className="size-2 rounded-full bg-[var(--cat)]" />
                    {label}
                  </span>
                }
                checked={categories.includes(value)}
              />
            ))}
          </Group>
          <label className="flex flex-col gap-1.5">
            <span className="eyebrow text-muted">Ciudad</span>
            <input
              name="city"
              defaultValue={one(params, "city")}
              placeholder="Bogotá"
              className="input"
            />
          </label>
          <Group title="Precio">
            {[
              ["", "Todos"],
              ["paid", "De pago"],
              ["free", "Gratuito (solo retiro)"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pricing_type"
                  value={value}
                  defaultChecked={one(params, "pricing_type") === value}
                  className="accent-brand-strong"
                />
                {label}
              </label>
            ))}
          </Group>
          <Group title="Disponibilidad">
            {Object.entries(AVAILABILITY)
              .filter(([value]) => value !== "specific_date")
              .map(([value, label]) => (
                <Check
                  key={value}
                  name="availability"
                  value={value}
                  label={label}
                  checked={availability.includes(value)}
                />
              ))}
          </Group>
          <Group title="Tipo de oferta">
            <Check
              name="recurring"
              value="true"
              label="Solo recurrentes"
              checked={one(params, "recurring") === "true"}
            />
          </Group>
          <label className="flex flex-col gap-1.5">
            <span className="eyebrow text-muted">Ordenar por</span>
            <select
              name="sort"
              defaultValue={one(params, "sort") || "recent"}
              className="input"
            >
              <option value="recent">Publicado recientemente</option>
              <option value="price_asc">Menor precio</option>
            </select>
          </label>
        </div>
      </details>
      <div className="flex gap-2">
        <button className="flex-1 btn btn-primary">Aplicar</button>
        <Link href="/marketplace" className="btn btn-secondary">
          Limpiar
        </Link>
      </div>
    </form>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="eyebrow mb-2 text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

function Check({
  name,
  value,
  label,
  checked,
}: {
  name: string;
  value: string;
  label: React.ReactNode;
  checked: boolean;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        className="accent-brand-strong"
      />
      {label}
    </label>
  );
}

function Pager({
  query,
  offset,
  total,
}: {
  query: URLSearchParams;
  offset: number;
  total: number;
}) {
  if (total <= PAGE_SIZE) return null;
  const link = (to: number) => {
    const next = new URLSearchParams(query);
    next.delete("limit");
    if (to > 0) next.set("offset", String(to));
    else next.delete("offset");
    return `/marketplace?${next}`;
  };
  return (
    <nav className="mt-6 flex items-center justify-between text-sm">
      {offset > 0 ? (
        <Link
          href={link(Math.max(0, offset - PAGE_SIZE))}
          className="underline"
        >
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
