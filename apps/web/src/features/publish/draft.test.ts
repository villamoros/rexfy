import { describe, expect, it, vi } from "vitest";

import { DRAFT_KEY, parseDraft, readDraft, writeDraft } from "./draft";

describe("publish draft", () => {
  it("reads legacy and versioned drafts and rejects malformed data", () => {
    expect(parseDraft('{"title":"PET","recurring":true}')).toEqual({
      title: "PET",
      recurring: true,
    });
    expect(
      parseDraft('{"version":1,"values":{"title":"Aluminio"}}'),
    ).toEqual({ title: "Aluminio" });
    expect(parseDraft('{"version":99,"values":{"title":"Viejo"}}')).toBeNull();
    expect(parseDraft("not json")).toBeNull();
  });

  it("writes, reads and removes a versioned draft", () => {
    const storage = {
      getItem: vi.fn(() => '{"version":1,"values":{"city":"Cali"}}'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    expect(readDraft(storage)).toEqual({ city: "Cali" });
    writeDraft(storage, { city: "Bogotá" });
    expect(storage.setItem).toHaveBeenCalledWith(
      DRAFT_KEY,
      '{"version":1,"values":{"city":"Bogotá"}}',
    );
    writeDraft(storage, null);
    expect(storage.removeItem).toHaveBeenCalledWith(DRAFT_KEY);
  });

  it("degrades safely when browser storage is unavailable", () => {
    const blocked = {
      getItem: vi.fn(() => {
        throw new DOMException("blocked");
      }),
      setItem: vi.fn(() => {
        throw new DOMException("full");
      }),
      removeItem: vi.fn(),
    };
    expect(readDraft(blocked)).toBeNull();
    expect(() => writeDraft(blocked, { city: "Cali" })).not.toThrow();
  });
});
