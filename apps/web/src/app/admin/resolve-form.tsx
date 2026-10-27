"use client";

import { useActionState } from "react";

import { resolveDispute } from "@/app/actions/trust";
import { FormMessage, SubmitButton } from "@/components/form";
import type { AdminDispute } from "@/lib/trust";

export function ResolveForm({ dispute }: { dispute: AdminDispute }) {
  const [state, action, pending] = useActionState(resolveDispute, undefined);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="dispute_id" value={dispute.id} />
      <textarea
        name="resolution"
        rows={2}
        required
        minLength={10}
        maxLength={4000}
        placeholder="Resolución acordada, la verán ambas partes"
        className="input text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="at_fault_company_id"
          defaultValue=""
          className="input text-sm"
        >
          <option value="">Sin responsable</option>
          <option value={dispute.buyer.id}>
            Responsable: {dispute.buyer.legal_name}
          </option>
          <option value={dispute.seller.id}>
            Responsable: {dispute.seller.legal_name}
          </option>
        </select>
        <SubmitButton pending={pending}>Resolver</SubmitButton>
      </div>
      <FormMessage message={state?.message} />
    </form>
  );
}
