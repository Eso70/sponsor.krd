import { describe, expect, it } from "vitest";
import { platformLoadingCopy } from "./loading-copy";

describe("platform loading copy", () => {
  it("has Arabic labels for the dashboard and login loading boundaries", () => {
    expect(platformLoadingCopy.ar.loading).toBe("جارٍ التحميل");
    expect(platformLoadingCopy.en.loading).toBe("Loading");
    expect(platformLoadingCopy.ckb.loading).toBe("بارکردن");
    expect(platformLoadingCopy.ar.businessDirectory).toContain("تحميل");
    expect(platformLoadingCopy.ar.login).toContain("تحميل");
    expect(platformLoadingCopy.ar.loginDescription).toContain("المنصة");
  });
});
