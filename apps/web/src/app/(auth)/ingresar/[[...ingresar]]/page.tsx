import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Ingresar · RexFy" };

export default function IngresarPage() {
  return (
    <Suspense fallback={<p className="text-muted">Cargando…</p>}>
      <SignIn />
    </Suspense>
  );
}
