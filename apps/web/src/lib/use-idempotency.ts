"use client";

import { useRef, type FormEventHandler } from "react";

export function useIdempotencyForm(): {
  idempotencyRef: React.RefObject<HTMLInputElement | null>;
  ensureIdempotencyKey: FormEventHandler<HTMLFormElement>;
} {
  const idempotencyRef = useRef<HTMLInputElement>(null);
  return {
    idempotencyRef,
    ensureIdempotencyKey: () => {
      if (idempotencyRef.current && !idempotencyRef.current.value)
        idempotencyRef.current.value = crypto.randomUUID();
    },
  };
}
