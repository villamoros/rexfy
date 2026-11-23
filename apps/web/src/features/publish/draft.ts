import type { Values } from "./model";

export const DRAFT_KEY = "rexfy:publicar:borrador";
const DRAFT_VERSION = 1;

type StoredDraft = { version: number; values: Values };

function validValues(value: unknown): value is Values {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every(
      (item) => typeof item === "string" || typeof item === "boolean",
    )
  );
}

export function parseDraft(raw: string | null): Values | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (validValues(parsed)) return parsed; // Compatible with drafts written before EP-04.
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "version" in parsed &&
      "values" in parsed
    ) {
      const draft = parsed as StoredDraft;
      return draft.version === DRAFT_VERSION && validValues(draft.values)
        ? draft.values
        : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function readDraft(storage: Pick<Storage, "getItem">): Values | null {
  try {
    return parseDraft(storage.getItem(DRAFT_KEY));
  } catch {
    return null;
  }
}

export function writeDraft(
  storage: Pick<Storage, "setItem" | "removeItem">,
  values: Values | null,
) {
  try {
    if (values)
      storage.setItem(
        DRAFT_KEY,
        JSON.stringify({ version: DRAFT_VERSION, values } satisfies StoredDraft),
      );
    else storage.removeItem(DRAFT_KEY);
  } catch {
    // Storage blocked or full: publishing still works without the local copy.
  }
}
