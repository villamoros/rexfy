import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { apiFetch, type Me } from "@/lib/api";

/** A fresh Clerk session token for calling the API, if someone is signed in. */
export async function getToken(): Promise<string | undefined> {
  return (await (await auth()).getToken()) ?? undefined;
}

/** The signed-in user, or a redirect to the login page. Call it inside a Suspense boundary. */
export async function requireUser(): Promise<Me> {
  const token = await getToken();
  if (!token) redirect("/ingresar");
  const result = await apiFetch<Me>("/me", { token });
  if (!result.ok) redirect("/ingresar");
  return result.data;
}
