import Link from "next/link";

import { ApiStatus } from "@/components/api-status";
import { Logo } from "@/components/logo";
import { CATEGORIES, type MaterialCategory } from "@/lib/listings";
import { MARKET_ROLES } from "@/lib/roles";

const STEPS = [
  {
    title: "Publica",
    text: "El generador sube su material en un asistente de tres pasos: tipo, cantidad, precio y ubicación.",
  },
  {
    title: "Negocia",
    text: "El comprador escribe por el chat B2B y recibe una cotización formal que puede aceptar o rechazar.",
  },
  {
    title: "Cierra",
    text: "Al aceptar, la orden queda registrada con cantidades, precio y el progreso de la entrega.",
  },
  {
    title: "Transporta",
    text: "Los transportistas cotizan la recolección y la carga se sigue paso a paso hasta su destino.",
  },
];

// Decorative preview of how offers look in the marketplace.
const PREVIEW: {
  category: MaterialCategory;
  title: string;
  meta: string;
  price: string;
}[] = [
  {
    category: "plastic",
    title: "PET cristal post-industrial",
    meta: "12 t · Bogotá · Inmediata",
    price: "$1.450 / kg",
  },
  {
    category: "paper_cardboard",
    title: "Cartón corrugado compactado",
    meta: "30 t / mes · Medellín",
    price: "$520 / kg",
  },
  {
    category: "metal",
    title: "Retal de aluminio 6063",
    meta: "4 t · Cali · Esta semana",
    price: "Negociable",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/marketplace"
            className="hidden rounded-full px-3 py-1.5 text-muted hover:text-foreground sm:block"
          >
            Marketplace
          </Link>
          <Link
            href="/ingresar"
            className="rounded-full px-3 py-1.5 text-muted hover:text-foreground"
          >
            Ingresar
          </Link>
          <Link href="/registro" className="btn btn-primary px-4 py-2">
            Crear cuenta
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-8 sm:pt-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div>
            <p className="eyebrow">Marketplace B2B · Colombia</p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.02] font-extrabold sm:text-6xl lg:text-7xl">
              Tus residuos son la{" "}
              <span className="relative isolate whitespace-nowrap">
                <span className="absolute inset-x-[-0.1em] bottom-[0.08em] -z-10 h-[0.38em] -rotate-1 rounded-sm bg-lime" />
                materia prima
              </span>{" "}
              de otra empresa.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              RexFy conecta a quienes generan material reciclable con quienes lo
              transforman, y con el transporte que lo mueve. Sin intermediarios
              a ciegas: empresas verificadas, precios claros y trazabilidad de
              cada tonelada.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/registro" className="btn btn-primary px-6 py-3">
                Empezar gratis
                <span aria-hidden>→</span>
              </Link>
              <Link href="/marketplace" className="btn btn-secondary px-6 py-3">
                Ver material disponible
              </Link>
            </div>
          </div>

          <div aria-hidden className="relative isolate mx-auto w-full max-w-sm">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-ink" />
            <div className="dot-grid absolute -inset-6 -z-10 rounded-[2rem] text-lime opacity-30" />
            <ul className="flex flex-col gap-3 py-2">
              {PREVIEW.map((item, i) => (
                <li
                  key={item.title}
                  className={`material card p-4 ${i === 1 ? "translate-x-4 rotate-1" : i === 2 ? "-rotate-1" : ""}`}
                  data-category={item.category}
                >
                  <span className="material-badge">
                    {CATEGORIES[item.category]}
                  </span>
                  <p className="mt-2 font-display text-lg font-semibold leading-tight">
                    {item.title}
                  </p>
                  <div className="mt-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-muted">{item.meta}</span>
                    <span className="font-mono font-medium">{item.price}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-y border-border bg-surface">
          <ul className="mx-auto flex w-full max-w-6xl flex-wrap justify-center gap-2 px-4 py-5">
            {(Object.keys(CATEGORIES) as MaterialCategory[]).map((category) => (
              <li key={category} className="material" data-category={category}>
                <Link
                  href={`/marketplace?category=${category}`}
                  className="material-badge px-3 py-1 text-sm hover:brightness-95"
                >
                  {CATEGORIES[category]}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-20">
          <p className="eyebrow">Para quién es</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">
            Tres roles, un mismo ciclo.
          </h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {MARKET_ROLES.map((role, i) => (
              <li key={role.value} className="card flex flex-col gap-6 p-6">
                <span className="font-mono text-sm text-brand">0{i + 1}</span>
                <div>
                  <h3 className="text-2xl font-bold">{role.label}</h3>
                  <p className="mt-2 text-muted">{role.hint}.</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-ink text-on-ink">
          <div className="mx-auto w-full max-w-6xl px-4 py-20">
            <p className="eyebrow text-lime">Cómo funciona</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">
              De la bodega a la planta, en cuatro pasos.
            </h2>
            <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-on-ink/10 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex flex-col gap-3 bg-ink p-6">
                  <span className="grid size-9 place-items-center rounded-full bg-lime font-mono text-sm font-semibold text-ink">
                    {i + 1}
                  </span>
                  <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-on-ink/70">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
            <Link href="/registro" className="btn btn-lime mt-12 px-6 py-3">
              Registrar mi empresa
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted">
        <Logo className="text-base" />
        <ApiStatus />
      </footer>
    </div>
  );
}
