"use client";

import { useActionState } from "react";

import { requestShipment } from "@/app/actions/logistics";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { VEHICLES } from "@/lib/logistics";

export function ShipmentRequestForm({
  transactionId,
  pickupCity,
}: {
  transactionId: string;
  pickupCity: string;
}) {
  const [state, action, pending] = useActionState(requestShipment, undefined);
  const errors = state?.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="transaction_id" value={transactionId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Ciudad de recogida"
          name="pickup_city"
          required
          defaultValue={pickupCity}
          error={errors.pickup_city}
        />
        <Field
          label="Dirección de recogida"
          name="pickup_address"
          required
          minLength={5}
          error={errors.pickup_address}
        />
        <Field
          label="Ciudad de entrega"
          name="delivery_city"
          required
          error={errors.delivery_city}
        />
        <Field
          label="Dirección de entrega"
          name="delivery_address"
          required
          minLength={5}
          error={errors.delivery_address}
        />
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Tipo de vehículo</span>
        <select
          name="vehicle_type"
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-base"
        >
          {Object.entries(VEHICLES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <Field
        label="Fecha de recogida"
        name="pickup_date"
        type="date"
        required
        error={errors.pickup_date}
      />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Requisitos especiales (opcional)</span>
        <textarea
          name="requirements"
          rows={2}
          maxLength={2000}
          placeholder="Horario de planta 07:00 a 17:00, montacargas disponible…"
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-brand"
        />
      </label>
      <FormMessage message={state?.message} />
      <SubmitButton pending={pending}>
        Solicitar cotizaciones de transporte
      </SubmitButton>
    </form>
  );
}
