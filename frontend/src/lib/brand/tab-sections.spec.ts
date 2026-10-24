import { describe, expect, it } from "vitest";
import { privateTabTitle } from "./tab-sections";
import { PLATFORM_ADMIN_PAGES } from "@/features/platform-admin/platform-pages";
describe("private route title coverage", () => {
  it.each(["en", "ckb", "ar"] as const)("names all business and platform sections in %s", (locale) => {
    const pages = new Set([...PLATFORM_ADMIN_PAGES, "pages", "tiktok-config", "profile", "login", "workspace-entry", "consume", "getting-started"]);
    for (const page of pages) {
      const title = privateTabTitle(page, "Acme", locale);
      expect(title).toMatch(/ \| Acme$/);
      expect(title.split(" | ")[0].length).toBeGreaterThan(0);
      expect(Array.from(title).length).toBeLessThanOrEqual(60);
    }
  });
});
