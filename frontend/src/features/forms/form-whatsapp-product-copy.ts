import type { FormLanguage } from "./types";
const copy = {
  en: {
    products: "Products",
    total: "Total",
    headers: ["Product", "Qty", "Unit\nprice", "Line\ntotal"],
  },
  ckb: {
    products: "بەرهەمەکان",
    total: "کۆی گشتی",
    headers: ["ناوی\nبەرهەم", "دانە", "نرخی\nدانە", "کۆی\nدانە"],
  },
  ar: {
    products: "المنتجات",
    total: "الإجمالي",
    headers: ["اسم\nالمنتج", "الكمية", "سعر\nالوحدة", "الإجمالي"],
  },
};
export const formWhatsAppProductCopy = (language: FormLanguage) =>
  copy[language];
