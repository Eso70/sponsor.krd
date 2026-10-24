"use client";

import { SkeletonPageAnalyticsDrawer } from "@/features/analytics/components/PageAnalyticsSkeleton";
import { SkeletonTemplatePage } from "@/components/shared/Skeleton";
import {
  SkeletonSettingsPage,
  SkeletonTikTokPage,
} from "@/components/shared/SkeletonPageLayouts";
import { useBusinessLocale } from "@/features/business/i18n/BusinessLocaleProvider";

type BusinessLoadingKind =
  | "settings"
  | "templates"
  | "pageAnalytics"
  | "tiktok"
  ;

export function BusinessLoadingSkeleton({ kind }: { kind: BusinessLoadingKind }) {
  const { locale } = useBusinessLocale();
  const arabic = locale === "ar";
  const english = locale === "en";

  switch (kind) {
    case "settings":
      return <SkeletonSettingsPage tabCount={3} loadingLabel={arabic ? "جارٍ تحميل الإعدادات" : english ? "Loading settings" : "ڕێکخستنەکان بار دەکرێن"} />;
    case "templates":
      return <SkeletonTemplatePage loadingLabel={arabic ? "جارٍ تحميل القوالب" : english ? "Loading templates" : "قاڵبەکان بار دەکرێن"} />;
    case "pageAnalytics":
      return <SkeletonPageAnalyticsDrawer locale={locale}
        loadingLabel={arabic ? "جارٍ تحميل إحصائيات الصفحة" : english ? "Loading page analytics" : "ئاماری پەیج بار دەکرێت"}
        dataLabel={arabic ? "جارٍ تحميل بيانات إحصائيات الصفحة" : english ? "Loading analytics data" : "داتای ئاماری پەیج بار دەکرێت"}
      />;
    case "tiktok":
      return <SkeletonTikTokPage loadingLabel={arabic ? "جارٍ تحميل إعدادات تيك توك" : english ? "Loading TikTok settings" : "ڕێکخستنەکانی تیکتۆک بار دەکرێن"} />;
  }
}
