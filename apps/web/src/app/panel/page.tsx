import { SignOutButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { archiveListing } from "@/app/actions/listings";
import { SiteHeader } from "@/components/site-header";
import { apiFetch } from "@/lib/api";
import {
  STATUS,
  formatPrice,
  formatQuantity,
  type Listing,
} from "@/lib/listings";
import { roleLabel } from "@/lib/roles";
import { getToken, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Panel · RexFy" };

export default function PanelPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
        <Suspense fallback={<p className="text-muted">Cargando tu panel…</p>}>
          <Dashboard />
        </Suspense>
        <SignOutButton redirectUrl="/ingresar">
          <button className="self-start text-sm text-muted underline">
            Cerrar sesión
          </button>
        </SignOutButton>
      </main>
    </>
  );
}

async function Dashboard() {
  const me = await requireUser();
  if (me.companies.length === 0) redirect("/onboarding");
  const isGenerator = me.companies.some((c) =>
    c.market_roles.includes("generator"),
  );
  const mine = isGenerator
    ? await apiFetch<Listing[]>("/me/listings", { token: await getToken() })
    : null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          Hola, {me.full_name.split(" ")[0]}
        </h1>
        <div className="flex gap-2 text-sm">
          <Link
            href="/marketplace"
            className="rounded-lg border border-border px-4 py-2 hover:border-brand"
          >
            Buscar material
          </Link>
          {isGenerator && (
            <Link
              href="/publicar"
              className="rounded-lg bg-brand-strong px-4 py-2 font-medium text-white hover:opacity-90"
            >
              Publicar residuo
            </Link>
          )}
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {me.companies.map((company) => (
          <li
            key={company.company_id}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <p className="font-medium">{company.legal_name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {company.market_roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-medium text-brand"
                >
                  {roleLabel(role)}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">
              Pendiente de verificación.
            </p>
          </li>
        ))}
      </ul>

      {mine?.ok && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Mis publicaciones</h2>
          {mine.data.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
              Aún no has publicado material.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {mine.data.map((listing) => (
                <li
                  key={listing.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/publicaciones/${listing.id}`}
                      className="font-medium hover:underline"
                    >
                      {listing.title}
                    </Link>
                    <p className="text-muted">
                      {STATUS[listing.status]} ·{" "}
                      {formatQuantity(listing.quantity, listing.quantity_unit)}{" "}
                      · {formatPrice(listing)}
                    </p>
                  </div>
                  {listing.status === "published" && (
                    <form action={archiveListing}>
                      <input type="hidden" name="id" value={listing.id} />
                      <button className="text-muted underline hover:text-foreground">
                        Archivar
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
