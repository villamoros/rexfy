import Link from "next/link";

import { ApiStatus } from "@/components/api-status";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-widest text-brand">
          RexFy
        </span>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Marketplace B2B de materiales reciclables
        </h1>
        <p className="text-muted">
          Conecta generadores de residuos, compradores y transportistas para que
          más toneladas vuelvan a la cadena productiva.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/registro"
          className="rounded-lg bg-brand-strong px-5 py-2.5 font-medium text-white hover:opacity-90"
        >
          Crear cuenta
        </Link>
        <Link
          href="/marketplace"
          className="rounded-lg border border-border px-5 py-2.5 font-medium hover:border-brand"
        >
          Ver marketplace
        </Link>
        <Link
          href="/ingresar"
          className="rounded-lg border border-border px-5 py-2.5 font-medium hover:border-brand"
        >
          Ingresar
        </Link>
      </div>
      <ApiStatus />
    </main>
  );
}
