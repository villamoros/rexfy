"use client";

import { useActionState } from "react";

import { submitTransportQuote } from "@/app/actions/logistics";
import { Field, FormMessage, SubmitButton } from "@/components/form";

export function TransportQuoteForm({
  shipmentId,
  companies,
  pickupDate,
}: {
  shipmentId: string;
  companies: { id: string; name: string }[];
  pickupDate: string;
}) {
  const [state, action, pending] = useActionState(
    submitTransportQuote,
    undefined,
  );
  return (
    <details
      className="rounded-lg border border-border"
      open={Boolean(state?.message)}
    >
      <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium">
        Cotizar este viaje
      </summary>
      <form
        action={action}
        className="flex flex-col gap-3 border-t border-border p-4"
      >
        <input type="hidden" name="shipment_id" value={shipmentId} />
        {companies.length > 1 ? (
          <select
            name="company_id"
            aria-label="Empresa transportadora"
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
        <Field
          label="Precio total (COP)"
          name="price"
          type="number"
          min="1"
          required
          inputMode="numeric"
          placeholder="1850000"
          error={state?.fieldErrors?.price}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Recogida"
            name="pickup_date"
            type="date"
            required
            defaultValue={pickupDate}
          />
          <Field
            label="Entrega estimada"
            name="delivery_date"
            type="date"
            required
            defaultValue={pickupDate}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="includes_insurance"
            className="accent-brand-strong"
          />
          Incluye seguro de carga
        </label>
        <Field
          label="Notas (opcional)"
          name="notes"
          placeholder="Documentos de trazabilidad incluidos"
        />
        <FormMessage message={state?.message} />
        <SubmitButton pending={pending}>Enviar cotización</SubmitButton>
      </form>
    </details>
  );
}
