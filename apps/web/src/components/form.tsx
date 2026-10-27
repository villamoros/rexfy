import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({
  label,
  error,
  ...props
}: {
  label: string;
  error?: string;
  name: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-left text-sm">
      <span className="font-medium">{label}</span>
      <input
        {...props}
        aria-invalid={error ? true : undefined}
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-brand aria-invalid:border-warn"
      />
      {error && <span className="text-warn">{error}</span>}
    </label>
  );
}

export function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn"
    >
      {message}
    </p>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-strong px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Un momento…" : children}
    </button>
  );
}

export function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}
