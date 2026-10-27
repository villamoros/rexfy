"use client";

import { SignOutButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { startTransition } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Algo salió mal</h1>
      <p className="text-muted">
        No pudimos cargar esta página. Puede que el servidor no esté disponible
        en este momento.
      </p>
      {process.env.NODE_ENV === "development" && (
        <p className="text-sm text-muted">{error.message}</p>
      )}
      <div className="flex gap-3">
        <button
          className="rounded-lg bg-brand-strong px-4 py-2 font-medium text-white hover:opacity-90"
          onClick={() =>
            startTransition(() => {
              router.refresh();
              reset();
            })
          }
        >
          Reintentar
        </button>
        <SignOutButton redirectUrl="/ingresar">
          <button className="rounded-lg border border-border px-4 py-2 font-medium hover:border-brand">
            Cerrar sesión
          </button>
        </SignOutButton>
      </div>
    </main>
  );
}
