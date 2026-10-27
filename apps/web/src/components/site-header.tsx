import Link from "next/link";

const LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/publicar", label: "Publicar" },
  { href: "/panel", label: "Mi panel" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-widest text-brand"
        >
          RexFy
        </Link>
        <ul className="flex gap-4 text-sm">
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
      </nav>
    </header>
  );
}
