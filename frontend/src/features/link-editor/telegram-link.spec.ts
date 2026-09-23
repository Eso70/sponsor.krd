import { describe, expect, it } from "vitest";
import { validateSingleLink } from "./components/validation";
import { generateUrl } from "./modal-utils";
import { normalizeTelegramLink } from "./telegram-link";

describe("Telegram destinations", () => {
  it.each([
    ["+4cr7ocQoV-liNmU6", "https://t.me/+4cr7ocQoV-liNmU6"],
    ["https://t.me/+4cr7ocQoV-liNmU6", "https://t.me/+4cr7ocQoV-liNmU6"],
    ["t.me/+4cr7ocQoV-liNmU6", "https://t.me/+4cr7ocQoV-liNmU6"],
    ["@example_user", "https://t.me/example_user"],
    ["https://t.me/example_user", "https://t.me/example_user"],
  ])("accepts %s and stores %s", (input, expected) => {
    expect(validateSingleLink("telegram", input)).toBeUndefined();
    expect(generateUrl("telegram", input)).toBe(expected);
  });

  it.each([
    "+bad!hash", "+abc", "https://evil.example/+4cr7ocQoV-liNmU6",
    "https://t.me/+4cr7ocQoV-liNmU6/another", "https://t.me/+4cr7ocQoV-liNmU6#fragment",
    "javascript:alert(1)",
  ])("rejects an invalid Telegram destination: %s", (input) => {
    expect(normalizeTelegramLink(input)).toBeNull();
    expect(validateSingleLink("telegram", input)).toBeDefined();
    expect(generateUrl("telegram", input)).toBe("");
  });
});
