import type { Me, MarketRole } from "@/lib/api";
import type { NavLink } from "@/components/nav-links";

const ALL: (NavLink & { roles?: MarketRole[]; admin?: true })[] = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/publicar", label: "Publicar", roles: ["generator"] },
  { href: "/mensajes", label: "Mensajes", roles: ["generator", "buyer"] },
  { href: "/ordenes", label: "Órdenes", roles: ["generator", "buyer"] },
  { href: "/transporte", label: "Transporte", roles: ["transporter"] },
  { href: "/panel", label: "Panel" },
  { href: "/admin", label: "Admin", admin: true },
];

/** Visitors see the marketplace and the way in; members see what their companies do. */
export const VISITOR_LINKS: NavLink[] = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/panel", label: "Panel" },
];

export function linksFor(me: Me | null): NavLink[] {
  if (!me) return VISITOR_LINKS;
  const roles = new Set(me.companies.flatMap((c) => c.market_roles));
  return ALL.filter(
    (link) =>
      (!link.admin || me.is_platform_admin) &&
      (!link.roles || link.roles.some((r) => roles.has(r))),
  ).map(({ href, label }) => ({ href, label }));
}
