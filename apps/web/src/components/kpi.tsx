import type { ReactNode } from "react";

/** One headline number with its label and, optionally, what it is measured over. */
export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-2xl font-medium tracking-tight">
        {value}
      </dd>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
      {children}
    </dl>
  );
}

const number = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

export function formatNumber(value: number): string {
  return number.format(value);
}

export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)} %`;
}
