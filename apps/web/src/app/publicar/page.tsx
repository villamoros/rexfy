import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/session";

import { PublishWizard } from "./wizard";

export const metadata: Metadata = { title: "Publicar residuo · RexFy" };

export default function PublicarPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Publicar residuo</h1>
        <div className="mt-6">
          <Suspense fallback={<p className="text-muted">Cargando…</p>}>
            <GeneratorOnly />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function GeneratorOnly() {
  const me = await requireUser();
  const companies = me.companies
    .filter((c) => c.market_roles.includes("generator"))
    .map((c) => ({ id: c.company_id, name: c.legal_name }));
  if (companies.length === 0) {
    return (
      <p className="card p-5 text-sm text-muted">
        Para publicar material tu empresa debe estar registrada como generadora.{" "}
        <Link href="/onboarding" className="text-brand underline">
          Registra una empresa generadora
        </Link>
        .
      </p>
    );
  }
  return <PublishWizard companies={companies} />;
}
