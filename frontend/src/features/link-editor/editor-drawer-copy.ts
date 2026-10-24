import type { BusinessLocale } from "@/features/business/i18n/messages";

const labels = {
  linkName: ["Button text", "دەقی دوگمە", "نص الزر"],
  linkDestination: ["Link or number", "لینک یان ژمارە", "الرابط أو الرقم"],
  preview: ["Live preview", "پێشبینینی ڕاستەوخۆ", "معاينة مباشرة"],
  theme: ["Theme", "ڕووکار", "المظهر"],
  color: ["Color", "ڕەنگ", "اللون"],
  light: ["Light", "ڕووناک", "فاتح"],
  dark: ["Dark", "تاریک", "داكن"],
  custom: ["Custom", "ئارەزوومەندانە", "مخصص"],
  customBackground: ["Custom background", "باكگڕاوندی ئارەزوومەندانە", "خلفية مخصصة"],
  image: ["Image", "وێنە", "صورة"],
  backgroundImage: ["Background image", "وێنەی باکگڕاوند", "صورة الخلفية"],
  removeBackgroundImage: ["Remove background image", "لابردنی وێنەی باکگڕاوند", "إزالة صورة الخلفية"],
  loadingInformation: ["Loading page information", "زانیاریی پەیج بار دەکرێت", "جارٍ تحميل معلومات الصفحة"],
} satisfies Record<string, readonly [string, string, string]>;

export function editorDrawerCopy(locale: BusinessLocale) {
  const index = locale === "en" ? 0 : locale === "ar" ? 2 : 1;
  return Object.fromEntries(Object.entries(labels).map(([key, values]) => [key, values[index]])) as { [K in keyof typeof labels]: string };
}
