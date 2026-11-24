import { describe, expect, it } from "vitest";

import { readCachedPage } from "./results";

const page = { items: [], total: 0, limit: 20, offset: 0 };

describe("marketplace safe cache", () => {
  it("returns a recent page", () => {
    expect(
      readCachedPage(JSON.stringify({ savedAt: 1_000, data: page }), 2_000),
    ).toEqual(page);
  });

  it("rejects expired or malformed entries", () => {
    expect(
      readCachedPage(
        JSON.stringify({ savedAt: 1_000, data: page }),
        1_000 + 30 * 60 * 1_000 + 1,
      ),
    ).toBeNull();
    expect(readCachedPage("not-json", 2_000)).toBeNull();
  });
});
