import { describe, expect, it } from "vitest";
import {
  parseRootPublicLocale,
  resolveRootLegalLocale,
} from "./root-public-locale";
import { rootPublicCopy } from "./root-public-copy";
import { termsCopy, privacyCopy } from "./legal-copy";
import { rootOnboardingCopy } from "@/features/onboarding/root-onboarding-copy";

function keys(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value)
    .flatMap(([key, child]) => [
      key,
      ...keys(child).map((nested) => `${key}.${nested}`),
    ])
    .sort();
}

describe("root public English", () => {
  it("matches an explicit form language and falls back safely for invalid queries", () => {
    expect(resolveRootLegalLocale("en", "ar")).toBe("en");
    expect(resolveRootLegalLocale("ckb", "en")).toBe("ckb");
    expect(resolveRootLegalLocale("invalid", "ar")).toBe("ar");
    expect(resolveRootLegalLocale(["en", "ar"], undefined)).toBe("ckb");
  });
  it("accepts English and keeps an unknown visitor preference Kurdish", () => {
    expect(parseRootPublicLocale("en")).toBe("en");
    expect(parseRootPublicLocale("fr")).toBe("ckb");
  });

  it("provides translated public, onboarding, and legal content", () => {
    expect(keys(rootOnboardingCopy.ar)).toEqual(keys(rootOnboardingCopy.ckb));
    expect(keys(rootOnboardingCopy.en)).toEqual(keys(rootOnboardingCopy.ckb));
    expect(rootPublicCopy.en.hero.titleAccent).toBe("advertising management");
    expect(rootOnboardingCopy.en.auth.google).toBe("Continue with Google");
    expect(termsCopy.en.sections).toHaveLength(termsCopy.ckb.sections.length);
    expect(privacyCopy.en.sections).toHaveLength(
      privacyCopy.ckb.sections.length,
    );
  });
});
