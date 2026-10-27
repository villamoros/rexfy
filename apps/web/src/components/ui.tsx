import type { ReactNode } from "react";

/** Title block that opens every app page: optional eyebrow, h1, lead and actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-xl text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2 text-sm">{actions}</div>}
    </div>
  );
}

/** Heading for a marketing section; `onInk` switches the eyebrow to Señal for Noche backgrounds. */
export function SectionHeading({
  eyebrow,
  title,
  onInk = false,
}: {
  eyebrow: string;
  title: ReactNode;
  onInk?: boolean;
}) {
  return (
    <>
      <p className={`eyebrow ${onInk ? "text-signal" : ""}`}>{eyebrow}</p>
      <h2 className="mt-3 max-w-2xl text-3xl font-extrabold sm:text-4xl">
        {title}
      </h2>
    </>
  );
}

/** Placeholder for a list with nothing in it yet. */
export function EmptyState({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`rounded-2xl border border-dashed border-border bg-surface-sunken/50 p-8 text-center text-sm text-muted ${className}`}
    >
      {children}
    </p>
  );
}

/** Confirmation banner after an action succeeds. */
export function SuccessNotice({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm font-medium text-brand"
    >
      {children}
    </p>
  );
}
