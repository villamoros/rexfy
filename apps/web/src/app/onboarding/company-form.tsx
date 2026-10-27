"use client";

import { useActionState } from "react";

import { createCompany } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { MARKET_ROLES } from "@/lib/roles";

export function CompanyForm() {
  const [state, action, pending] = useActionState(createCompany, undefined);
  const rolesError =
    state?.fieldErrors?.market_roles && "Elige al menos un rol";
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage message={state?.message} />
      <Field
        label="Razón social"
        name="legal_name"
        required
        placeholder="Cartones del Valle SAS"
        defaultValue={state?.values?.legal_name}
        error={state?.fieldErrors?.legal_name}
      />
      <Field
        label="NIT"
        name="nit"
        required
        placeholder="900.123.456-8"
        inputMode="numeric"
        defaultValue={state?.values?.nit}
        error={state?.fieldErrors?.nit}
      />
      <Field
        label="Ciudad"
        name="city"
        required
        placeholder="Cali"
        defaultValue={state?.values?.city}
        error={state?.fieldErrors?.city}
      />
      <fieldset className="flex flex-col gap-2 text-left text-sm">
        <legend className="mb-1.5 font-medium">
          ¿Qué hace tu empresa en RexFy?
        </legend>
        {MARKET_ROLES.map((role) => (
          <label
            key={role.value}
            className="flex cursor-pointer items-start gap-3 card p-3 transition hover:border-brand/60 has-checked:border-brand has-checked:bg-brand-soft"
          >
            <input
              type="checkbox"
              name="market_roles"
              value={role.value}
              defaultChecked={state?.roles?.includes(role.value)}
              className="mt-1 accent-brand"
            />
            <span>
              <span className="block font-medium">{role.label}</span>
              <span className="text-muted">{role.hint}</span>
            </span>
          </label>
        ))}
        {rolesError && <span className="text-warn">{rolesError}</span>}
      </fieldset>
      <SubmitButton pending={pending}>Registrar empresa</SubmitButton>
    </form>
  );
}
