import "server-only";

import { connection } from "next/server";

import type { components } from "@/lib/api-schema";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export type Schemas = components["schemas"];

export type MarketRole = Schemas["MarketRole"];
export type Membership = Schemas["MembershipOut"];
export type Me = Schemas["MeResponse"];

export type ApiResult<T> =
  | { ok: true; data: T; requestId: string }
  | {
      ok: false;
      status: number;
      message: string;
      fieldErrors: Record<string, string>;
      requestId: string;
      reason: "http" | "network" | "timeout";
    };

type ValidationIssue = { loc: (string | number)[]; msg: string };

export async function apiFetch<T>(
  path: string,
  {
    token,
    method = "GET",
    body,
    timeoutMs,
    idempotencyKey,
  }: {
    token?: string;
    method?: string;
    body?: unknown;
    timeoutMs?: number;
    idempotencyKey?: string;
  } = {},
): Promise<ApiResult<T>> {
  // Request IDs must be unique per real request, never frozen into a prerendered shell.
  await connection();
  // FormData goes as multipart (file uploads); anything else as JSON.
  const multipart = body instanceof FormData;
  const requestId = crypto.randomUUID();
  const effectiveTimeout =
    timeoutMs ?? (multipart ? 60_000 : method === "GET" ? 8_000 : 15_000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), effectiveTimeout);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(multipart ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        "X-Request-ID": requestId,
      },
      body:
        body === undefined
          ? undefined
          : multipart
            ? body
            : JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    const timedOut = controller.signal.aborted;
    return {
      ok: false,
      status: 0,
      message: timedOut
        ? "El servidor tardó demasiado en responder"
        : "No pudimos conectar con el servidor",
      fieldErrors: {},
      requestId,
      reason: timedOut ? "timeout" : "network",
    };
  } finally {
    clearTimeout(timer);
  }

  const responseRequestId = res.headers.get("x-request-id") ?? requestId;
  const payload = await res.json().catch(() => null);
  if (res.ok)
    return { ok: true, data: payload as T, requestId: responseRequestId };

  const fieldErrors: Record<string, string> = {};
  let message = "Algo salió mal, intenta de nuevo";
  if (Array.isArray(payload?.detail)) {
    for (const issue of payload.detail as ValidationIssue[]) {
      const field = String(issue.loc.at(-1));
      fieldErrors[field] ??= issue.msg.replace(/^Value error, /, "");
    }
    message = "Revisa los campos marcados";
  } else if (typeof payload?.detail === "string") {
    message = payload.detail;
  }
  return {
    ok: false,
    status: res.status,
    message,
    fieldErrors,
    requestId: responseRequestId,
    reason: "http",
  };
}
