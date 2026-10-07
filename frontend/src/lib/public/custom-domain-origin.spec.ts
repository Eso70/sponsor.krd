import { describe, expect, it } from "vitest";
import { resolvePublicOrigin } from "./public-origin";
describe("verified public domain origins", () => {
  it("rejects an arbitrary supplied host without a backend mapping", () => {
    expect(
      resolvePublicOrigin("wafaye.com", "sponsor.krd", "https://sponsor.krd"),
    ).toBeNull();
  });
  it("uses the verified primary origin for canonical URLs and the existing tenant", () => {
    expect(
      resolvePublicOrigin(
        "www.wafaye.com",
        "sponsor.krd",
        "https://sponsor.krd",
        {
          hostname: "www.wafaye.com",
          primaryHostname: "wafaye.com",
          subdomain: "wafaye",
          isCustom: true,
        },
      ),
    ).toEqual({
      isPlatformRoot: false,
      subdomain: "wafaye",
      origin: "https://wafaye.com",
    });
  });
  it("uses the default origin until the custom domain is made primary", () => {
    expect(
      resolvePublicOrigin("wafaye.com", "sponsor.krd", "https://sponsor.krd", {
        hostname: "wafaye.com",
        primaryHostname: null,
        subdomain: "wafaye",
        isCustom: true,
      })?.origin,
    ).toBe("https://wafaye.sponsor.krd");
  });
});
