import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Ingresar · RexFy" };

export default function IngresarPage() {
  // Clerk reads the URL to route between its steps, so it renders at request time.
  return (
    <Suspense fallback={<p className="text-muted">Cargando…</p>}>
      <SignIn />
    </Suspense>
  );
}
