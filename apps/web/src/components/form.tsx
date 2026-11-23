import { useId, type InputHTMLAttributes, type ReactNode } from "react";

export function Field({
  label,
  error,
  ...props
}: {
  label: string;
  error?: string;
  name: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const inputId = useId();
  const errorId = useId();
  return (
    <div className="flex flex-col gap-1.5 text-left text-sm">
      <label htmlFor={props.id ?? inputId} className="font-medium">
        {label}
      </label>
      <input
        {...props}
        id={props.id ?? inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="input text-base"
      />
      {error && (
        <span id={errorId} className="text-warn">
          {error}
        </span>
      )}
    </div>
  );
}

export function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn"
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
    <button type="submit" disabled={pending} className="btn btn-primary">
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
    <div className="w-full max-w-md card p-6 sm:p-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}
