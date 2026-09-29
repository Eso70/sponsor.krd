import type { PlatformLocale } from "./locale";

type PlatformLinktreesCopy = Record<
  "description" | "searchEmpty" | "searchEmptyDescription" | "empty" |
  "emptyDescription" | "loadFailed" | "editLoadFailed" | "updated" |
  "created" | "saveFailed" | "archived" | "restored" |
  "campaignEnabled" | "campaignDisabled" | "statusEnabled" |
  "statusDisabled" | "statusFailed" | "clearSuccess" | "clearFailed" |
  "clearTitle" | "clearConfirm" | "clearing" | "cancel" | "close" |
  "clearQuestion" | "deleteTitle" | "deleteQuestion" |
  "thisPage" | "deleteConsequence" | "deleteSuccess" | "deleteFailed" |
  "confirmDelete" | "deleting" | "editorLoading" |
  "editorInfoLoading" | "analyticsLoading" | "analyticsDataLoading",
  string
>;

export const platformLinktreesCopy: Record<PlatformLocale, PlatformLinktreesCopy> = {
  en: {
    description: "Create and manage the platform's public Linktree pages at sponsor.krd/linktree/name.", searchEmpty: "No results for your search", searchEmptyDescription: "Try another term or clear the search.", empty: "No platform Linktrees yet", emptyDescription: "Create the first Linktree on the main domain.", loadFailed: "Could not load Linktree pages", editLoadFailed: "Could not load the Linktree page", updated: "Linktree updated", created: "Linktree created", saveFailed: "Could not save the Linktree", archived: "Page archived", restored: "Page restored from archive", campaignEnabled: "Page enabled for campaign", campaignDisabled: "Campaign disabled for page", statusEnabled: "Page enabled", statusDisabled: "Page disabled", statusFailed: "Could not change page status", clearSuccess: "All Linktree analytics cleared", clearFailed: "Could not clear all analytics", clearTitle: "Clear all analytics", clearConfirm: "Yes, clear all", clearing: "Clearing...", cancel: "Cancel", close: "Close", clearQuestion: "Are you sure you want to clear all views and clicks for Linktree pages? This cannot be undone.", deleteTitle: "Delete Linktree", deleteQuestion: "Are you sure you want to delete", thisPage: "this page", deleteConsequence: "Its public link will be permanently removed.", deleteSuccess: "Linktree deleted", deleteFailed: "Could not delete Linktree", confirmDelete: "Delete", deleting: "Deleting...", editorLoading: "Loading Linktree editor", editorInfoLoading: "Loading Linktree details", analyticsLoading: "Loading page analytics", analyticsDataLoading: "Loading page analytics data",
  },
  ckb: {
    description: "پەڕە گشتییەکانی پلاتفۆرم دروست و بەڕێوە ببە لە sponsor.krd/linktree/name.",
    searchEmpty: "هیچ ئەنجامێک بۆ گەڕانەکەت نەدۆزرایەوە",
    searchEmptyDescription: "وشەیەکی دیکە بنووسە یان گەڕانەکە پاک بکەرەوە.",
    empty: "هێشتا هیچ پەڕەیەکی لینکتریی پلاتفۆرم نییە",
    emptyDescription: "یەکەم پەڕەی لینکتری لە دۆمەینی سەرەکی دروست بکە.",
    loadFailed: "بارکردنی پەڕەکانی لینکتری سەرکەوتوو نەبوو",
    editLoadFailed: "بارکردنی پەڕەی لینکتری سەرکەوتوو نەبوو",
    updated: "پەڕەی لینکتری نوێ کرایەوە", created: "پەڕەی لینکتری دروست کرا",
    saveFailed: "پاشەکەوتکردنی پەڕەی لینکتری سەرکەوتوو نەبوو",
    archived: "پەڕەکە ئەرشیفکرا", restored: "پەڕەکە لە ئەرشیف گەڕێندرایەوە",
    campaignEnabled: "پەڕەکە بۆ کەمپین چالاککرا", campaignDisabled: "پەڕەکە لە کەمپین لابرا",
    statusEnabled: "پەڕەکە چالاککرایەوە", statusDisabled: "پەڕەکە ناچالاککرا",
    statusFailed: "گۆڕینی دۆخی پەڕە سەرکەوتوو نەبوو",
    clearSuccess: "هەموو ئامارەکانی لینکتری پاککرانەوە",
    clearFailed: "پاککردنەوەی هەموو ئامارەکان سەرکەوتوو نەبوو",
    clearTitle: "پاککردنەوەی هەموو ئامارەکان", clearConfirm: "بەڵێ، هەمووی پاک بکەوە",
    clearing: "پاکدەکرێتەوە...", cancel: "هەڵوەشاندنەوە", close: "داخستن",
    clearQuestion: "دڵنیایت لە پاککردنەوەی هەموو داتاکانی بینین و کلیکی پەڕەکانی لینکتری؟ ئەم کردارە ناگەڕێتەوە.",
    deleteTitle: "سڕینەوەی پەڕەی لینکتری", deleteQuestion: "دڵنیایت لە سڕینەوەی",
    thisPage: "ئەم پەڕەیە", deleteConsequence: "بەستەرە گشتییەکەی بۆ هەمیشە نامێنێت.",
    deleteSuccess: "پەڕەی لینکتری سڕایەوە", deleteFailed: "سڕینەوەی پەڕەی لینکتری سەرکەوتوو نەبوو",
    confirmDelete: "سڕینەوە", deleting: "دەسڕێتەوە...",
    editorLoading: "بارکردنی دەستکاریکەری لینکتری", editorInfoLoading: "بارکردنی زانیارییەکانی لینکتری",
    analyticsLoading: "بارکردنی ئاماری پەڕە", analyticsDataLoading: "بارکردنی داتای ئاماری پەڕە",
  },
  ar: {
    description: "أنشئ صفحات الروابط العامة للمنصة وأدرها على sponsor.krd/linktree/name.",
    searchEmpty: "لم تُعثر على نتائج لبحثك", searchEmptyDescription: "جرّب كلمة أخرى أو امسح البحث.",
    empty: "لا توجد صفحات روابط للمنصة بعد", emptyDescription: "أنشئ أول صفحة روابط على النطاق الرئيسي.",
    loadFailed: "تعذّر تحميل صفحات الروابط", editLoadFailed: "تعذّر تحميل صفحة الروابط",
    updated: "تم تحديث صفحة الروابط", created: "تم إنشاء صفحة الروابط",
    saveFailed: "تعذّر حفظ صفحة الروابط", archived: "تمت أرشفة الصفحة", restored: "تمت استعادة الصفحة من الأرشيف",
    campaignEnabled: "تم تفعيل الصفحة للحملة", campaignDisabled: "تم إيقاف الحملة على الصفحة",
    statusEnabled: "تم تفعيل الصفحة", statusDisabled: "تم إيقاف الصفحة", statusFailed: "تعذّر تغيير حالة الصفحة",
    clearSuccess: "تم مسح جميع إحصاءات صفحات الروابط", clearFailed: "تعذّر مسح جميع الإحصاءات",
    clearTitle: "مسح جميع الإحصاءات", clearConfirm: "نعم، امسح الكل",
    clearing: "جارٍ المسح...", cancel: "إلغاء", close: "إغلاق",
    clearQuestion: "هل أنت متأكد من مسح جميع بيانات المشاهدات والنقرات لصفحات الروابط؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteTitle: "حذف صفحة الروابط", deleteQuestion: "هل أنت متأكد من حذف",
    thisPage: "هذه الصفحة", deleteConsequence: "سيُحذف رابطها العام نهائيًا.",
    deleteSuccess: "تم حذف صفحة الروابط", deleteFailed: "تعذّر حذف صفحة الروابط",
    confirmDelete: "حذف", deleting: "جارٍ الحذف...",
    editorLoading: "جارٍ تحميل محرر الصفحات", editorInfoLoading: "جارٍ تحميل بيانات الصفحة",
    analyticsLoading: "جارٍ تحميل إحصاءات الصفحة", analyticsDataLoading: "جارٍ تحميل بيانات إحصاءات الصفحة",
  },
};
