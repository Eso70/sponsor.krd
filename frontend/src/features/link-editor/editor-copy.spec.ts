import { describe, expect, it } from "vitest";
import { arabicEditorCopy, englishEditorCopy, getEditorPlatformName, localizeEditorUploadError, localizeEditorValidationError } from "./editor-copy";
import { validateLinktreeName, validateSingleLink } from "./components/validation";
import { createInlineRequestError } from "@/lib/api/inline-request-error";

describe("Business Linktree editor copy", () => {
  it("provides English for every Arabic editor control", () => {
    for (const key of Object.keys(arabicEditorCopy) as Array<keyof typeof arabicEditorCopy>) {
      expect(englishEditorCopy).toHaveProperty(key);
    }
  });
  it("translates validation without changing the shared Kurdish default", () => {
    const error = validateLinktreeName("");
    expect(error).toBe("تکایە ناو بنووسە");
    expect(localizeEditorValidationError(error, arabicEditorCopy)).toBe("يرجى إدخال الاسم");
    expect(localizeEditorValidationError(error)).toBe(error);
  });

  it("translates platform link validation, including private Telegram invites", () => {
    const error = validateSingleLink("telegram", "+bad!");
    expect(localizeEditorValidationError(error, arabicEditorCopy))
      .toContain("رابط تيليجرام غير صالح");
  });

  it("keeps Platform's Kurdish names while Business uses Arabic", () => {
    expect(getEditorPlatformName("telegram")).toBe("تیلیگڕام");
    expect(getEditorPlatformName("telegram", arabicEditorCopy)).toBe("تيليجرام");
  });

  it("translates upload failures only in the Business Arabic editor", () => {
    const error = createInlineRequestError(413, "قەبارەی فایلەکە نابێت لە 10MB زیاتر بێت.");
    expect(localizeEditorUploadError(error)).toBe(error);
    expect(localizeEditorUploadError(error, arabicEditorCopy)).toMatchObject({
      title: "حجم الملف كبير",
      message: "يجب ألا يتجاوز حجم الملف 10MB.",
    });
  });
});
