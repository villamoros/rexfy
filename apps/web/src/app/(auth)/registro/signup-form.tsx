"use client";

import Link from "next/link";
import { useActionState } from "react";

import { register } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/form";

export function SignupForm() {
  const [state, action, pending] = useActionState(register, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage message={state?.message} />
      <Field
        label="Nombre completo"
        name="full_name"
        autoComplete="name"
        required
        defaultValue={state?.values?.full_name}
        error={state?.fieldErrors?.full_name}
      />
      <Field
        label="Correo"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state?.values?.email}
        error={state?.fieldErrors?.email}
      />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        error={state?.fieldErrors?.password}
      />
      <SubmitButton pending={pending}>Crear cuenta</SubmitButton>
      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" className="text-brand underline">
          Ingresa
        </Link>
      </p>
    </form>
  );
}
