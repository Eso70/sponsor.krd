import { describe, expect, it } from "vitest";
import { arabicAdvertisingEditorCopy, translateAdvertisingEditorText } from "./editor-copy";
import { arabicPublicAdvertisingCopy, translatePublicAdvertisingText } from "./public-locale";

const kurdishScript = /[\u0600-\u06ff]/;

describe("English business advertising controls", () => {
  it("covers every translated public advertising control", () => {
    for (const key of Object.keys(arabicPublicAdvertisingCopy)) {
      if (kurdishScript.test(key)) {
        expect(translatePublicAdvertisingText(key, "en"), key).not.toBe(key);
        expect(translatePublicAdvertisingText(key, "en"), key).not.toMatch(kurdishScript);
      }
    }
  });

  it("covers every translated business editor control", () => {
    for (const key of Object.keys(arabicAdvertisingEditorCopy)) {
      if (kurdishScript.test(key)) {
        expect(translateAdvertisingEditorText(key, "en"), key).not.toBe(key);
        expect(translateAdvertisingEditorText(key, "en"), key).not.toMatch(kurdishScript);
      }
    }
  });
});
