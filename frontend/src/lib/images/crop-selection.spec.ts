import { describe, expect, it } from "vitest";
import { moveCropFrame, resizeCropFrame, reframeCrop } from "./crop-selection";
import { cropGeometry, INITIAL_CROP } from "./image-crop";

const frame = { left: 100, top: 100, width: 300, height: 300 };
const bounds = { width: 800, height: 600 };
describe("manual crop selection", () => {
  it("resizes any rectangle independently with the opposite edges anchored", () => {
    expect(resizeCropFrame(frame, "nw", -50, 25, bounds)).toEqual({
      left: 50,
      top: 125,
      width: 350,
      height: 275,
    });
    expect(resizeCropFrame(frame, "e", 60, 0, bounds)).toEqual({
      ...frame,
      width: 360,
    });
  });
  it("constrains free resizing to stage bounds and minimum dimensions", () => {
    expect(resizeCropFrame(frame, "se", 999, 999, bounds)).toEqual({
      ...frame,
      width: 700,
      height: 500,
    });
    expect(resizeCropFrame(frame, "nw", 999, 999, bounds)).toEqual({
      left: 376,
      top: 376,
      width: 24,
      height: 24,
    });
  });
  it.each([1, 4 / 3, 16 / 9, 9 / 16])(
    "locks preset proportions %s while resizing",
    (ratio) => {
      const cropped = resizeCropFrame(frame, "se", 200, 300, bounds, ratio);
      expect(cropped.width / cropped.height).toBeCloseTo(ratio);
      expect(cropped.left).toBe(frame.left);
      expect(cropped.top).toBe(frame.top);
      expect(cropped.left + cropped.width).toBeLessThanOrEqual(bounds.width);
      expect(cropped.top + cropped.height).toBeLessThanOrEqual(bounds.height);
    },
  );
  it("moves the frame without changing its shape", () => {
    expect(moveCropFrame(frame, 999, -999, bounds)).toEqual({
      ...frame,
      left: 500,
      top: 0,
    });
  });
  it("keeps the source image stationary when the frame moves or shrinks", () => {
    const image = { width: 1600, height: 900 };
    const transform = { ...INITIAL_CROP, zoom: 2 };
    const next = { left: 150, top: 125, width: 250, height: 200 };
    const oldCrop = cropGeometry(image, frame, transform, false);
    const newCrop = cropGeometry(
      image,
      next,
      reframeCrop(image, frame, next, transform, false),
      false,
    );
    expect(next.left + newCrop.left).toBeCloseTo(frame.left + oldCrop.left);
    expect(next.top + newCrop.top).toBeCloseTo(frame.top + oldCrop.top);
    expect(newCrop.width).toBeCloseTo(oldCrop.width);
  });
  it("keeps the source scale when making a very small manual selection", () => {
    const image = { width: 1600, height: 900 };
    const next = { left: 200, top: 200, width: 24, height: 24 };
    const previous = cropGeometry(image, frame, INITIAL_CROP, false);
    const cropped = cropGeometry(
      image,
      next,
      reframeCrop(image, frame, next, INITIAL_CROP, false),
      false,
    );
    expect(cropped.width).toBeCloseTo(previous.width);
    expect(next.left + cropped.left).toBeCloseTo(frame.left + previous.left);
    expect(next.top + cropped.top).toBeCloseTo(frame.top + previous.top);
  });
});
