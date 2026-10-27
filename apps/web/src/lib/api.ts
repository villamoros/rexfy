import "server-only";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export type MarketRole = "generator" | "buyer" | "transporter";

export type Membership = {
  company_id: string;
  legal_name: string;
  market_roles: MarketRole[];
  role: "owner" | "admin" | "member";
};

export type Me = {
  id: string;
  email: string;
  full_name: string;
  is_platform_admin: boolean;
  companies: Membership[];
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      message: string;
      fieldErrors: Record<string, string>;
    };

type ValidationIssue = { loc: (string | number)[]; msg: string };

export async function apiFetch<T>(
  path: string,
  {
    token,
    method = "GET",
    body,
  }: { token?: string; method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 0,
      message: "No pudimos conectar con el servidor",
      fieldErrors: {},
    };
  }

  const payload = await res.json().catch(() => null);
  if (res.ok) return { ok: true, data: payload as T };

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
  return { ok: false, status: res.status, message, fieldErrors };
}
