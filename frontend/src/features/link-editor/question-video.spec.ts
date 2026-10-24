import { describe, expect, it } from "vitest";
import { whatsappQuestionMessage } from "@linktree/types/whatsapp-question.cjs";
import { validateWhatsappQuestion } from "./components/validation";

describe("question video messages", () => {
  it("adds the video URL without changing existing messages or their URLs", () => {
    const url = "https://www.tiktok.com/@shop/video/123?lang=en";
    expect(whatsappQuestionMessage({ message: "Order this product", videoUrl: url })).toBe(`Order this product\n\n${url}`);
    expect(whatsappQuestionMessage({ message: "Old message" })).toBe("Old message");
    expect(whatsappQuestionMessage({ message: "Old message", videoUrl: "javascript:alert(1)" })).toBe("Old message");
  });
  it("flags unsafe video links without making video links required", () => {
    expect(validateWhatsappQuestion({ text: "Order", message: "Hello", videoUrl: "not a URL" })).toHaveProperty("videoUrl");
    expect(validateWhatsappQuestion({ text: "Order", message: "Hello" })).toBeUndefined();
  });
});
