import type { FormLanguage } from "./types";

const labels = {
  "created": [
    "Form created",
    "فۆڕم دروست کرا",
    "تم إنشاء النموذج"
  ],
  "saved": [
    "Form saved",
    "فۆڕم پاشەکەوت کرا",
    "تم حفظ النموذج"
  ],
  "activated": [
    "Form activated",
    "فۆڕم چالاک کرا",
    "تم تفعيل النموذج"
  ],
  "paused": [
    "Form paused",
    "فۆڕم ڕاگیرا",
    "تم إيقاف النموذج مؤقتًا"
  ],
  "archived": [
    "Form archived",
    "فۆڕم ئەرشیف کرا",
    "تمت أرشفة النموذج"
  ],
  "restored": [
    "Form restored",
    "فۆڕم گەڕێنرایەوە",
    "تمت استعادة النموذج"
  ],
  "deleted": [
    "Form deleted",
    "فۆڕم سڕایەوە",
    "تم حذف النموذج"
  ],
  "refreshed": [
    "Data refreshed",
    "داتا نوێ کرایەوە",
    "تم تحديث البيانات"
  ],
  "exported": [
    "CSV exported",
    "فایلی CSV هەناردە کرا",
    "تم تصدير CSV"
  ],
  "cleared": [
    "All form data deleted",
    "هەموو داتای فۆڕم سڕایەوە",
    "تم حذف جميع بيانات النموذج"
  ],
  "submitted": [
    "Response sent successfully",
    "وەڵام بە سەرکەوتوویی نێردرا",
    "تم إرسال الرد بنجاح"
  ],
  "imageSelected": [
    "Image added. Save the form to keep it.",
    "وێنە زیاد کرا. فۆڕمەکە پاشەکەوت بکە.",
    "تمت إضافة الصورة. احفظ النموذج للاحتفاظ بها."
  ],
  "cropApplied": [
    "Crop applied. Save the form to keep it.",
    "بڕینی وێنە جێبەجێ کرا. فۆڕمەکە پاشەکەوت بکە.",
    "تم تطبيق القص. احفظ النموذج للاحتفاظ به."
  ]
} satisfies Record<string, readonly [string, string, string]>;

export function formNotificationsCopy(language: FormLanguage) {
  const index = language === "en" ? 0 : language === "ar" ? 2 : 1;
  return Object.fromEntries(Object.entries(labels).map(([key, values]) => [key, values[index]])) as { [K in keyof typeof labels]: string };
}
