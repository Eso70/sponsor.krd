import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { readableInk } from "./parse-website-color";

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((channel) => parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

describe("readable control ink", () => {
  it.each([
    ["#000", "#ffffff"],
    ["#fff", "#111827"],
    ["#123456", "#ffffff"],
    ["#777777", "#000000"],
    ["#ff0000", "#000000"],
    ["#25F4EE", "#111827"],
  ])("chooses readable ink on %s", (background, expected) => {
    expect(readableInk(background)).toBe(expected);
  });

  it("meets 4.5:1 normal-text contrast for arbitrary solid tenant colors", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffff }), (rgb) => {
        const background = `#${rgb.toString(16).padStart(6, "0")}`;
        const a = luminance(background),
          b = luminance(readableInk(background));
        expect(
          (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        ).toBeGreaterThanOrEqual(4.5);
      }),
      { numRuns: 1500 },
    );
  });
});
