import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MAX_PHOTO_BYTES,
  PHOTO_TARGET_BYTES,
  photoSelectionError,
  shrinkPhoto,
} from "./media";

describe("publish media", () => {
  afterEach(() => vi.restoreAllMocks());
  it("rejects too many or oversized photos", () => {
    const small = new File(["photo"], "pet.jpg", { type: "image/jpeg" });
    const large = new File([new Uint8Array(MAX_PHOTO_BYTES + 1)], "large.jpg");
    expect(photoSelectionError([small, small], 1)).toMatch(/máximo 1/);
    expect(photoSelectionError([large], 1)).toMatch(/5 MB/);
    expect(photoSelectionError([small], 1)).toBe("");
  });

  it("does not recompress a photo already below the target", async () => {
    const file = new File([new Uint8Array(PHOTO_TARGET_BYTES - 1)], "pet.jpg");
    await expect(shrinkPhoto(file)).resolves.toBe(file);
  });

  it("returns the original when the browser cannot decode it", async () => {
    const file = new File([new Uint8Array(PHOTO_TARGET_BYTES + 1)], "broken.png");
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("decode")));
    await expect(shrinkPhoto(file)).resolves.toBe(file);
    vi.unstubAllGlobals();
  });

  it("resizes and converts a large decodable image", async () => {
    const file = new File([new Uint8Array(PHOTO_TARGET_BYTES + 1)], "large.png");
    const close = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 3200, height: 1600, close }),
    );
    const drawImage = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({
        fillStyle: "",
        fillRect: vi.fn(),
        drawImage,
      })),
      toBlob: (callback: BlobCallback) =>
        callback(new Blob(["compressed"], { type: "image/jpeg" })),
    };
    vi.spyOn(document, "createElement").mockReturnValue(
      canvas as unknown as HTMLCanvasElement,
    );
    const result = await shrinkPhoto(file);
    expect(result.name).toBe("large.jpg");
    expect(canvas.width).toBe(1600);
    expect(drawImage).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
