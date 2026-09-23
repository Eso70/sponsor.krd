import { describe, expect, it } from "vitest";
import { appendMessageToUrl } from "./message-url";

describe("Telegram message URLs", () => {
  it("does not alter a private invite", () => {
    const invite = "https://t.me/+4cr7ocQoV-liNmU6";
    expect(appendMessageToUrl(invite, "telegram", "Hello")).toBe(invite);
  });

  it("still appends a message for a public username", () => {
    expect(appendMessageToUrl("https://t.me/example_user", "telegram", "Hello"))
      .toBe("https://t.me/example_user?start=Hello");
  });
});
