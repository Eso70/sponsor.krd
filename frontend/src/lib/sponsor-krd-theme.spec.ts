import { describe, expect, it } from "vitest";
import {
  createSponsorKrdThemeVariables,
  SPONSOR_KRD_ACCENT_GRADIENT,
} from "@/lib/sponsor-krd-theme";

describe("Sponsor.krd platform theme variables", () => {
  it("keeps the default platform identity as the shared two-stop gradient", () => {
    const variables = createSponsorKrdThemeVariables();

    expect(variables["--sponsor-krd-brand-gradient"]).toBe(
      SPONSOR_KRD_ACCENT_GRADIENT,
    );
    expect(variables["--sponsor-krd-accent-gradient"]).toBe(
      SPONSOR_KRD_ACCENT_GRADIENT,
    );
  });

  it("updates scoped surfaces and portals from the same configured value", () => {
    const variables = createSponsorKrdThemeVariables(
      "gradient:to-br:#2563eb:#7c3aed",
    );

    expect(variables["--sponsor-krd-brand-accent"]).toBe("#2563eb");
    expect(variables["--sponsor-krd-accent"]).toBe("#2563eb");
    expect(variables["--sponsor-krd-brand-gradient"]).toBe(
      variables["--sponsor-krd-accent-gradient"],
    );
    expect(variables["--sponsor-krd-accent-ink"]).toBe("#ffffff");
  });
});
