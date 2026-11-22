import type { ApiResult } from "@/lib/api";

export type MutationState =
  | {
      status: "error" | "success";
      message: string;
      requestId?: string;
    }
  | undefined;

export type MutationAction = (
  state: MutationState,
  formData: FormData,
) => Promise<MutationState>;

type ApiFailure = Extract<ApiResult<unknown>, { ok: false }>;

/** Convert an expected API failure into safe, actionable UI copy. */
export function mutationFailure(result: ApiFailure): MutationState {
  let message = result.message;
  if (result.status === 401) {
    message = "Tu sesión venció. Ingresa de nuevo e intenta otra vez.";
  } else if (result.status === 403) {
    message = result.message || "No tienes permiso para realizar esta acción.";
  } else if (result.status === 409) {
    message = `${result.message}. Actualiza la página antes de reintentar.`;
  } else if (result.status >= 500) {
    message = "No pudimos completar la acción. Intenta de nuevo en unos minutos.";
  }
  return { status: "error", message, requestId: result.requestId };
}

export function mutationSuccess(message: string): MutationState {
  return { status: "success", message };
}
