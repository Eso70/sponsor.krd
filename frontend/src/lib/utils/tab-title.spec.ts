import { describe, expect, it } from "vitest";
import { businessTabTitle } from "./tab-title";

describe("businessTabTitle", () => {
  it("accepts the selected Business language without changing the business name", () => {
    expect(businessTabTitle("Example", "الإعدادات")).toBe("الإعدادات | Example");
    expect(businessTabTitle("Example", "ڕێکخستنەکان")).toBe("ڕێکخستنەکان | Example");
  });
});

it("keeps page identity first and bounds Unicode titles", () => {
  expect(businessTabTitle("Acme", "Forms")).toBe("Forms | Acme");
  expect(Array.from(businessTabTitle("Long business ".repeat(20), "Long section ".repeat(20))).length).toBeLessThanOrEqual(60);
  expect(businessTabTitle("Acme", "Acme")).toBe("Acme");
});
