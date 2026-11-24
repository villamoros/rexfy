import Link from "next/link";

import { ApiStatus } from "@/components/api-status";
import { Logo } from "@/components/logo";

const PLATFORM_LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/publicar", label: "Publicar material" },
  { href: "/transporte", label: "Transporte" },
  { href: "/estado", label: "Estado del servicio" },
];

const TRUST_LINKS = [
  { href: "/legal", label: "Centro legal" },
  { href: "/legal#modelo", label: "Modelo de operación" },
  { href: "/legal#materiales", label: "Materiales y trazabilidad" },
  { href: "/legal#privacidad", label: "Privacidad" },
];

const OPERATION_LINKS = [
  { href: "/legal#pagos", label: "Pagos y facturación" },
  { href: "/legal#reclamaciones", label: "Reclamaciones" },
  { href: "/legal#documentos", label: "Documentos en preparación" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-ink text-on-ink">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo className="h-8 text-on-ink" />
          <p className="mt-5 text-sm leading-6 text-on-ink-muted">
            Marketplace B2B que conecta empresas para recuperar materiales,
            negociar su aprovechamiento y coordinar su transporte con
            trazabilidad.
          </p>
          <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-5 text-on-ink-muted">
            RexFy facilita el contacto y la operación. La condición de cada
            material, los impuestos, costos y responsabilidades se informan y
            aceptan antes de cerrar cada negocio.
          </p>
        </div>

        <FooterColumn title="Plataforma" links={PLATFORM_LINKS} />
        <FooterColumn title="Confianza" links={TRUST_LINKS} />
        <FooterColumn title="Operación" links={OPERATION_LINKS} />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-on-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 RexFy · Una red productiva.</p>
          <ApiStatus inverted />
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="text-sm font-bold text-on-ink">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm text-on-ink-muted">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="transition-colors hover:text-signal focus-visible:text-signal"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
