import { describe, expect, it } from "vitest";
import { formReturnDestination } from "./form-return-destination";

const page = "https://business.sponsor.krd/form/contact";
describe("form return destination", () => {
  it("returns a safe referrer without query or fragment", () => {
    expect(
      formReturnDestination(
        "https://www.tiktok.com/@business?token=private#video",
        page,
      ),
    ).toEqual({ href: "https://www.tiktok.com/@business", kind: "tiktok" });
    expect(
      formReturnDestination("https://business.sponsor.krd/", page)?.kind,
    ).toBe("source");
  });
  it.each([
    "",
    "invalid",
    "javascript:alert(1)",
    "https://name:password@example.com/",
    page,
  ])("does not offer an unsafe or self-return destination: %s", (referrer) => {
    expect(formReturnDestination(referrer, page)).toBeNull();
  });
  it("offers the TikTok website only for an explicit TikTok campaign fallback", () => {
    expect(formReturnDestination("", `${page}?utm_source=TikTok`)).toEqual({
      href: "https://www.tiktok.com/",
      kind: "open-tiktok",
    });
    expect(
      formReturnDestination("https://tiktok.com.evil.test/", page)?.kind,
    ).toBe("source");
  });
});
