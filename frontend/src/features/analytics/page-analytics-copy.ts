import { ANALYTICS_TERMS } from "@/components/shared/analytics-terminology";
import { englishBusinessMessages } from "@/features/shared/i18n/english-messages";
import { sharedArabicLinktreeCopy } from "@/features/link-editor/shared-arabic-copy";
export interface PageAnalyticsCopy {
  loadFailed: string;
  cleared: string;
  clearFailed: string;
  title: string;
  summary: string;
  allData: string;
  lastUpdated: string;
  clearAll: string;
  nothingToClear: string;
  clearData: string;
  refresh: string;
  close: string;
  totalViews: string;
  uniqueViewer: string;
  totalClicks: string;
  uniqueClicker: string;
  clickRate: string;
  conversions: string;
  conversionValue: string;
  conversionRate: string;
  fromDate: string;
  toDate: string;
  buttons: string;
  historyHint: string;
  noData: string;
  unattributedClicks: string;
  unattributedHint: string;
  historical: string;
  unattributed: string;
  clicks: string;
  unique: string;
  actualConversions: string;
  openDestination: string;
  uniqueHint: string;
  clearTitle: string;
  confirmClear: string;
  clearing: string;
  cancel: string;
  clearQuestion: string;
  today: string;
  todayHint: string;
  last24h: string;
  last24hHint: string;
  last7d: string;
  last7dHint: string;
  all: string;
  allHint: string;
  custom: string;
  customHint: string;
}

const KURDISH_COPY: PageAnalyticsCopy = {
  loadFailed: "داتاکانی ئامار بارنەکران",
  cleared: "داتاکانی ئامار پاککرانەوە",
  clearFailed: "پاککردنەوەی داتاکان سەرکەوتوو نەبوو",
  title: "ئاماری",
  summary: "کورتەی ئاماری هەموو ماوە",
  allData: "هەموو داتاکان",
  lastUpdated: "دواین نوێکردنەوە:",
  clearAll: "پاککردنەوەی هەموو داتاکانی ئامار",
  nothingToClear: "هیچ داتایەک نییە بۆ پاککردنەوە",
  clearData: "پاککردنەوەی داتاکان",
  refresh: "نوێکردنەوە",
  close: "داخستن",
  totalViews: ANALYTICS_TERMS.totalViews,
  uniqueViewer: ANALYTICS_TERMS.uniqueViewer,
  totalClicks: ANALYTICS_TERMS.totalClicks,
  uniqueClicker: ANALYTICS_TERMS.uniqueClicker,
  clickRate: ANALYTICS_TERMS.clickRate,
  conversions: "گۆڕانەکان",
  conversionValue: "بەهای گۆڕان",
  conversionRate: "ڕێژەی گۆڕان",
  fromDate: "لە بەرواری",
  toDate: "بۆ بەرواری",
  buttons: "دوگمەکان",
  historyHint:
    "کۆی سەرەوە هەموو کلیکە تۆمارکراوەکان دەگرێتەوە؛ دوگمە سڕاوە یان گۆڕاوەکان لێرە وەک مێژوویی نیشان دەدرێن.",
  noData: "هێشتا هیچ داتایەک نییە",
  unattributedClicks: "کلیکە دیارینەکراوەکان",
  unattributedHint: "کردارێک کە بە دوگمەیەکی دیاریکراو نەبەستراوەتەوە",
  historical: "مێژوویی",
  unattributed: "دیارینەکراو",
  clicks: "کلیک",
  unique: "تاک",
  actualConversions: "گۆڕانی ڕاستەقینە",
  openDestination: "کردنەوەی بەستەری مەبەست",
  uniqueHint:
    "ژمارەی «تاک» بۆ هەر دوگمەیەک بە جیاوازی هەژمار دەکرێت؛ یەک کەس دەتوانێت زیاتر لە دوگمەیەک کلیک بکات، بۆیە ئەو ژمارانە کۆ ناکرێنەوە.",
  clearTitle: "پاککردنەوەی داتاکانی ئامار",
  confirmClear: "بەڵێ، پاکی بکەوە",
  clearing: "پاکدەکرێتەوە...",
  cancel: "هەڵوەشاندنەوە",
  clearQuestion:
    "دڵنیایت لە پاککردنەوەی هەموو داتاکانی بینین و کلیکی ئەم پەڕەیە؟ ئەم کردارە ناگەڕێتەوە.",
  today: "ئەمڕۆ",
  todayHint: "لە سەرەتای ئەمڕۆ",
  last24h: "٢٤ ساعت",
  last24hHint: "٢٤ ساعتی ڕابردوو",
  last7d: "٧ ڕۆژ",
  last7dHint: "٧ ڕۆژی ڕابردوو",
  all: "هەموو",
  allHint: "هەموو ماوەکان",
  custom: "تایبەت",
  customHint: "دیاریکردنی بەروار بە دەستی",
};

export function pageAnalyticsCopy(
  locale: "en" | "ar" | "ckb",
): PageAnalyticsCopy {
  return locale === "en"
    ? englishBusinessMessages.PageAnalytics
    : locale === "ar"
      ? sharedArabicLinktreeCopy.analytics
      : KURDISH_COPY;
}
