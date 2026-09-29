import { describe, expect, it } from "vitest";
import { CONVERSATION_CATEGORY_KEYS, conversationCategoryLabel } from "./conversation-categories";

describe("conversation category labels", () => {
  it("provides a non-code label for each category in every supported language", () => {
    for (const locale of ["ckb", "ar", "en"] as const) {
      for (const category of CONVERSATION_CATEGORY_KEYS) {
        expect(conversationCategoryLabel(category, locale)).not.toBe(category);
      }
    }
  });

  it("leaves unknown categories visible", () => {
    expect(conversationCategoryLabel("unknown", "ar")).toBe("unknown");
  });
});
