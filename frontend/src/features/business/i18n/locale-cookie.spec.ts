import { describe, expect, it } from "vitest";
import { businessLocaleFromCookie, readBusinessLocaleCookie } from "./locale-cookie";

describe("Business locale cookie", () => {
  it("accepts only supported language values", () => {
    expect(businessLocaleFromCookie("ar")).toBe("ar");
    expect(businessLocaleFromCookie("en")).toBe("en");
    expect(businessLocaleFromCookie("fr")).toBe("ckb");
    expect(readBusinessLocaleCookie("other=1;business_dashboard_locale=ar")).toBe("ar");
    expect(readBusinessLocaleCookie("business_dashboard_locale=invalid")).toBe("ckb");
  });
});
