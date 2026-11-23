"use client";

import { useActionState } from "react";

import { startThread } from "@/app/actions/deals";
import { FormMessage, SubmitButton } from "@/components/form";
import { useIdempotencyForm } from "@/lib/use-idempotency";

export function ContactForm({
  listingId,
  companies,
}: {
  listingId: string;
  companies: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(startThread, undefined);
  const { idempotencyRef, ensureIdempotencyKey } = useIdempotencyForm();
  return (
    <form
      action={action}
      className="mt-4 flex flex-col gap-3"
      onSubmit={ensureIdempotencyKey}
    >
      <input ref={idempotencyRef} type="hidden" name="idempotency_key" />
      <input type="hidden" name="listing_id" value={listingId} />
      {companies.length > 1 ? (
        <select
          name="company_id"
          aria-label="Empresa compradora"
          className="input text-sm"
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      ) : (
        <input type="hidden" name="company_id" value={companies[0].id} />
      )}
      <textarea
        name="body"
        required
        rows={3}
        maxLength={4000}
        aria-label="Mensaje al generador"
        defaultValue="Hola, vi su publicación y me interesa. ¿Me pueden dar más detalles?"
        className="input text-sm"
      />
      <FormMessage message={state?.message} />
      <SubmitButton pending={pending}>Contactar al generador</SubmitButton>
    </form>
  );
}
