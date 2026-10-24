"use client";
import { ManagementDrawer } from "@/components/shared/ManagementDrawer";
import { EditorSection } from "@/components/shared/EditorSection";
import { Skeleton, SkeletonStatCard } from "@/components/shared/Skeleton";
import type { StatCardColor } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { analyticsInsightsCopy } from "../analytics-insights-copy";
import {
  pageAnalyticsCopy,
  type PageAnalyticsCopy,
} from "../page-analytics-copy";
import { PageAnalyticsRange } from "./PageAnalyticsRange";

export function PageAnalyticsSkeleton({
  summaryOnly = false,
  showRange = true,
  locale = "ckb",
  labels = pageAnalyticsCopy(locale),
  loadingLabel = "Loading page analytics data",
}: {
  summaryOnly?: boolean;
  showRange?: boolean;
  locale?: "en" | "ar" | "ckb";
  labels?: PageAnalyticsCopy;
  loadingLabel?: string;
}) {
  const copy = analyticsInsightsCopy[locale];
  const colors: StatCardColor[] = summaryOnly
    ? ["blue", "purple", "green", "orange"]
    : ["blue", "green", "purple", "orange"];
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={loadingLabel}
      className="space-y-5"
    >
      {!summaryOnly && showRange && (
        <PageAnalyticsRange
          disabled
          labels={labels}
          locale={locale}
          preset="all"
          setPreset={() => undefined}
          customFrom=""
          customTo=""
          setCustomFrom={() => undefined}
          setCustomTo={() => undefined}
        />
      )}
      <StatCardGrid columns={2}>
        {(summaryOnly
          ? [
              labels.uniqueViewer,
              labels.totalClicks,
              labels.uniqueClicker,
              labels.clickRate,
            ]
          : [
              labels.totalViews,
              labels.uniqueViewer,
              labels.totalClicks,
              labels.uniqueClicker,
            ]
        ).map((label, index) => (
          <SkeletonStatCard key={label} color={colors[index]} />
        ))}
      </StatCardGrid>
      {!summaryOnly && showRange && (
        <>
          {[copy.additional, copy.outcomes, copy.questions].map((title) => (
            <EditorSection
              key={title}
              title={title}
              disabled
              open={false}
              onToggle={() => undefined}
            >
              <span />
            </EditorSection>
          ))}
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {labels.buttons}
          </h3>
          <div className="space-y-2 rounded-2xl border border-slate-100 p-3 dark:border-white/8">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex items-center gap-3 py-3">
                <Skeleton className="size-9 shrink-0" rounded="rounded-xl" />
                <Skeleton className="h-3 flex-1" />
                {[labels.clicks, labels.unique, "CTR"].map((label) => (
                  <div key={label} className="w-12 text-center">
                    <Skeleton className="mx-auto mb-1 h-3 w-8" />
                    <span className="text-[10px] text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SkeletonPageAnalyticsDrawer({
  summaryOnly = false,
  platformAdminTheme = false,
  locale = "ckb",
  loadingLabel = "Loading page analytics",
  dataLabel = "Loading page analytics data",
}: {
  summaryOnly?: boolean;
  platformAdminTheme?: boolean;
  locale?: "en" | "ar" | "ckb";
  loadingLabel?: string;
  dataLabel?: string;
}) {
  return (
    <ManagementDrawer
      isOpen
      onClose={() => undefined}
      locked
      extraWide
      compactHeader
      title={loadingLabel}
      sponsorKrdTheme={platformAdminTheme}
    >
      <PageAnalyticsSkeleton
        summaryOnly={summaryOnly}
        locale={locale}
        loadingLabel={dataLabel}
      />
    </ManagementDrawer>
  );
}
