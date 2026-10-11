import { afterEach, describe, expect, it, vi } from "vitest";
import { isLocalRasterImage, loadLocalRasterImage } from "./local-raster-image";

function decoder(width: number, height: number, fails = false) {
  vi.spyOn(window, "Image").mockImplementation(function () {
    const image = document.createElement("img");
    Object.defineProperties(image, {
      naturalWidth: { value: width },
      naturalHeight: { value: height },
      src: {
        set: () =>
          queueMicrotask(() =>
            image.dispatchEvent(new Event(fails ? "error" : "load")),
          ),
      },
    });
    return image;
  });
}
describe("shared local raster validation", () => {
  afterEach(() => vi.restoreAllMocks());
  it("accepts only upload paths and bounded PNG/JPEG/WebP data", () => {
    expect(isLocalRasterImage("/images/upload/forms/logo.png")).toBe(true);
    expect(isLocalRasterImage("data:image/webp;base64,YQ==")).toBe(true);
    expect(isLocalRasterImage("https://example.com/logo.png")).toBe(false);
    expect(isLocalRasterImage("data:image/svg+xml;base64,YQ==")).toBe(false);
  });
  it("decodes valid local rasters for both cropping and uploading", async () => {
    decoder(1600, 900);
    await expect(
      loadLocalRasterImage("data:image/png;base64,YQ=="),
    ).resolves.toMatchObject({ naturalWidth: 1600, naturalHeight: 900 });
  });
  it.each([
    [0, 10],
    [10000, 10000],
  ])(
    "rejects invalid/excessive decoded dimensions %s × %s",
    async (width, height) => {
      decoder(width, height);
      await expect(
        loadLocalRasterImage("data:image/png;base64,YQ=="),
      ).rejects.toThrow("Invalid image dimensions");
    },
  );
  it("rejects images that cannot decode", async () => {
    decoder(100, 100, true);
    await expect(
      loadLocalRasterImage("data:image/png;base64,YQ=="),
    ).rejects.toThrow("Unable to decode");
  });
});
