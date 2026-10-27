"use client";

import { useActionState, useState } from "react";

import { confirmReceipt } from "@/app/actions/deals";
import { leaveReview, openDispute } from "@/app/actions/trust";
import { FormMessage, SubmitButton } from "@/components/form";
import { DISPUTE_REASONS } from "@/lib/trust";

export function ConfirmReceiptButton({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(confirmReceipt, undefined);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="transaction_id" value={orderId} />
      <SubmitButton pending={pending}>
        Confirmar recepción del material
      </SubmitButton>
      <FormMessage message={state?.message} />
    </form>
  );
}

export function ReviewForm({
  orderId,
  counterpart,
}: {
  orderId: string;
  counterpart: string;
}) {
  const [state, action, pending] = useActionState(leaveReview, undefined);
  const [rating, setRating] = useState(0);
  if (state?.done)
    return (
      <p className="text-sm text-muted">
        Gracias, tu calificación ya cuenta en el perfil de {counterpart}.
      </p>
    );
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="transaction_id" value={orderId} />
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">
          ¿Cómo te fue con {counterpart}?
        </legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer text-3xl leading-none">
              <input
                type="radio"
                name="rating"
                value={n}
                required
                checked={rating === n}
                onChange={() => setRating(n)}
                className="sr-only"
              />
              <span
                aria-label={`${n} de 5`}
                className={n <= rating ? "text-signal" : "text-border"}
              >
                ★
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <textarea
        name="comment"
        rows={3}
        maxLength={2000}
        placeholder="Calidad del material, puntualidad, trato (opcional)"
        className="input text-base"
      />
      <FormMessage message={state?.message} />
      <div>
        <SubmitButton pending={pending}>Enviar calificación</SubmitButton>
      </div>
    </form>
  );
}

export function DisputeForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(openDispute, undefined);
  const [open, setOpen] = useState(false);
  if (state?.done) return null;
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-sm text-muted underline hover:text-foreground"
      >
        Reportar un problema con esta orden
      </button>
    );
  return (
    <form action={action} className="flex flex-col gap-3 card p-5">
      <h2 className="text-lg font-bold">Reportar un problema</h2>
      <p className="text-sm text-muted">
        El equipo de RexFy revisa el caso con ambas partes. Mientras esté
        abierto, la orden no se puede cerrar.
      </p>
      <input type="hidden" name="transaction_id" value={orderId} />
      <select name="reason" required className="input text-base">
        {Object.entries(DISPUTE_REASONS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <textarea
        name="description"
        rows={4}
        required
        minLength={10}
        maxLength={4000}
        placeholder="Qué pasó, cuándo, y qué esperas como solución"
        className="input text-base"
      />
      <FormMessage message={state?.message} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-secondary"
        >
          Cancelar
        </button>
        <SubmitButton pending={pending}>Enviar reporte</SubmitButton>
      </div>
    </form>
  );
}
