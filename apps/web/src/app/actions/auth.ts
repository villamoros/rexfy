"use server";

import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/session";

export type FormState =
  | {
      message?: string;
      fieldErrors?: Record<string, string>;
      values?: Record<string, string>;
      roles?: string[];
    }
  | undefined;

type Token = { access_token: string };

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export async function register(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = {
    full_name: text(formData, "full_name"),
    email: text(formData, "email"),
  };
  const result = await apiFetch<Token>("/auth/register", {
    method: "POST",
    body: { ...values, password: String(formData.get("password") ?? "") },
  });
  if (!result.ok)
    return { message: result.message, fieldErrors: result.fieldErrors, values };
  await setToken(result.data.access_token);
  redirect("/onboarding");
}

export async function login(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const result = await apiFetch<Token>("/auth/login", {
    method: "POST",
    body: { ...values, password: String(formData.get("password") ?? "") },
  });
  if (!result.ok)
    return { message: result.message, fieldErrors: result.fieldErrors, values };
  await setToken(result.data.access_token);
  redirect("/panel");
}

export async function logout() {
  await clearToken();
  redirect("/ingresar");
}

export async function createCompany(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = await getToken();
  if (!token) redirect("/ingresar");
  const values = {
    legal_name: text(formData, "legal_name"),
    nit: text(formData, "nit"),
    city: text(formData, "city"),
  };
  const marketRoles = formData.getAll("market_roles").map(String);
  const result = await apiFetch("/companies", {
    method: "POST",
    token,
    body: { ...values, market_roles: marketRoles },
  });
  if (!result.ok) {
    if (result.status === 401) redirect("/ingresar");
    return {
      message: result.message,
      fieldErrors: result.fieldErrors,
      values,
      roles: marketRoles,
    };
  }
  redirect("/panel");
}
