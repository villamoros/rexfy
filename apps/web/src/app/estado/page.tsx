import type { Metadata } from "next";
import Link from "next/link";

import { ApiStatus } from "@/components/api-status";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Estado del servicio · RexFy" };

export default function StatusPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <Logo className="h-7 text-foreground" />
        <Link href="/" className="text-sm text-brand underline">
          Volver a RexFy
        </Link>
      </div>
      <header>
        <p className="eyebrow">Disponibilidad</p>
        <h1 className="mt-2 text-3xl font-extrabold">Estado del servicio</h1>
        <p className="mt-3 text-muted">
          Comprueba si la API está respondiendo antes de repetir una operación.
          Las acciones con clave de idempotencia pueden reintentarse sin
          duplicar el resultado.
        </p>
      </header>
      <section
        className="card flex flex-col gap-4 p-6"
        aria-labelledby="api-status-title"
      >
        <h2 id="api-status-title" className="text-xl font-bold">
          API de RexFy
        </h2>
        <ApiStatus />
      </section>
      <section
        className="card flex flex-col gap-3 p-6"
        aria-labelledby="help-title"
      >
        <h2 id="help-title" className="text-xl font-bold">
          Si el problema continúa
        </h2>
        <p className="text-sm text-muted">
          Conserva la referencia mostrada en el error y envíala al equipo. No
          vuelvas a cargar archivos ni cambies los datos del formulario hasta
          confirmar el resultado.
        </p>
        <a href="mailto:soporte@rexfy.co" className="btn btn-secondary w-fit">
          Escribir a soporte
        </a>
      </section>
    </main>
  );
}
