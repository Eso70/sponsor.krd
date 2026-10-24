import { describe, expect, it } from "vitest";
import { readTikTokSummary } from "./tiktok-summary";

describe("TikTok summary data", () => {
  it("keeps a real zero distinct from missing data", () => {
    expect(readTikTokSummary({ delivered: 0, deliveryRate: 0 })).toEqual({ delivered: 0, deliveryRate: 0 });
  });
  it.each([null, {}, { delivered: -1, deliveryRate: 50 }, { delivered: 3, deliveryRate: NaN }, { delivered: 3, deliveryRate: 101 }])("rejects missing or invalid reporting: %s", (input) => {
    expect(() => readTikTokSummary(input)).toThrow();
  });
});
