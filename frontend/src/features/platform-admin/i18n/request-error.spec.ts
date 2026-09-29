import { describe, expect, it } from "vitest";
import { platformRequestError } from "./request-error";

describe("platformRequestError", () => {
  it("uses localized UI copy instead of an untranslated API message in Arabic", () => {
    expect(platformRequestError("Invalid request", "الطلب غير صالح", "ar")).toBe("الطلب غير صالح");
    expect(platformRequestError("پەیوەندی سەرکەوتوو نەبوو", "Could not connect", "en")).toBe("Could not connect");
  });

  it("preserves existing Kurdish-mode API details and handles missing messages", () => {
    expect(platformRequestError("Specific error", "هەڵە", "ckb")).toBe("Specific error");
    expect(platformRequestError(null, "هەڵە", "ckb")).toBe("هەڵە");
  });
});
