import Link from "next/link";

import { ApiStatus } from "@/components/api-status";
import { Icon, MaterialIcon, type IconName } from "@/components/icons";
import { Logo } from "@/components/logo";
import { Network } from "@/components/network";
import { SectionHeading } from "@/components/ui";
import { CATEGORIES, type MaterialCategory } from "@/lib/listings";
import { MARKET_ROLES } from "@/lib/roles";

// Illustrative offers for the hero; labelled as examples on the page.
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
    meta: "30 t al mes · Medellín",
    price: "$520 / kg",
  },
  {
    category: "metal",
    title: "Retal de aluminio 6063",
    meta: "4 t · Cali · Esta semana",
    price: "Negociable",
  },
];

const AVAILABLE_NOW = [
  "Publica material en un asistente de tres pasos",
  "Busca por tipo, ciudad, precio y disponibilidad",
  "Negocia por chat y envía cotizaciones formales",
  "Cierra la orden y cotiza el transporte",
];

const CAPABILITIES: { icon: IconName; label: string }[] = [
  { icon: "manufactura-metalmecanica", label: "Metalmecánica" },
  { icon: "manufactura-carpinteria", label: "Carpintería" },
  { icon: "manufactura-impresion-3d", label: "Impresión 3D" },
  { icon: "manufactura-confeccion", label: "Confección" },
  { icon: "manufactura-cnc", label: "Corte CNC" },
  { icon: "manufactura-bordado", label: "Bordado" },
  { icon: "manufactura-empaques", label: "Empaques" },
  { icon: "categoria-nueva", label: "Y más" },
];

const CHAIN = [
  "Material recuperado",
  "Transporte",
  "Taller transformador",
  "Nueva materia prima",
];

const STEPS = [
  {
    title: "Publica",
    text: "Tipo de material, cantidad, precio y ubicación. Queda visible en el marketplace al terminar.",
  },
  {
    title: "Negocia",
    text: "El comprador escribe por el chat y recibe una cotización formal que puede aceptar o rechazar.",
  },
  {
    title: "Cierra",
    text: "Al aceptar, la orden queda registrada con cantidad, precio y el avance de la entrega.",
  },
  {
    title: "Transporta",
    text: "Los transportistas cotizan la recolección y la carga se sigue por etapas hasta su destino.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <main className="flex-1">
        <Fronts />
        <ChainSection />
        <Audience />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  );
}

/** Noche hero: landing nav, value proposition and example listings. */
function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-on-ink">
      <Network className="absolute inset-0 -z-10 h-full w-full opacity-60" />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5">
        <Logo className="text-on-ink" />
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/marketplace"
            className="hidden rounded-md px-3 py-2 text-on-ink-muted hover:text-on-ink sm:block"
          >
            Marketplace
          </Link>
          <Link
            href="/ingresar"
            className="rounded-md px-3 py-2 text-on-ink-muted hover:text-on-ink"
          >
            Ingresar
          </Link>
          <Link href="/registro" className="btn btn-signal ml-1 px-4 py-2">
            Crear cuenta
          </Link>
        </nav>
      </header>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-20 pt-10 sm:pt-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <p className="eyebrow text-signal">Red productiva B2B · Colombia</p>
          <h1 className="mt-5 text-[2.5rem] leading-[1.04] sm:text-6xl">
            Lo que a tu empresa le sobra,{" "}
            <span className="text-signal">a otra le hace falta.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-on-ink-muted">
            RexFy conecta a las empresas que generan material recuperado con las
            que lo transforman, y con el transporte que lo mueve. Pronto,
            también la capacidad de los talleres.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/registro" className="btn btn-signal px-6 py-3">
              Publicar material
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/marketplace"
              className="btn border border-on-ink/25 px-6 py-3 text-on-ink hover:border-on-ink"
            >
              Ver material disponible
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <p className="mb-3 font-mono text-xs text-on-ink-muted">
            Ejemplos de publicaciones
          </p>
          <ul className="flex flex-col gap-2.5">
            {PREVIEW.map((item) => (
              <li
                key={item.title}
                className="flex items-center gap-4 rounded-xl bg-surface p-4 text-foreground shadow-[0_10px_30px_rgb(0_0_0/0.25)]"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface-sunken">
                  <MaterialIcon category={item.category} className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted">
                    {CATEGORIES[item.category]}
                  </p>
                  <p className="truncate font-semibold">{item.title}</p>
                  <div className="mt-0.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-muted">{item.meta}</span>
                    <span className="shrink-0 font-mono font-medium">
                      {item.price}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** The two fronts of the network: what works today and what is coming. */
function Fronts() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20">
      <SectionHeading
        eyebrow="Dos frentes, una red"
        title="Materia prima y capacidad productiva en el mismo lugar."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <article className="card flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-2xl font-bold">Materiales recuperados</h3>
            <span className="chip">Disponible</span>
          </div>
          <p className="text-muted">
            Empresas que venden el material que les sobra y empresas que lo
            compran como insumo, con el transporte incluido en la negociación.
          </p>
          <ul className="flex flex-col gap-2.5">
            {AVAILABLE_NOW.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-signal" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/marketplace"
            className="btn btn-primary mt-auto self-start"
          >
            Ver marketplace
          </Link>
        </article>
        <article className="card flex flex-col gap-6 border-dashed p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-2xl font-bold">Manufactura distribuida</h3>
            <span className="rounded-full border border-border-strong px-2.5 py-0.5 text-xs font-semibold text-muted">
              Próximamente
            </span>
          </div>
          <p className="text-muted">
            Talleres que publican lo que pueden fabricar, con su maquinaria y
            sus medidas, para armar pedidos entre varios. Lo estamos
            construyendo.
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CAPABILITIES.map((capability) => (
              <li
                key={capability.label}
                className="flex flex-col items-center gap-2 rounded-lg bg-surface-sunken px-2 py-3 text-center text-xs font-semibold"
              >
                <Icon name={capability.icon} className="size-6" />
                {capability.label}
              </li>
            ))}
          </ul>
          <Link
            href="/registro"
            className="btn btn-secondary mt-auto self-start"
          >
            Registrar mi taller
          </Link>
        </article>
      </div>
    </section>
  );
}

/** How a micro supply chain forms, and the four steps of a deal. */
function ChainSection() {
  return (
    <section className="bg-ink text-on-ink">
      <div className="mx-auto w-full max-w-6xl px-4 py-20">
        <SectionHeading
          onInk
          eyebrow="Micro cadenas productivas"
          title="Lo que ninguna empresa resuelve sola, se arma entre varias."
        />
        <ol className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-0">
          {CHAIN.map((node, i) => (
            <li key={node} className="flex items-center">
              <span
                className={`flex items-center gap-2.5 rounded-lg border-[1.5px] bg-ink-2 px-4 py-2.5 text-sm font-semibold ${
                  i === CHAIN.length - 1
                    ? "border-signal"
                    : "border-ink-line-strong"
                }`}
              >
                <span className="size-2.5 rounded-full bg-signal" />
                {node}
              </span>
              {i < CHAIN.length - 1 && (
                <span
                  className="relative mx-1 hidden h-[1.5px] w-12 bg-net sm:block"
                  aria-hidden
                >
                  <span className="absolute -right-0.5 -top-[3px] size-2 rounded-full bg-net" />
                </span>
              )}
            </li>
          ))}
        </ol>
        <ol className="mt-16 grid gap-px overflow-hidden rounded-xl bg-ink-line sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-3 bg-ink p-6">
              <span className="font-mono text-sm text-signal">
                Paso {i + 1}
              </span>
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-on-ink-muted">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Who RexFy is for, and the material categories as entry points. */
function Audience() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div>
          <SectionHeading
            eyebrow="Para quién es"
            title="Tres roles en una misma red."
          />
          <ul className="mt-8 flex flex-col divide-y divide-border border-y border-border">
            {MARKET_ROLES.map((role) => (
              <li key={role.value} className="py-4">
                <p className="text-lg font-bold">{role.label}</p>
                <p className="text-muted">{role.hint}.</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Material por tipo</p>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(CATEGORIES) as MaterialCategory[]).map((category) => (
              <li key={category}>
                <Link
                  href={`/marketplace?category=${category}`}
                  className="card flex flex-col items-start gap-6 p-4 transition hover:border-foreground"
                >
                  <MaterialIcon category={category} className="size-7" />
                  <span className="font-semibold">{CATEGORIES[category]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="px-4 pb-20">
      <div className="relative isolate mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-6 overflow-hidden rounded-2xl bg-ink px-6 py-12 text-on-ink sm:px-12">
        <Network
          className="absolute inset-0 -z-10 h-full w-full opacity-50"
          width={1584}
          height={396}
          count={34}
          seed={11}
        />
        <div>
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Una red productiva.
          </h2>
          <p className="mt-2 text-on-ink-muted">
            Registra tu empresa y publica lo primero que puedes aportar.
          </p>
        </div>
        <Link href="/registro" className="btn btn-signal px-6 py-3">
          Registrar mi empresa
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted">
        <div className="flex items-center gap-4">
          <Logo className="h-6 text-foreground" />
          <span>Una red productiva.</span>
        </div>
        <ApiStatus />
      </div>
    </footer>
  );
}
