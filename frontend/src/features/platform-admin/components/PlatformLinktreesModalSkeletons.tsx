"use client";

import { SkeletonPageAnalyticsDrawer } from "@/features/analytics/components/PageAnalyticsSkeleton";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { platformLinktreesCopy } from "@/features/platform-admin/i18n/linktrees-copy";

export function PlatformLinktreeAnalyticsSkeleton() {
  const { locale } = usePlatformLocale();
  const copy = platformLinktreesCopy[locale];
  return <SkeletonPageAnalyticsDrawer locale={locale} platformAdminTheme loadingLabel={copy.analyticsLoading} dataLabel={copy.analyticsDataLoading} />;
}
