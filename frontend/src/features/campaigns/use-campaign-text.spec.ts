import { describe, expect, it } from "vitest";
import { ARABIC_TEXT, campaignText } from "./use-campaign-text";

describe("campaign editor text", () => {
  it("has Kurdish copy for every English-source campaign phrase", () => {
    for (const source of Object.keys(ARABIC_TEXT)) {
      if (/^[\x20-\x7E…]+$/.test(source)) {
        expect(campaignText(source, "ckb"), source).not.toBe(source);
      }
    }
  });

  it.each([
    ["Campaign structure", "پێکهاتەی کەمپەین", "هيكل الحملة"],
    ["Daily budget", "بودجەی ڕۆژانە", "الميزانية اليومية"],
    ["Audience targeting and placement", "ئامانجکردنی بینەر و شوێنی پیشاندان", "استهداف الجمهور وموضع الإعلان"],
    ["Interactive add-ons", "زیادکراوە کارلێکییەکان", "الإضافات التفاعلية"],
    ["Advertiser ID:", "ناسنامەی ڕیکلامدەر:", "معرّف المعلن:"],
  ])("translates %s in every supported language", (source, kurdish, arabic) => {
    expect(campaignText(source, "ckb")).toBe(kurdish);
    expect(campaignText(source, "ar")).toBe(arabic);
    expect(campaignText(source, "en")).toBe(source);
  });
});
