import { describe, expect, it } from "vitest";
import { translateAdvertisingEditorText } from "./editor-copy";

describe("Business advertising editor copy", () => {
  it("translates editor controls without rewriting saved content", () => {
    expect(translateAdvertisingEditorText("پاکێجەکان", "ar")).toBe("الباقات");
    expect(translateAdvertisingEditorText("پاکێجەکان", "ckb")).toBe("پاکێجەکان");
    expect(translateAdvertisingEditorText("My saved campaign", "ar")).toBe("My saved campaign");
  });
});
