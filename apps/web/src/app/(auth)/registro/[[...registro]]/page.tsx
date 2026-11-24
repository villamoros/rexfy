import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Crear cuenta · RexFy" };

export default function RegistroPage() {
  return (
    <Suspense fallback={<p className="text-muted">Cargando…</p>}>
      <SignUp />
    </Suspense>
  );
}
