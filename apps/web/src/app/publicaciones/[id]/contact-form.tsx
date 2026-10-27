"use client";

import { useActionState } from "react";

import { startThread } from "@/app/actions/deals";
import { FormMessage, SubmitButton } from "@/components/form";

export function ContactForm({
  listingId,
  companies,
}: {
  listingId: string;
  companies: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(startThread, undefined);
  return (
    <form action={action} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="listing_id" value={listingId} />
      {companies.length > 1 ? (
        <select
          name="company_id"
          aria-label="Empresa compradora"
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
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
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
      <FormMessage message={state?.message} />
      <SubmitButton pending={pending}>Contactar al generador</SubmitButton>
    </form>
  );
}
