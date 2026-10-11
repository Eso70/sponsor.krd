import { afterEach, describe, expect, it, vi } from "vitest";
import {
  INITIAL_CROP,
  cropGeometry,
  cropOutputSize,
  drawImageCrop,
  exportImageCrop,
  loadCropImage,
} from "./image-crop";

describe("native image cropping", () => {
  afterEach(() => vi.restoreAllMocks());
  it("centers a landscape image in a square crop and prevents blank edges", () => {
    const image = { width: 1600, height: 900 };
    const frame = { width: 720, height: 720 };
    const geometry = cropGeometry(image, frame, INITIAL_CROP, false);
    expect(geometry).toMatchObject({
      width: 1280,
      height: 720,
      left: -280,
      top: 0,
      minZoom: 1,
    });
    const edge = cropGeometry(
      image,
      frame,
      { zoom: 0.1, x: 10, y: -10 },
      false,
    );
    expect(edge.left).toBeCloseTo(0);
    expect(edge.top).toBeCloseTo(0);
    expect(edge.transform.zoom).toBe(1);
  });
  it("allows fit with blurred fill and caps zoom and panning", () => {
    const geometry = cropGeometry(
      { width: 1600, height: 900 },
      { width: 720, height: 720 },
      { zoom: 0, x: 0, y: 0 },
      true,
    );
    expect(geometry).toMatchObject({
      width: 720,
      height: 405,
      left: 0,
      top: 157.5,
    });
    expect(
      cropGeometry(
        { width: 900, height: 1600 },
        { width: 720, height: 720 },
        { zoom: 99, x: 99, y: -99 },
        true,
      ).transform,
    ).toEqual({ zoom: 32, x: 0.5, y: -0.5 });
  });
  it("keeps the crop independent of viewport size and bounds export dimensions", () => {
    const source = { width: 900, height: 1600 };
    const transform = { zoom: 2, x: 0.15, y: -0.2 };
    const small = cropGeometry(
      source,
      { width: 300, height: 300 },
      transform,
      false,
    );
    const large = cropGeometry(
      source,
      { width: 720, height: 720 },
      transform,
      false,
    );
    expect(small.transform).toEqual(large.transform);
    expect(small.left / 300).toBeCloseTo(large.left / 720);
    expect(cropOutputSize(16 / 9)).toEqual({ width: 1440, height: 810 });
    expect(cropOutputSize(0.5)).toEqual({ width: 720, height: 1440 });
    expect(cropOutputSize(1, 720)).toEqual({ width: 720, height: 720 });
  });
  it.each([
    "https://example.com/image.png",
    "data:image/svg+xml;base64,YQ==",
    "/api/secrets",
  ])("rejects unsafe or remote crop sources: %s", async (src) => {
    await expect(loadCropImage(src)).rejects.toThrow(
      "Invalid local image source",
    );
  });
  it("draws a blurred cover behind the foreground without leaking canvas state", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      getImageData: (
        _x: number,
        _y: number,
        width: number,
        height: number,
      ) => ({ data: new Uint8ClampedArray(width * height * 4) }),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const context = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn(),
      filter: "none",
    };
    const image = {
      naturalWidth: 1600,
      naturalHeight: 900,
    } as HTMLImageElement;
    drawImageCrop(
      context as unknown as CanvasRenderingContext2D,
      image,
      { width: 720, height: 720 },
      { zoom: 0.5625, x: 0, y: 0 },
      true,
    );
    expect(context.drawImage).toHaveBeenCalledTimes(2);
    expect(context.drawImage).toHaveBeenLastCalledWith(
      image,
      0,
      157.5,
      720,
      405,
    );
    expect(context.filter).toBe("none");
    expect(context.restore).toHaveBeenCalled();
  });
  it("exports a PNG raster and rejects encoder failures", async () => {
    const context = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn(),
    };
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation((callback) =>
        callback(new Blob(["raster"], { type: "image/png" })),
      );
    try {
      const file = await exportImageCrop(
        { naturalWidth: 1600, naturalHeight: 900 } as HTMLImageElement,
        1,
        INITIAL_CROP,
        false,
        720,
      );
      expect(file).toMatchObject({
        name: "crop.png",
        type: "image/png",
        size: 6,
      });
      toBlob.mockImplementation((callback) => callback(null));
      await expect(
        exportImageCrop(
          { naturalWidth: 900, naturalHeight: 900 } as HTMLImageElement,
          1,
          INITIAL_CROP,
          false,
        ),
      ).rejects.toThrow("Unable to encode");
    } finally {
      getContext.mockRestore();
      toBlob.mockRestore();
    }
  });
  it("keeps transparent output within the upload limit when WebP encoding falls back to PNG", async () => {
    const context = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    const large = new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], {
      type: "image/png",
    });
    const encode = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementationOnce((callback) => callback(large))
      .mockImplementationOnce((callback) => callback(large))
      .mockImplementationOnce((callback) =>
        callback(new Blob(["smaller"], { type: "image/png" })),
      );
    const file = await exportImageCrop(
      { naturalWidth: 1440, naturalHeight: 1440 } as HTMLImageElement,
      1,
      INITIAL_CROP,
      false,
    );
    expect(file).toMatchObject({
      type: "image/png",
      name: "crop.png",
      size: 7,
    });
    expect(encode).toHaveBeenCalledTimes(3);
    expect(context.drawImage).toHaveBeenLastCalledWith(
      expect.anything(),
      0,
      0,
      1080,
      1080,
    );
  });
});
