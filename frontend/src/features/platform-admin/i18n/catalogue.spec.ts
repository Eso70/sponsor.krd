import { describe, expect, it } from "vitest";
import { platformCopy } from "./copy";
import { platformAnalyticsCopy } from "./analytics-copy";
import { platformEditCopy } from "./edit-copy";
import { platformLinktreesCopy } from "./linktrees-copy";
import { platformLoadingCopy } from "./loading-copy";
import { platformSessionCopy } from "./session-copy";
import { campaignCopy } from "@/features/campaigns/campaign-copy";
import { accessCopy } from "@/features/platform-admin/components/access-control/access-copy";
import { parsePlatformLocale } from "./locale";

function keys(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [key, ...keys(child).map((nested) => `${key}.${nested}`)]).sort();
}

describe("platform administrator language catalogues", () => {
  it("recognizes the saved English preference", () => {
    expect(parsePlatformLocale("en")).toBe("en");
    expect(parsePlatformLocale("fr")).toBe("ckb");
  });

  it.each([
    platformCopy, platformAnalyticsCopy, platformEditCopy, platformLinktreesCopy,
    platformLoadingCopy, platformSessionCopy, campaignCopy, accessCopy,
  ])("has the same English, Arabic, and Kurdish keys", (catalogue) => {
    expect(keys(catalogue.en)).toEqual(keys(catalogue.ar));
    expect(keys(catalogue.en)).toEqual(expect.arrayContaining(keys(catalogue.ckb)));
  });
});
