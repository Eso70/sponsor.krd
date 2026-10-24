import { describe, expect, it } from "vitest";
import { readFormMetrics } from "./form-metrics";

describe("form overview metrics", () => {
  it("preserves the owner-wide total independently of a listing page", () => {
    expect(readFormMetrics({ totalForms: 42, views: 8, visitors: 4, starts: 2, submissions: 1 }).totalForms).toBe(42);
  });
  it("keeps a missing total unavailable rather than inventing a page-size total", () => {
    expect(readFormMetrics({ views: 0, visitors: 0, starts: 0, submissions: 0 }).totalForms).toBeUndefined();
  });
  it.each([{}, { views: 0, visitors: -1, starts: 0, submissions: 0 }, { views: NaN, visitors: 0, starts: 0, submissions: 0 }])("rejects invalid aggregate data: %s", (input) => {
    expect(() => readFormMetrics(input)).toThrow();
  });
});
