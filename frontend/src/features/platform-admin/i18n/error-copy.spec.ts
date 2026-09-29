import { describe, expect, it } from "vitest";
import { platformErrorCopy } from "./error-copy";

describe("platformErrorCopy", () => {
  it("uses Arabic for platform error pages without changing the Kurdish default", () => {
    expect(platformErrorCopy("notFound", "ar")).toMatchObject({
      title: "الصفحة غير موجودة",
      language: "ar",
      copy: { home: "الصفحة الرئيسية" },
    });
    expect(platformErrorCopy("unexpected", "ckb")).toMatchObject({
      title: "هەڵەیەک ڕوویدا",
      language: "ckb",
    });
    expect(platformErrorCopy("notFound", "en")).toMatchObject({
      title: "Page not found",
      language: "en",
      copy: { home: "Home page" },
    });
  });
});
