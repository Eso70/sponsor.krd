import { describe, it, expect } from "vitest";
import { readAnalyticsTotals } from "./analytics-totals";
describe("real analytics summary boundary", () => {
  it("retains server totals without adding per-page uniques or capping repeated clicks", () => {
    expect(
      readAnalyticsTotals({
        total_views: 100,
        unique_views: 27,
        total_clicks: 150,
        unique_clicks: 12,
      }),
    ).toMatchObject({
      total_views: 100,
      unique_views: 27,
      total_clicks: 150,
      unique_clicks: 12,
    });
    expect(
      readAnalyticsTotals({
        total_views: 0,
        unique_views: 0,
        total_clicks: 0,
        unique_clicks: 0,
      }).total_views,
    ).toBe(0);
  });
  it.each([
    undefined,
    null,
    {},
    { total_views: 20, unique_views: 10 },
    { total_views: -1, unique_views: 10, total_clicks: 1 },
    { total_views: 20, unique_views: NaN, total_clicks: 1 },
  ])(
    "rejects missing or invalid counters rather than inventing zeroes",
    (input) => {
      expect(() => readAnalyticsTotals(input)).toThrow(
        "Invalid analytics summary",
      );
    },
  );
});
