"use client";

import { SkeletonTemplatePage } from "@/components/shared/Skeleton";
import {
  SkeletonAdvertisingEditor,
  SkeletonSettingsPage,
  SkeletonTikTokPage,
} from "@/components/shared/SkeletonPageLayouts";
import {
  SkeletonLinktreeEditorModal,
  SkeletonPageAnalyticsModal,
} from "@/components/shared/SkeletonModalLayouts";
import { useBusinessLocale } from "@/features/business/i18n/BusinessLocaleProvider";

type BusinessLoadingKind =
  | "linktreeEditor"
  | "settings"
  | "templates"
  | "pageAnalytics"
  | "tiktok"
  | "advertising";

export function BusinessLoadingSkeleton({ kind }: { kind: BusinessLoadingKind }) {
  const { locale } = useBusinessLocale();
  const arabic = locale === "ar";
  const english = locale === "en";

  switch (kind) {
    case "linktreeEditor":
      return <SkeletonLinktreeEditorModal
        loadingLabel={arabic ? "جارٍ تحميل محرر صفحات الروابط" : english ? "Loading page editor" : "پەیجی دەستکاریکەر بار دەکرێت"}
        informationLabel={arabic ? "جارٍ تحميل معلومات صفحة الروابط" : english ? "Loading page information" : "زانیاریی پەیج بار دەکرێت"}
      />;
    case "settings":
      return <SkeletonSettingsPage tabCount={4} loadingLabel={arabic ? "جارٍ تحميل الإعدادات" : english ? "Loading settings" : "ڕێکخستنەکان بار دەکرێن"} />;
    case "templates":
      return <SkeletonTemplatePage loadingLabel={arabic ? "جارٍ تحميل القوالب" : english ? "Loading templates" : "قاڵبەکان بار دەکرێن"} />;
    case "pageAnalytics":
      return <SkeletonPageAnalyticsModal
        loadingLabel={arabic ? "جارٍ تحميل إحصائيات الصفحة" : english ? "Loading page analytics" : "ئاماری پەیج بار دەکرێت"}
        dataLabel={arabic ? "جارٍ تحميل بيانات إحصائيات الصفحة" : english ? "Loading analytics data" : "داتای ئاماری پەیج بار دەکرێت"}
      />;
    case "tiktok":
      return <SkeletonTikTokPage loadingLabel={arabic ? "جارٍ تحميل إعدادات تيك توك" : english ? "Loading TikTok settings" : "ڕێکخستنەکانی تیکتۆک بار دەکرێن"} />;
    case "advertising":
      return <SkeletonAdvertisingEditor loadingLabel={arabic ? "جارٍ تحميل محرر الإعلانات" : english ? "Loading advertising editor" : "دەستکاریکەری ڕیکلام بار دەکرێت"} />;
  }
}
