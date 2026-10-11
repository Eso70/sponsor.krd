import { describe, expect, it } from "vitest";
import { normalizeTemplateConfig, TEMPLATE_OPTIONS } from "./config";

describe("Linktree template catalog", () => {
  it.each([undefined, false, "true", 1, null])("keeps the verification badge off without a boolean opt-in (%s)", (value) => {
    expect(normalizeTemplateConfig("spectrum", { verification_badge: value }).verification_badge).toBe(false);
  });
  it("preserves the badge when changing templates", () => {
    expect(normalizeTemplateConfig("frost", { verification_badge: true }).verification_badge).toBe(true);
  });
  it("uses unique stable identifiers and scalable product names", () => {
    const ids = TEMPLATE_OPTIONS.map((template) => template.id);
    const names = TEMPLATE_OPTIONS.map((template) => template.name);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
    expect(ids).toEqual([
      "spectrum",
      "spotlight",
      "frost",
      "aurora",
      "serenity",
      "branch-signal",
    ]);
    expect(names).toEqual([
      "Spectrum",
      "Spotlight",
      "Frost",
      "Aurora",
      "Serenity",
      "Branch Signal",
    ]);
  });
});
