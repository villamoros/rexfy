import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";

import { apiFetch, type Me } from "@/lib/api";

/** A fresh Clerk session token for calling the API, if someone is signed in. */
export async function getToken(): Promise<string | undefined> {
  return (await (await auth()).getToken()) ?? undefined;
}

/**
 * The signed-in user, or a redirect to the login page. Call it inside a Suspense boundary.
 *
 * When Clerk has a session but the API can't load the account, this throws instead of
 * redirecting: the login page would send a signed-in user straight back, in a loop.
 */
export async function requireUser(): Promise<Me> {
  const token = await getToken();
  if (!token) redirect("/ingresar");
  const result = await apiFetch<Me>("/me", { token });
  if (!result.ok)
    throw new Error(
      `No pudimos cargar tu cuenta (${result.status}): ${result.message}`,
    );
  return result.data;
}

/** The signed-in user, or null for visitors and when the API can't load the account. */
export const getMe = cache(async (): Promise<Me | null> => {
  const token = await getToken();
  if (!token) return null;
  const result = await apiFetch<Me>("/me", { token });
  return result.ok ? result.data : null;
});
