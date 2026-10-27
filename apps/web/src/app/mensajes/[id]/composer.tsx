"use client";

import { useActionState, useRef } from "react";

import { sendMessage, sendOffer } from "@/app/actions/deals";
import { FormMessage, SubmitButton } from "@/components/form";
import { UNITS, type QuantityUnit } from "@/lib/listings";

export function MessageComposer({ threadId }: { threadId: string }) {
  const [state, action, pending] = useActionState(sendMessage, undefined);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="thread_id" value={threadId} />
      <FormMessage message={state?.message} />
      <div className="flex gap-2">
        <textarea
          name="body"
          required
          rows={2}
          maxLength={4000}
          placeholder="Escribe un mensaje…"
          aria-label="Mensaje"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <SubmitButton pending={pending}>Enviar</SubmitButton>
      </div>
    </form>
  );
}

export function OfferComposer({
  threadId,
  quantityUnit,
  maxQuantity,
  defaultPrice,
  defaultPriceUnit,
  label,
}: {
  threadId: string;
  quantityUnit: QuantityUnit;
  maxQuantity: number;
  defaultPrice: number | null;
  defaultPriceUnit: QuantityUnit | null;
  label: string;
}) {
  const [state, action, pending] = useActionState(sendOffer, undefined);
  const details = useRef<HTMLDetailsElement>(null);
  const input =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand";
  return (
    <details
      ref={details}
      className="rounded-xl border border-border"
      open={Boolean(state?.message)}
    >
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
        {label}
      </summary>
      <form
        action={action}
        className="flex flex-col gap-3 border-t border-border p-4 text-sm"
      >
        <input type="hidden" name="thread_id" value={threadId} />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-medium">
              Cantidad ({UNITS[quantityUnit]})
            </span>
            <input
              name="quantity"
              type="number"
              step="any"
              min="0.001"
              max={maxQuantity}
              required
              defaultValue={maxQuantity}
              inputMode="decimal"
              className={input}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Vigencia</span>
            <select name="valid_hours" defaultValue="48" className={input}>
              <option value="24">24 horas</option>
              <option value="48">48 horas</option>
              <option value="168">7 días</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Precio (COP)</span>
            <input
              name="price"
              type="number"
              step="any"
              min="1"
              required
              inputMode="numeric"
              defaultValue={defaultPrice ?? undefined}
              className={input}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Por</span>
            <select
              name="price_unit"
              defaultValue={defaultPriceUnit ?? "kg"}
              className={input}
            >
              {Object.entries(UNITS).map(([value, unitLabel]) => (
                <option key={value} value={value}>
                  {unitLabel}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Condiciones (opcional)</span>
          <textarea
            name="notes"
            rows={2}
            maxLength={2000}
            placeholder="Incluye cargue en planta, contrato mensual…"
            className={input}
          />
        </label>
        <FormMessage message={state?.message} />
        <SubmitButton pending={pending}>Enviar cotización formal</SubmitButton>
      </form>
    </details>
  );
}
