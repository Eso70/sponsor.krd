import type { BusinessLocale } from "@/features/business/i18n/messages";
/** Shared visual week order; saved selections retain their original values. */
export const LINKTREE_DISPLAY_WEEKDAYS = ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"] as const;
const text = {
  section: ["Search & page details", "گەڕان و وردەکاریی پەڕە", "البحث وتفاصيل الصفحة"],
  category: ["Category", "پۆل", "الفئة"], type: ["Business type", "جۆری کار", "نوع النشاط"],
  customCategory: ["Custom category", "پۆلی تایبەت", "فئة مخصصة"], none: ["Not selected", "هەڵنەبژێردراوە", "غير محدد"],
  title: ["SEO title", "سەردێڕی گەڕان", "عنوان البحث"], description: ["SEO description", "وەسفی گەڕان", "وصف البحث"],
  indexing: ["Search visibility", "دەرکەوتن لە گەڕان", "الظهور في البحث"], auto: ["Automatic", "خۆکار", "تلقائي"],
  noindex: ["Hide from search engines", "شاردنەوە لە بزوێنەرەکانی گەڕان", "إخفاء من محركات البحث"],
  language: ["Page language", "زمانی پەڕە", "لغة الصفحة"], image: ["Social preview image", "وێنەی هاوبەشکردن", "صورة المشاركة"],
  preview: ["Search preview", "پێشبینینی گەڕان", "معاينة البحث"], defaults: ["Uses Information automatically. Edit to customize.", "زانیارییەکان بە خۆکار بەکاردەهێنێت. بۆ گۆڕانکاری دەستکاری بکە.", "تُستخدم المعلومات تلقائيًا. عدّلها للتخصيص."],
  useInformation: ["Use Information", "بەکارهێنانی زانیارییەکان", "استخدام المعلومات"],
  details: ["Business details", "وردەکاریی کار", "تفاصيل النشاط"], street: ["Street address", "ناونیشانی شەقام", "عنوان الشارع"],
  city: ["City", "شار", "المدينة"], country: ["Country", "وڵات", "البلد"],
  serviceArea: ["Service area", "ناوچەی خزمەتگوزاری", "منطقة الخدمة"], services: ["Services", "خزمەتگوزارییەکان", "الخدمات"],
  cuisine: ["Cuisine", "جۆری خواردن", "نوع المطبخ"], hours: ["Opening hours", "کاتەکانی کارکردن", "ساعات العمل"],
  opens: ["Opens", "کردنەوە", "يفتح"], closes: ["Closes", "داخستن", "يغلق"],
  invalid: ["Check this field", "ئەم خانەیە بپشکنە", "تحقق من هذا الحقل"],
  invalidSettings: ["Check the page details and SEO settings", "وردەکاریی پەڕە و ڕێکخستنەکانی گەڕان بپشکنە", "تحقق من تفاصيل الصفحة وإعدادات البحث"],
  Mo: ["Monday", "دووشەممە", "الاثنين"], Tu: ["Tuesday", "سێشەممە", "الثلاثاء"], We: ["Wednesday", "چوارشەممە", "الأربعاء"],
  Th: ["Thursday", "پێنجشەممە", "الخميس"], Fr: ["Friday", "هەینی", "الجمعة"], Sa: ["Saturday", "شەممە", "السبت"], Su: ["Sunday", "یەکشەممە", "الأحد"],
} as const;
export function linktreeSeoCopy(locale: BusinessLocale) {
  const index = locale === "en" ? 0 : locale === "ar" ? 2 : 1;
  return Object.fromEntries(Object.entries(text).map(([key, value]) => [key, value[index]])) as Record<keyof typeof text, string>;
}
