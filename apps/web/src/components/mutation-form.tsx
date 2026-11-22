"use client";

import { useActionState, type ReactNode } from "react";

import type { MutationAction } from "@/lib/action-state";

export function MutationForm({
  action,
  children,
  className,
}: {
  action: MutationAction;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className={className} aria-busy={pending}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`col-span-full w-full text-xs ${state.status === "error" ? "text-warn" : "text-brand"}`}
        >
          {state.message}
          {state.requestId && (
            <span className="mt-1 block font-mono text-[10px] text-muted">
              Referencia: {state.requestId}
            </span>
          )}
        </p>
      )}
    </form>
  );
}
