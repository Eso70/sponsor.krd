import type { PlatformLocale } from "@/features/platform-admin/i18n/locale";

const KURDISH_PERMISSION_DESCRIPTIONS: Readonly<Record<string, string>> = {
  "business:dashboard:view": "کردنەوە و بینینی داشبۆردی بزنس",
  "business:pages:linktrees-access": "دەستگەیشتن بە پەڕەی لینکترێکان",
  "business:pages:templates-access": "دەستگەیشتن بە پەڕەی قاڵبەکان",
  "business:pages:profile-access": "دەستگەیشتن بە پەڕەی پڕۆفایلی بزنس",
  "business:pages:settings-access": "دەستگەیشتن بە پەڕەی ڕێکخستنەکانی بزنس",
  "business:pages:advertising-access": "دەستگەیشتن بە پەڕەی ڕیکلامی بزنس",
  "business:settings:profile-access":
    "کردنەوەی بەشی ڕێکخستنەکانی پڕۆفایل",
  "business:settings:defaults-access":
    "کردنەوەی بەشی ڕێکخستنە بنەڕەتییەکانی پەڕە",
  "business:settings:security-access":
    "کردنەوەی بەشی ڕێکخستنەکانی پاراستنی هەژمار",
  "business:settings:integrations-access":
    "کردنەوەی بەشی ڕێکخستنەکانی پەیوەستکراوەکان",
  "business:profile:read": "بینینی پڕۆفایلی بزنس",
  "business:domains:read": "بینینی دۆمەینە تایبەتەکان و ڕێنمایی DNS",
  "business:domains:manage": "زیادکردن، پشتڕاستکردنەوە و بەڕێوەبردنی دۆمەینی تایبەت",
  "business:profile:update":
    "نوێکردنەوەی خانە تۆمارکراوەکانی پڕۆفایلی بزنس",
  "business:profile-assets:upload":
    "بارکردنی وێنە و فایلەکانی براندی بزنس",
  "business:defaults:read": "بینینی ڕێکخستنە بنەڕەتییەکانی بزنس",
  "business:defaults:update":
    "نوێکردنەوەی خانە بنەڕەتییە تۆمارکراوەکانی بزنس",
  "business:security:email-update": "گۆڕینی ناونیشانی ئیمەیڵی خاوەنی بزنس",
  "business:security:username-update": "گۆڕینی ناوی بەکارهێنەری خاوەنی بزنس",
  "business:security:sessions-revoke": "کۆتاییهێنان بە دانیشتنەکانی چوونەژوورەوەی بزنس",
  "business:templates:browse": "گەڕان و بینینی کەتەلۆگی قاڵبەکان",
  "business:templates:use": "بەکارهێنانی قاڵبێکی بەردەست",
  "business:templates:set-default": "دانانی قاڵبی بنەڕەتی بۆ بزنس",
  "business:tiktok:read": "بینینی ڕێکخستنە شاراوەکانی پیکسڵی TikTok",
  "business:tiktok:create": "دروستکردنی ڕێکخستنێکی نوێی پیکسڵی TikTok",
  "business:tiktok:update": "نوێکردنەوەی ڕێکخستنێکی پیکسڵی TikTok",
  "business:tiktok:delete": "سڕینەوەی ڕێکخستنێکی پیکسڵی TikTok",
  "business:tiktok:secret-read": "ئاشکراکردنی تۆکنەکانی Events APIی TikTok",
  "business:linktrees:read": "بینینی لینکترێکان",
  "business:linktrees:create": "دروستکردنی لینکترێی نوێ",
  "business:linktrees:update": "نوێکردنەوەی خانە تۆمارکراوەکانی لینکترێ",
  "business:linktrees:delete": "سڕینەوەی لینکترێ",
  "business:linktrees:upload": "بارکردنی وێنە و فایلەکانی لینکترێ",
  "business:advertising:read": "بینینی پەڕەی خزمەتگوزاریی ڕیکلام",
  "business:advertising:update": "دەستکاریکردنی پەڕەی خزمەتگوزاریی ڕیکلام",
  "business:advertising:publish": "بڵاوکردنەوە یان لابردنی پەڕەی خزمەتگوزاریی ڕیکلام",
  "business:links:read": "بینینی لینکەکان",
  "business:links:create": "دروستکردنی لینکی نوێ",
  "business:links:update": "نوێکردنەوەی خانە تۆمارکراوەکانی لینک",
  "business:links:delete": "سڕینەوەی لینک",
  "business:links:sync": "هاوکاتکردنی کۆمەڵە لینکەکانی لینکترێ",
  "business:links:reorder": "گۆڕینی ڕیزبەندی لینکەکان",
  "business:analytics:totals-read": "بینینی کۆی گشتی ئامارەکان",
  "business:analytics:details-read": "بینینی وردەکاری ئامارەکانی لینکترێ",
  "business:analytics:tiktok-health-read":
    "بینینی دۆخی گەیاندنی ڕووداوەکانی TikTok و هەوڵدانەوە",
  "business:analytics:clear-linktree":
    "سڕینەوەی ئامارەکانی تەنها یەک لینکترێ",
  "business:analytics:clear-all": "سڕینەوەی هەموو ئامارەکانی بزنس",
};

const ARABIC_PERMISSION_DESCRIPTIONS: Readonly<Record<string, string>> = {
  "business:dashboard:view": "فتح لوحة تحكم النشاط التجاري وعرضها",
  "business:pages:linktrees-access": "الوصول إلى صفحة الروابط",
  "business:pages:templates-access": "الوصول إلى صفحة القوالب",
  "business:pages:profile-access": "الوصول إلى صفحة ملف النشاط التجاري",
  "business:pages:settings-access": "الوصول إلى إعدادات النشاط التجاري",
  "business:pages:advertising-access": "الوصول إلى صفحة إعلانات النشاط التجاري",
  "business:settings:profile-access": "فتح قسم إعدادات الملف الشخصي",
  "business:settings:defaults-access": "فتح قسم إعدادات الصفحة الافتراضية",
  "business:settings:security-access": "فتح قسم أمان الحساب",
  "business:settings:integrations-access": "فتح قسم التكاملات",
  "business:profile:read": "عرض ملف النشاط التجاري",
  "business:domains:read": "عرض النطاقات المخصصة وتعليمات DNS",
  "business:domains:manage": "إضافة النطاقات المخصصة والتحقق منها وإدارتها",
  "business:profile:update": "تحديث حقول ملف النشاط التجاري المسجّلة",
  "business:profile-assets:upload": "رفع صور وملفات علامة النشاط التجاري",
  "business:defaults:read": "عرض الإعدادات الافتراضية للنشاط التجاري",
  "business:defaults:update": "تحديث الحقول الافتراضية المسجّلة للنشاط التجاري",
  "business:security:email-update": "تغيير البريد الإلكتروني لمالك النشاط التجاري",
  "business:security:username-update": "تغيير اسم مستخدم مالك النشاط التجاري",
  "business:security:sessions-revoke": "إنهاء جلسات تسجيل دخول النشاط التجاري",
  "business:templates:browse": "تصفح دليل القوالب وعرضه",
  "business:templates:use": "استخدام قالب متاح",
  "business:templates:set-default": "تعيين القالب الافتراضي للنشاط التجاري",
  "business:tiktok:read": "عرض إعدادات بكسل تيك توك الخاصة",
  "business:tiktok:create": "إنشاء إعدادات جديدة لبكسل تيك توك",
  "business:tiktok:update": "تحديث إعدادات بكسل تيك توك",
  "business:tiktok:delete": "حذف إعدادات بكسل تيك توك",
  "business:tiktok:secret-read": "كشف رموز واجهة أحداث تيك توك",
  "business:linktrees:read": "عرض صفحات الروابط",
  "business:linktrees:create": "إنشاء صفحة روابط جديدة",
  "business:linktrees:update": "تحديث حقول صفحة الروابط المسجّلة",
  "business:linktrees:delete": "حذف صفحة الروابط",
  "business:linktrees:upload": "رفع صور وملفات صفحة الروابط",
  "business:advertising:read": "عرض صفحة خدمة الإعلانات",
  "business:advertising:update": "تعديل صفحة خدمة الإعلانات",
  "business:advertising:publish": "نشر صفحة خدمة الإعلانات أو إلغاء نشرها",
  "business:links:read": "عرض الروابط",
  "business:links:create": "إنشاء رابط جديد",
  "business:links:update": "تحديث حقول الرابط المسجّلة",
  "business:links:delete": "حذف رابط",
  "business:links:sync": "مزامنة مجموعة روابط صفحة الروابط",
  "business:links:reorder": "إعادة ترتيب الروابط",
  "business:analytics:totals-read": "عرض إجمالي الإحصاءات",
  "business:analytics:details-read": "عرض تفاصيل إحصاءات صفحة الروابط",
  "business:analytics:tiktok-health-read": "عرض حالة تسليم أحداث تيك توك وإعادة المحاولة",
  "business:analytics:clear-linktree": "مسح إحصاءات صفحة روابط واحدة فقط",
  "business:analytics:clear-all": "مسح جميع إحصاءات النشاط التجاري",
};

const ENGLISH_PERMISSION_DESCRIPTIONS: Readonly<Record<string, string>> = {
  "business:dashboard:view": "Open and view the business dashboard",
  "business:pages:linktrees-access": "Access Linktree pages",
  "business:pages:templates-access": "Access the templates page",
  "business:pages:profile-access": "Access the business profile page",
  "business:pages:settings-access": "Access business settings",
  "business:pages:advertising-access": "Access the business advertising page",
  "business:settings:profile-access": "Open profile settings",
  "business:settings:defaults-access": "Open default page settings",
  "business:settings:security-access": "Open account security settings",
  "business:settings:integrations-access": "Open integrations settings",
  "business:profile:read": "View the business profile",
  "business:domains:read": "View custom domains and DNS instructions",
  "business:domains:manage": "Add, verify and manage custom domains",
  "business:profile:update": "Update registered business profile fields",
  "business:profile-assets:upload": "Upload business brand images and files",
  "business:defaults:read": "View business defaults",
  "business:defaults:update": "Update registered business default fields",
  "business:security:email-update": "Change the business owner's email address",
  "business:security:username-update": "Change the business owner's username",
  "business:security:sessions-revoke": "End business login sessions",
  "business:templates:browse": "Browse and view the template catalog",
  "business:templates:use": "Use an available template",
  "business:templates:set-default": "Set the default business template",
  "business:tiktok:read": "View private TikTok Pixel settings",
  "business:tiktok:create": "Create TikTok Pixel settings",
  "business:tiktok:update": "Update TikTok Pixel settings",
  "business:tiktok:delete": "Delete TikTok Pixel settings",
  "business:tiktok:secret-read": "Reveal TikTok Events API tokens",
  "business:linktrees:read": "View Linktrees",
  "business:linktrees:create": "Create a Linktree",
  "business:linktrees:update": "Update registered Linktree fields",
  "business:linktrees:delete": "Delete a Linktree",
  "business:linktrees:upload": "Upload Linktree images and files",
  "business:advertising:read": "View the advertising service page",
  "business:advertising:update": "Edit the advertising service page",
  "business:advertising:publish": "Publish or unpublish the advertising service page",
  "business:links:read": "View links",
  "business:links:create": "Create a link",
  "business:links:update": "Update registered link fields",
  "business:links:delete": "Delete a link",
  "business:links:sync": "Sync a Linktree's links",
  "business:links:reorder": "Reorder links",
  "business:analytics:totals-read": "View analytics totals",
  "business:analytics:details-read": "View Linktree analytics details",
  "business:analytics:tiktok-health-read": "View TikTok event delivery and retry status",
  "business:analytics:clear-linktree": "Clear analytics for one Linktree only",
  "business:analytics:clear-all": "Clear all business analytics",
};

export function getKurdishPermissionDescription(permissionKey: string) {
  return (
    KURDISH_PERMISSION_DESCRIPTIONS[permissionKey] ||
    "ڕوونکردنەوەی کوردی بۆ ئەم مۆڵەتە دیاری نەکراوە."
  );
}

export function getPermissionDescription(permissionKey: string, locale: PlatformLocale) {
  if (locale === "ar") {
    return ARABIC_PERMISSION_DESCRIPTIONS[permissionKey] || "لا يتوفر وصف عربي لهذه الصلاحية.";
  }
  if (locale === "en") {
    return ENGLISH_PERMISSION_DESCRIPTIONS[permissionKey] || "No English description is available for this permission.";
  }
  return getKurdishPermissionDescription(permissionKey);
}

const PERMISSION_CATEGORIES: Record<string, { ckb: string; ar: string; en: string }> = {
  "Access control": { ckb: "بەڕێوەبردنی مۆڵەتەکان", ar: "التحكم بالوصول", en: "Access control" },
  Advertising: { ckb: "ڕیکلام", ar: "الإعلانات", en: "Advertising" },
  Analytics: { ckb: "ئامار", ar: "التحليلات", en: "Analytics" },
  Billing: { ckb: "پارەدان", ar: "الفوترة", en: "Billing" },
  "Business account": { ckb: "هەژماری بزنس", ar: "حساب النشاط التجاري", en: "Business account" },
  "Business administration": { ckb: "بەڕێوەبردنی بزنس", ar: "إدارة الأعمال", en: "Business administration" },
  "Business navigation": { ckb: "ڕێنیشاندانی بزنس", ar: "التنقل في النشاط التجاري", en: "Business navigation" },
  "Communication Center": { ckb: "ناوەندی پەیوەندی", ar: "مركز التواصل", en: "Communication Center" },
  Links: { ckb: "بەستەرەکان", ar: "الروابط", en: "Links" },
  Linktrees: { ckb: "پەڕەکانی لینک", ar: "صفحات الروابط", en: "Linktrees" },
  "Platform Linktrees": { ckb: "پەڕەکانی لینکی پلاتفۆرم", ar: "صفحات روابط المنصة", en: "Platform Linktrees" },
  "Platform settings": { ckb: "ڕێکخستنەکانی پلاتفۆرم", ar: "إعدادات المنصة", en: "Platform settings" },
  Templates: { ckb: "قاڵبەکان", ar: "القوالب", en: "Templates" },
  TikTok: { ckb: "تیکتۆک", ar: "تيك توك", en: "TikTok" },
};

export function getPermissionCategory(category: string, locale: PlatformLocale): string {
  return PERMISSION_CATEGORIES[category]?.[locale] ?? category;
}
