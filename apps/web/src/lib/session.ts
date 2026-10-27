import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { apiFetch, type Me } from "@/lib/api";

export const SESSION_COOKIE = "rexfy_session";

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function setToken(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function clearToken() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in user, or a redirect to the login page. Call it inside a Suspense boundary. */
export async function requireUser(): Promise<Me> {
  const token = await getToken();
  if (!token) redirect("/ingresar");
  const result = await apiFetch<Me>("/me", { token });
  if (!result.ok) redirect("/ingresar");
  return result.data;
}
