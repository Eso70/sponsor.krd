import type { SessionManagementCopy } from "@/components/shared/SessionManagementPanel";
import type { PlatformLocale } from "./locale";

export const platformSessionCopy: Record<PlatformLocale, { title: string; close: string; panel: SessionManagementCopy }> = {
  en: {
    title: "Business sessions", close: "Close session management",
    panel: {
      loading: "Loading sessions", loadFailed: "Could not load sessions", revokeFailed: "Could not revoke session", revoked: "Session access revoked", activeSessions: "Active sessions", description: "Review devices with access to this business.", refresh: "Refresh sessions", empty: "No active sessions.", current: "Current", remembered: "Remembered", unknownIp: "Unknown IP", expires: "Expires", revokeSession: "Revoke this session", revokeAllTooltip: "Revoke all sessions", revokeAll: "Revoke all business sessions", dialogTitle: "Revoke session access", dialogConfirm: "Revoke access", dialogLoading: "Revoking...", dialogMessage: "This device will lose access immediately.", dialogCancel: "Cancel", dialogClose: "Close", unknownDevice: "Unknown device", unknownTime: "Unknown time", browserOn: "on",
    },
  },
  ckb: {
    title: "دانیشتنەکانی بزنس",
    close: "داخستنی بەڕێوەبردنی دانیشتنەکان",
    panel: {
      loading: "بارکردنی دانیشتنەکان",
      loadFailed: "بارکردنی دانیشتنەکان سەرکەوتوو نەبوو",
      revokeFailed: "لابردنی دانیشتن سەرکەوتوو نەبوو",
      revoked: "دەستگەیشتنی دانیشتنەکە لابرا",
      activeSessions: "دانیشتنە چالاکەکان",
      description: "ئامێرەکانی دەستگەیشتوو بە ئەم بزنسە بپشکنە.",
      refresh: "نوێکردنەوەی دانیشتنەکان",
      empty: "هیچ دانیشتنێکی چالاک نییە.",
      current: "ئێستا", remembered: "بیرکراوەتەوە", unknownIp: "IP نەنناسراو",
      expires: "بەسەردەچێت", revokeSession: "لابردنی ئەم دانیشتنە",
      revokeAllTooltip: "لابردنی هەموو دانیشتنەکان",
      revokeAll: "لابردنی هەموو دانیشتنەکانی بزنس",
      dialogTitle: "لابردنی دەستگەیشتنی دانیشتن",
      dialogConfirm: "لابردنی دەستگەیشتن", dialogLoading: "لابردن...",
      dialogMessage: "ئەم ئامێرە دەستبەجێ دەستگەیشتنی لەدەست دەدات.",
      dialogCancel: "هەڵوەشاندنەوە", dialogClose: "داخستن",
      unknownDevice: "ئامێری نەنناسراو", unknownTime: "کاتی نەنناسراو", browserOn: "لەسەر",
    },
  },
  ar: {
    title: "جلسات النشاط التجاري",
    close: "إغلاق إدارة الجلسات",
    panel: {
      loading: "جارٍ تحميل الجلسات",
      loadFailed: "تعذّر تحميل الجلسات", revokeFailed: "تعذّر إلغاء الجلسة",
      revoked: "أُلغي الوصول إلى الجلسة", activeSessions: "الجلسات النشطة",
      description: "راجع الأجهزة التي يمكنها الوصول إلى هذا النشاط التجاري.",
      refresh: "تحديث الجلسات", empty: "لا توجد جلسات نشطة.",
      current: "الحالية", remembered: "محفوظة", unknownIp: "عنوان IP غير معروف",
      expires: "تنتهي في", revokeSession: "إلغاء هذه الجلسة",
      revokeAllTooltip: "إلغاء جميع الجلسات", revokeAll: "إلغاء جميع جلسات النشاط التجاري",
      dialogTitle: "إلغاء الوصول إلى الجلسة", dialogConfirm: "إلغاء الوصول",
      dialogLoading: "جارٍ الإلغاء...", dialogMessage: "سيفقد هذا الجهاز الوصول فورًا.",
      dialogCancel: "إلغاء", dialogClose: "إغلاق",
      unknownDevice: "جهاز غير معروف", unknownTime: "وقت غير معروف", browserOn: "على",
    },
  },
};
