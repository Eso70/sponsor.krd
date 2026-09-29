import { describe, expect, it } from "vitest";
import { businessTabTitle } from "./tab-title";

describe("businessTabTitle", () => {
  it("accepts the selected Business language without changing the business name", () => {
    expect(businessTabTitle("Example", "الإعدادات")).toBe("Example | الإعدادات");
    expect(businessTabTitle("Example", "ڕێکخستنەکان")).toBe("Example | ڕێکخستنەکان");
  });
});
