import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { logout } from "@/app/actions/auth";
import { requireUser } from "@/lib/session";
import { roleLabel } from "@/lib/roles";

export const metadata: Metadata = { title: "Panel · RexFy" };

export default function PanelPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-widest text-brand">
          RexFy
        </span>
        <form action={logout}>
          <button className="text-sm text-muted underline">
            Cerrar sesión
          </button>
        </form>
      </header>
      <Suspense fallback={<p className="text-muted">Cargando tu panel…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  const me = await requireUser();
  if (me.companies.length === 0) redirect("/onboarding");
  return (
    <>
      <h1 className="text-2xl font-semibold">
        Hola, {me.full_name.split(" ")[0]}
      </h1>
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
              Pendiente de verificación. Pronto podrás publicar y buscar
              material desde aquí.
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
