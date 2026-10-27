import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ClientOnly } from "@/components/client-only";

export const metadata: Metadata = { title: "Crear cuenta · RexFy" };

export default function RegistroPage() {
  const loading = <p className="text-muted">Cargando…</p>;
  // Clerk reads the URL to route between its steps, so it renders at request time,
  // and only in the browser.
  return (
    <Suspense fallback={loading}>
      <ClientOnly fallback={loading}>
        <SignUp />
      </ClientOnly>
    </Suspense>
  );
}
