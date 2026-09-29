import { describe, expect, it } from "vitest";
import { ARABIC_TEXT, settingsText } from "./use-settings-text";

describe("platform settings text", () => {
  it("has Kurdish copy for every English-source phrase except product field names", () => {
    const technicalLabels = new Set(["Long-Term Access Token", "TikTok App ID", "TikTok App Secret"]);
    for (const source of Object.keys(ARABIC_TEXT)) {
      if (/^[\x20-\x7E…]+$/.test(source) && !technicalLabels.has(source)) {
        expect(settingsText(source, "ckb"), source).not.toBe(source);
      }
    }
  });

  it.each([
    ["Loading saved settings…", "ڕێکخستنە پاشەکەوتکراوەکان بار دەکرێن…", "جارٍ تحميل الإعدادات المحفوظة…"],
    ["No active sessions found.", "هیچ دانیشتنێکی چالاک نەدۆزرایەوە.", "لا توجد جلسات نشطة."],
    ["General settings saved", "ڕێکخستنە گشتییەکان پاشەکەوت کران", "تم حفظ الإعدادات العامة"],
    ["Unable to save settings", "پاشەکەوتکردنی ڕێکخستنەکان سەرکەوتوو نەبوو", "تعذّر حفظ الإعدادات"],
    ["Advertiser ID:", "ناسنامەی ڕیکلامدەر:", "معرّف المعلن:"],
    ["Business Center ID:", "ناسنامەی Business Center:", "معرّف مركز الأعمال:"],
    ["Direct API Token", "تۆکنی ڕاستەوخۆی API", "رمز API مباشر"],
  ])("translates %s in all three languages", (source, kurdish, arabic) => {
    expect(settingsText(source, "ckb")).toBe(kurdish);
    expect(settingsText(source, "ar")).toBe(arabic);
    expect(settingsText(source, "en")).toBe(source);
  });
});
