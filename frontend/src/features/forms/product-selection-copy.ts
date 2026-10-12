import type { FormLanguage } from "./types";
const labels = {
  invalidPrice: [
    "Use a price from 0 to 10,000,000, with up to 2 decimal places.",
    "نرخێک لە ٠ تا ١٠٬٠٠٠٬٠٠٠ بنووسە، تا ٢ ژمارە دوای خاڵ.",
    "استخدم سعرًا بين 0 و10,000,000، حتى منزلتين عشريتين.",
  ],
  title: ["Product selection", "هەڵبژاردنی بەرهەم", "اختيار المنتجات"],
  configurationError: [
    "Add at least one product with a name and a valid unit price before publishing.",
    "پێش بڵاوکردنەوە لانیکەم بەرهەمێک بە ناو و نرخێکی دروست زیاد بکە.",
    "أضف منتجًا واحدًا على الأقل باسم وسعر وحدة صالح قبل النشر.",
  ],
  name: ["Product name", "ناوی بەرهەم", "اسم المنتج"],
  unit: ["Unit", "یەکە", "الوحدة"],
  unitHint: ["Piece, kg, meter…", "دانە، کگ، مەتر…", "قطعة، كغ، متر…"],
  price: ["Unit price", "نرخی یەکە", "سعر الوحدة"],
  priceHint: ["Enter unit price", "نرخی یەکە بنووسە", "أدخل سعر الوحدة"],
  currency: ["Currency", "دراو", "العملة"],
  currencyIqd: [
    "Iraqi dinar (IQD)",
    "دیناری عێراقی (IQD)",
    "دينار عراقي (IQD)",
  ],
  currencyUsd: [
    "US dollar (USD)",
    "دۆلاری ئەمریکی (USD)",
    "دولار أمريكي (USD)",
  ],
  currencyEur: ["Euro (EUR)", "یۆرۆ (EUR)", "يورو (EUR)"],
  add: ["Add product", "زیادکردنی بەرهەم", "إضافة منتج"],
  remove: ["Remove product", "سڕینەوەی بەرهەم", "حذف المنتج"],
  quantity: ["Quantity", "بڕ", "الكمية"],
  total: ["Estimated total", "کۆی خەمڵێنراو", "الإجمالي التقديري"],
  lineTotal: ["Total", "کۆ", "الإجمالي"],
  empty: [
    "Add a product name and unit price to preview quantities and totals.",
    "ناوی بەرهەم و نرخی یەکە زیاد بکە بۆ پێشبینینی بڕ و کۆی نرخ.",
    "أضف اسم المنتج وسعر الوحدة لمعاينة الكميات والإجمالي.",
  ],
  invalidQuantity: [
    "Enter a quantity from 0 to 100,000, with up to 3 decimal places.",
    "بڕێک لە ٠ تا ١٠٠٬٠٠٠ بنووسە، تا ٣ ژمارە دوای خاڵ.",
    "أدخل كمية بين 0 و100,000، حتى 3 منازل عشرية.",
  ],
} satisfies Record<string, readonly [string, string, string]>;
export function productSelectionCopy(language: FormLanguage) {
  const index = language === "ckb" ? 1 : language === "ar" ? 2 : 0;
  return Object.fromEntries(
    Object.entries(labels).map(([key, text]) => [key, text[index]]),
  ) as { [K in keyof typeof labels]: string };
}
