"use client";

import { useActionState } from "react";

import { takeDownListing } from "@/app/actions/admin";

export function TakeDownForm({ listingId }: { listingId: string }) {
  const [state, action, pending] = useActionState(takeDownListing, undefined);
  return (
    <form action={action} className="flex flex-wrap items-start gap-2">
      <input type="hidden" name="listing_id" value={listingId} />
      <input
        name="reason"
        required
        minLength={5}
        maxLength={1000}
        placeholder="Motivo, lo verá la empresa"
        className="input min-w-0 flex-1 text-sm"
      />
      <button disabled={pending} className="btn btn-secondary text-sm">
        {pending ? "Un momento…" : "Retirar"}
      </button>
      {state?.message && (
        <p role="alert" className="w-full text-xs text-warn">
          {state.message}
        </p>
      )}
    </form>
  );
}
