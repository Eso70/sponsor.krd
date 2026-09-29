import { describe, expect, it } from "vitest";
import {
  BUSINESS_PUBLIC_LOCALE_COOKIE,
  publicBusinessLocale,
  rememberPublicBusinessLocale,
} from "./public-locale";

describe("public business visitor language", () => {
  it("defaults unknown cookie values to Kurdish", () => {
    expect(publicBusinessLocale(undefined)).toBe("ckb");
    expect(publicBusinessLocale("invalid")).toBe("ckb");
    expect(publicBusinessLocale("ar")).toBe("ar");
    expect(publicBusinessLocale("en")).toBe("en");
  });

  it("stores a host-only visitor hint separate from the Dashboard language", () => {
    rememberPublicBusinessLocale("ar");
    expect(document.cookie).toContain(`${BUSINESS_PUBLIC_LOCALE_COOKIE}=ar`);
    expect(document.cookie).not.toContain("business_dashboard_locale");
    document.cookie = `${BUSINESS_PUBLIC_LOCALE_COOKIE}=; Path=/; Max-Age=0`;
  });
});
