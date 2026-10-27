import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

const LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/publicar", label: "Publicar" },
  { href: "/mensajes", label: "Mensajes" },
  { href: "/ordenes", label: "Órdenes" },
  { href: "/transporte", label: "Transporte" },
  { href: "/panel", label: "Panel" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-widest text-brand"
        >
          RexFy
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <UserButton />
        </div>
      </nav>
    </header>
  );
}
