export const CONVERSATION_CATEGORY_KEYS = [
  "account", "billing", "technical", "feature_request", "security", "verification", "other",
] as const;

type ConversationCategory = (typeof CONVERSATION_CATEGORY_KEYS)[number];
type ConversationLocale = "ckb" | "ar" | "en";

export const conversationCategoryCopy: Record<ConversationLocale, Record<ConversationCategory, string>> = {
  ckb: {
    account: "هەژمار", billing: "پارەدان", technical: "تەکنیکی",
    feature_request: "داواکاری تایبەتمەندی", security: "ئاسایش",
    verification: "پشتڕاستکردنەوە", other: "هیتر",
  },
  ar: {
    account: "الحساب", billing: "الفوترة", technical: "الدعم الفني",
    feature_request: "طلب ميزة", security: "الأمان",
    verification: "التحقق", other: "أخرى",
  },
  en: {
    account: "Account", billing: "Billing", technical: "Technical support",
    feature_request: "Feature request", security: "Security",
    verification: "Verification", other: "Other",
  },
};

export function conversationCategoryLabel(category: string, locale: ConversationLocale): string {
  return Object.prototype.hasOwnProperty.call(conversationCategoryCopy[locale], category)
    ? conversationCategoryCopy[locale][category as ConversationCategory]
    : category;
}
