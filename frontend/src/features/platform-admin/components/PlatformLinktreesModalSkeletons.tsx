"use client";

import { SkeletonLinktreeEditorModal, SkeletonPageAnalyticsModal } from "@/components/shared/SkeletonModalLayouts";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { platformLinktreesCopy } from "@/features/platform-admin/i18n/linktrees-copy";

export function PlatformLinktreeEditorSkeleton() {
  const { locale } = usePlatformLocale();
  const copy = platformLinktreesCopy[locale];
  return <SkeletonLinktreeEditorModal platformAdminTheme loadingLabel={copy.editorLoading} informationLabel={copy.editorInfoLoading} />;
}

export function PlatformLinktreeAnalyticsSkeleton() {
  const { locale } = usePlatformLocale();
  const copy = platformLinktreesCopy[locale];
  return <SkeletonPageAnalyticsModal platformAdminTheme loadingLabel={copy.analyticsLoading} dataLabel={copy.analyticsDataLoading} />;
}
