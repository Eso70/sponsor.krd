import { describe, expect, it } from "vitest";
import { gaussianBlurPixels } from "./gaussian-blur";

describe("portable Gaussian background", () => {
  it("preserves solid colors and opaque alpha at every edge", () => {
    const data = new Uint8ClampedArray(
      Array.from({ length: 25 }, () => [40, 100, 200, 255]).flat(),
    );
    expect(gaussianBlurPixels(data, 5, 5)).toEqual(data);
  });
  it("smooths sharp boundaries without mutating source pixels", () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255,
    ]);
    const result = gaussianBlurPixels(data, 3, 1);
    expect(result[0]).toBeGreaterThan(0);
    expect(result[4]).toBeLessThan(255);
    expect(data[4]).toBe(255);
    expect(result[3]).toBe(255);
  });
  it("uses premultiplied alpha to avoid color halos in transparent images", () => {
    const result = gaussianBlurPixels(
      new Uint8ClampedArray([255, 0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0]),
      3,
      1,
    );
    expect(result[0]).toBe(0);
    expect(result[2]).toBe(255);
    expect(result[3]).toBeGreaterThan(0);
    expect(result[3]).toBeLessThan(255);
  });
});
