const en = {
  preview: "Preview",
  close: "Close",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  options: "Options",
  next: "Next",
  back: "Back",
  banner: "Banner image",
  logo: "Logo",
};
const ckb = {
  preview: "پێشبینین",
  close: "داخستن",
  zoomIn: "گەورەکردن",
  zoomOut: "بچووککردنەوە",
  options: "هەڵبژاردەکان",
  next: "دواتر",
  back: "پێشوو",
  banner: "وێنەی بانەر",
  logo: "لۆگۆ",
};
const ar = {
  preview: "معاينة",
  close: "إغلاق",
  zoomIn: "تكبير",
  zoomOut: "تصغير",
  options: "الخيارات",
  next: "التالي",
  back: "السابق",
  banner: "صورة الغلاف",
  logo: "الشعار",
};
export type ImageMediaCopy = { [K in keyof typeof en]: string };
/** Small shared gallery/viewer catalog; public templates need no form-builder copy. */
export function imageMediaCopy(locale: string): ImageMediaCopy {
  return locale === "en" ? en : locale === "ar" ? ar : ckb;
}
