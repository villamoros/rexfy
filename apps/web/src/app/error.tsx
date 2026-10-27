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
      <h1 className="text-3xl font-bold">Algo salió mal</h1>
      <p className="text-muted">
        No pudimos cargar esta página. Puede que el servidor no esté disponible
        en este momento.
      </p>
      {process.env.NODE_ENV === "development" && (
        <p className="text-sm text-muted">{error.message}</p>
      )}
      <div className="flex gap-3">
        <button
          className="btn btn-primary"
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
          <button className="btn btn-secondary">Cerrar sesión</button>
        </SignOutButton>
      </div>
    </main>
  );
}
