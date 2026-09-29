import type { PlatformLocale } from "./locale";

type AnalyticsCopy = Record<
  "title" | "updated" | "import" | "export" | "refresh" | "close" |
  "retry" | "totalViews" | "totalClicks" | "search" | "mostViews" |
  "mostClicks" | "least" | "empty" | "noMatch" | "allLinks" | "of" |
  "default" | "active" | "inactive" | "views" | "clicks" |
  "loadFailed" | "importSuccess" | "importFailed" | "exportFailed" | "loading",
  string
>;

export const platformAnalyticsCopy: Record<PlatformLocale, AnalyticsCopy> = {
  en: {
    title: "Business analytics", updated: "Last updated", import: "Import Linktrees", export: "Export Linktrees", refresh: "Refresh", close: "Close", retry: "Try again", totalViews: "Total views", totalClicks: "Total clicks", search: "Search by link name...", mostViews: "Most views", mostClicks: "Most clicks", least: "Least", empty: "No Linktrees found", noMatch: "No matching results", allLinks: "All links", of: "of", default: "Default", active: "Active", inactive: "Inactive", views: "Views", clicks: "Clicks", loadFailed: "Could not load data", loading: "Loading business analytics", importSuccess: "Linktrees imported successfully", importFailed: "Could not import Linktrees", exportFailed: "Could not export Linktrees",
  },
  ckb: {
    title: "ئاماری بەڕێوەبەر", updated: "دواین نوێکردنەوە", import: "هاوردەکردنی لینکترییەکان",
    export: "هەناردەکردنی لینکترییەکان", refresh: "نوێکردنەوە", close: "داخستن",
    retry: "هەوڵ بدەوە", totalViews: "کۆی بینینەکان", totalClicks: "کۆی کلیکەکان",
    search: "گەڕان بە ناوی لینک...", mostViews: "زۆرترین بینین", mostClicks: "زۆرترین کلیک",
    least: "کەمترین", empty: "هیچ لینکترییەک نەدۆزرایەوە", noMatch: "هیچ هاوتابوونێک نەدۆزرایەوە",
    allLinks: "هەموو لینکەکان", of: "لە", default: "سەرەکی", active: "چالاک", inactive: "ناچالاک",
    views: "بینین", clicks: "کلیک", loadFailed: "داتاکان بار نەکران",
    loading: "بارکردنی ئاماری بزنس",
    importSuccess: "لینکترییەکان بە سەرکەوتوویی هاوردە کران",
    importFailed: "هاوردەکردنی لینکترییەکان سەرکەوتوو نەبوو",
    exportFailed: "هەناردەکردنی لینکترییەکان سەرکەوتوو نەبوو",
  },
  ar: {
    title: "إحصاءات النشاط التجاري", updated: "آخر تحديث", import: "استيراد صفحات الروابط",
    export: "تصدير صفحات الروابط", refresh: "تحديث", close: "إغلاق",
    retry: "إعادة المحاولة", totalViews: "إجمالي المشاهدات", totalClicks: "إجمالي النقرات",
    search: "ابحث باسم الرابط...", mostViews: "الأكثر مشاهدة", mostClicks: "الأكثر نقرًا",
    least: "الأقل", empty: "لا توجد صفحات روابط", noMatch: "لم تُعثر على نتائج مطابقة",
    allLinks: "جميع الروابط", of: "من", default: "رئيسية", active: "نشطة", inactive: "غير نشطة",
    views: "مشاهدات", clicks: "نقرات", loadFailed: "تعذّر تحميل البيانات",
    loading: "جارٍ تحميل إحصاءات النشاط التجاري",
    importSuccess: "تم استيراد صفحات الروابط بنجاح", importFailed: "تعذّر استيراد صفحات الروابط",
    exportFailed: "تعذّر تصدير صفحات الروابط",
  },
};
