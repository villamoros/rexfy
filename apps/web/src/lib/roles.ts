import type { MarketRole } from "@/lib/api";

export const MARKET_ROLES: {
  value: MarketRole;
  label: string;
  hint: string;
}[] = [
  {
    value: "generator",
    label: "Generador",
    hint: "Tengo material reciclable para vender",
  },
  {
    value: "buyer",
    label: "Comprador",
    hint: "Compro material para transformarlo o reutilizarlo",
  },
  {
    value: "transporter",
    label: "Transportista",
    hint: "Ofrezco recolección y transporte",
  },
];

export function roleLabel(role: MarketRole): string {
  return MARKET_ROLES.find((r) => r.value === role)?.label ?? role;
}
