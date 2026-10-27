import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Card } from "@/components/form";
import { requireUser } from "@/lib/session";

import { CompanyForm } from "./company-form";

export const metadata: Metadata = { title: "Registra tu empresa · RexFy" };

export default function OnboardingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <Link
        href="/"
        className="text-sm font-semibold uppercase tracking-widest text-brand"
      >
        RexFy
      </Link>
      <Card
        title="Registra tu empresa"
        subtitle="En RexFy se negocia entre empresas verificadas."
      >
        <Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
          <SignedInOnly />
        </Suspense>
      </Card>
    </main>
  );
}

async function SignedInOnly() {
  await requireUser();
  return <CompanyForm />;
}
