"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/form";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage message={state?.message} />
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
        autoComplete="current-password"
        required
        error={state?.fieldErrors?.password}
      />
      <SubmitButton pending={pending}>Ingresar</SubmitButton>
      <p className="text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-brand underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
