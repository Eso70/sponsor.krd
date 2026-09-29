"use client";

import { SkeletonBusinessAnalyticsModal } from "@/components/shared/SkeletonModalLayouts";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { platformAnalyticsCopy } from "@/features/platform-admin/i18n/analytics-copy";

export function PlatformBusinessAnalyticsSkeleton() {
  const { locale } = usePlatformLocale();
  const copy = platformAnalyticsCopy[locale];
  return <SkeletonBusinessAnalyticsModal platformAdminTheme loadingLabel={copy.loading} contentLoadingLabel={copy.loading} />;
}
