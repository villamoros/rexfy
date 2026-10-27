import { SignOutButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { archiveListing } from "@/app/actions/listings";
import { SiteHeader } from "@/components/site-header";
import { EmptyState, PageHeader } from "@/components/ui";
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
      <PageHeader
        eyebrow="Tu panel"
        title={`Hola, ${me.full_name.split(" ")[0]}`}
        actions={
          <>
            <Link href="/marketplace" className="btn btn-secondary">
              Buscar material
            </Link>
            {isGenerator && (
              <Link href="/publicar" className="btn btn-primary">
                Publicar material
              </Link>
            )}
          </>
        }
      />
      <ul className="flex flex-col gap-3">
        {me.companies.map((company) => (
          <li key={company.company_id} className="card p-5">
            <p className="text-xl font-semibold">{company.legal_name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {company.market_roles.map((role) => (
                <span key={role} className="chip">
                  {roleLabel(role)}
                </span>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <span className="size-1.5 rounded-full bg-warn" />
              Pendiente de verificación.
            </p>
          </li>
        ))}
      </ul>

      {mine?.ok && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Mis publicaciones</h2>
          {mine.data.length === 0 ? (
            <EmptyState>Aún no has publicado material.</EmptyState>
          ) : (
            <ul className="divide-y divide-border card">
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
