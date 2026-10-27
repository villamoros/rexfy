import Link from "next/link";

/** RexFy wordmark: a closed loop (material that goes back into production). */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight ${className}`}
    >
      <span className="grid size-8 place-items-center rounded-xl bg-ink text-lime">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
          aria-hidden
        >
          <path d="M19.5 9A8 8 0 0 0 5 7.5" />
          <path d="M4.5 15A8 8 0 0 0 19 16.5" />
          <path d="M5 3.5v4h4" />
          <path d="M19 20.5v-4h-4" />
        </svg>
      </span>
      <span>
        Rex<span className="text-brand">Fy</span>
      </span>
    </Link>
  );
}
