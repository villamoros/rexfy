"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/publicar", label: "Publicar" },
  { href: "/mensajes", label: "Mensajes" },
  { href: "/ordenes", label: "Órdenes" },
  { href: "/transporte", label: "Transporte" },
  { href: "/panel", label: "Panel" },
] as const;

export function NavLinks() {
  return <NavList pathname={usePathname()} />;
}

/** The links without an active state, for the prerendered shell. */
export function NavList({ pathname }: { pathname: string | null }) {
  return (
    <ul className="-mx-1 flex gap-1 overflow-x-auto text-sm [scrollbar-width:none]">
      {LINKS.map((link) => {
        const active =
          pathname !== null &&
          (pathname === link.href || pathname.startsWith(`${link.href}/`));
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 transition-colors ${
                active
                  ? "bg-surface-sunken font-semibold text-foreground"
                  : "font-medium text-muted hover:bg-surface-sunken hover:text-foreground"
              }`}
            >
              {active && (
                <span className="size-1.5 rounded-full bg-signal" aria-hidden />
              )}
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
