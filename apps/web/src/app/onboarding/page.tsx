import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { BrandLoader } from "@/components/brand-loader";
import { Card } from "@/components/form";
import { Logo } from "@/components/logo";
import { RequestError } from "@/components/request-error";
import { getMe } from "@/lib/session";

import { CompanyForm } from "./company-form";

export const metadata: Metadata = { title: "Registra tu empresa · RexFy" };

export default function OnboardingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <Logo />
      <Card
        title="Registra tu empresa"
        subtitle="En RexFy se negocia entre empresas verificadas."
      >
        <Suspense fallback={<BrandLoader overlay boundary />}>
          <SignedInOnly />
        </Suspense>
      </Card>
    </main>
  );
}

async function SignedInOnly() {
  const account = await getMe();
  if (!account) redirect("/ingresar");
  if (!account.ok) {
    return (
      <RequestError
        message={`Tu sesión se creó, pero no pudimos cargar tu cuenta: ${account.message}`}
        requestId={account.requestId}
      />
    );
  }
  return <CompanyForm />;
}
