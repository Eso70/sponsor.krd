"use client";
import { SectionSaveActions } from "./SectionSaveActions";
import type { ReactNode } from "react";
import { Building2, Palette, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { StatCard } from "./StatCard";
import { SegmentedTabsFrame } from "./SegmentedTabsFrame";
import { PageCollectionSkeleton } from "./PageCollectionSkeleton";

import { PageManagementSection } from "./PageManagementSection";
import { PageManagementToolbarSkeleton } from "./PageManagementToolbarSkeleton";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { Skeleton, SkeletonStatCard } from "@/components/shared/Skeleton";

function SkeletonPageHeader({ actions = 4 }: { actions?: number }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <Skeleton className="size-11 shrink-0" rounded="rounded-xl" />
        <div className="min-w-0 flex-1 pt-0.5">
          <Skeleton className="mb-2 h-6 w-52 max-w-full" rounded="rounded-md" />
          <Skeleton className="h-3 w-96 max-w-full" rounded="rounded-md" />
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {Array.from({ length: actions }).map((_, index) => (
          <Skeleton
            key={index}
            className={
              index === actions - 1
                ? "h-10 w-28"
                : index === 1
                  ? "h-10 w-36"
                  : "h-10 w-10"
            }
            rounded="rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}

/** Exact initial layout shared by public-page management screens. */
export function SkeletonPageManagement({
  loadingLabel = "Loading page management",
  stats,
}: {
  loadingLabel?: string;
  stats?: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={loadingLabel}>
      <div aria-hidden="true">
        {stats ?? <StatCardGrid columns={3} className="mb-8">
          {Array.from({ length: 6 }).map((_, index) => <SkeletonStatCard key={index} />)}
        </StatCardGrid>}
      </div>
      <PageManagementSection
        title=""
        loading
        toolbar={<PageManagementToolbarSkeleton />}
      >
        <PageCollectionSkeleton announce={false} />
      </PageManagementSection>
    </div>
  );
}

export function SkeletonSettingsPage({
  tabCount = 3,
  loadingLabel = "Loading settings",
  showStats = true,
}: {
  tabCount?: number;
  loadingLabel?: string;
  showStats?: boolean;
}) {
  return <div role="status" aria-busy="true" aria-label={loadingLabel} className="space-y-5">
    {showStats && <div aria-hidden="true"><StatCardGrid columns={4} className="mb-8">
      <StatCard loading icon={SlidersHorizontal} label="" value="" color="blue" loadingLabel={loadingLabel} />
      <StatCard loading icon={Building2} label="" value="" color="green" loadingLabel={loadingLabel} />
      <StatCard loading icon={Palette} label="" value="" color="purple" loadingLabel={loadingLabel} />
      <StatCard loading icon={ShieldCheck} label="" value="" color="green" loadingLabel={loadingLabel} />
    </StatCardGrid></div>}
    <SegmentedTabsFrame aria-hidden="true">{Array.from({ length: tabCount }).map((_, index) => <Skeleton key={index} className="h-11 min-w-28 flex-1" rounded="rounded-xl" />)}</SegmentedTabsFrame>
    <PageManagementSection title="" loading>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="col-span-full">
          <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-3 sm:gap-5">
            {[0, 1, 2].map((asset) => <div key={asset} className="flex min-w-0 flex-col items-center gap-2"><Skeleton className="aspect-square w-full" /><Skeleton className="h-4 w-12" rounded="rounded-md" /></div>)}
          </div>
          <div className="mt-3 flex justify-center"><Skeleton className="h-10 w-36" /></div>
        </div>
        {Array.from({ length: 6 }).map((_, field) => <div key={field}><Skeleton className="mb-1.5 h-4 w-28" rounded="rounded-md" /><Skeleton className="h-10 w-full" /></div>)}
      </div>
      <SectionSaveActions><Skeleton className="h-10 w-28" rounded="rounded-xl" /></SectionSaveActions>
    </PageManagementSection>
  </div>;
}

/** Matches the actual group label, helper and Add group action. */
export function SkeletonTikTokToolbar() {
  return <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="min-w-0 flex-1 space-y-1"><Skeleton className="h-5 w-48" rounded="rounded-md" /><Skeleton className="h-4 w-96 max-w-full" rounded="rounded-md" /></div>
    <Skeleton className="h-10 w-36 shrink-0" rounded="rounded-xl" />
  </div>;
}

export function SkeletonTikTokPixelConfig({
  announce = true,
  embedded = false,
  showControls = true,
  loadingLabel = "Loading TikTok configuration",
}: { announce?: boolean; embedded?: boolean; showControls?: boolean; loadingLabel?: string } = {}) {
  return (
    <div className={embedded ? undefined : "rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025] sm:p-6"}
      role={announce ? "status" : undefined} aria-busy={announce ? "true" : undefined} aria-label={announce ? loadingLabel : undefined}>
      {!embedded && <SkeletonPageHeader actions={0} />}
      {showControls && <div className="mb-5"><SkeletonTikTokToolbar /></div>}
      <div className="min-w-0 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5">
          <div className="flex items-center gap-2.5"><Skeleton className="size-7" rounded="rounded-lg" /><Skeleton className="h-5 w-32" rounded="rounded-md" /></div>
          <Skeleton className="size-8" rounded="rounded-xl" />
        </div>
        <div className="mt-3.5 grid grid-cols-1 items-start gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((field) => <div key={field} className="min-w-0">
            <div className="mb-1.5 flex items-center justify-between gap-3"><Skeleton className="h-4 w-28" rounded="rounded-md" />{(field === 1 || field === 2) && <Skeleton className="h-3 w-12" rounded="rounded-md" />}</div>
            {field === 3 ? <div className="flex items-center gap-2"><Skeleton className="h-10 min-w-0 flex-1" rounded="rounded-xl" /><Skeleton className="h-10 w-16" rounded="rounded-xl" /></div> : <Skeleton className="h-10 w-full" rounded="rounded-xl" />}
          </div>)}
        </div>
      </div>
      {!embedded && <div className="mt-6 flex justify-end border-t border-slate-100 pt-5 dark:border-white/5"><Skeleton className="h-10 w-24" rounded="rounded-xl" /></div>}
    </div>
  );
}

export function SkeletonTikTokPage({
  loadingLabel = "Loading TikTok settings",
  showStats = true,
}: { loadingLabel?: string; showStats?: boolean } = {}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={loadingLabel}
      className="space-y-5"
    >
      {showStats && <StatCardGrid columns={4} className="mb-8">
        {(["blue", "cyan", "green", "pink"] as const).map((color) => (
          <SkeletonStatCard key={color} color={color} />
        ))}
      </StatCardGrid>}
      <PageManagementSection title="" loading toolbar={<SkeletonTikTokToolbar />}>
        <SkeletonTikTokPixelConfig embedded showControls={false} announce={false} />
        <div className="mt-6">
          <SkeletonTikTokDelivery embedded announce={false} loadingLabel={loadingLabel} />
        </div>
        <SectionSaveActions>
          <Skeleton className="h-10 w-24" rounded="rounded-xl" />
        </SectionSaveActions>
      </PageManagementSection>
    </div>
  );
}

export function SkeletonTikTokDelivery({
  embedded = false,
  announce = true,
  loadingLabel = "Loading TikTok delivery",
}: { embedded?: boolean; announce?: boolean; loadingLabel?: string } = {}) {
  return (
    <div
      role={announce ? "status" : undefined}
      aria-busy={announce ? "true" : undefined}
      aria-label={announce ? loadingLabel : undefined}
      className={embedded ? undefined : "rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025] sm:p-6"}
    >
      {!embedded && <SkeletonPageHeader actions={1} />}
      <div className={embedded ? undefined : "rounded-2xl border border-slate-200 p-5 dark:border-white/10"}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-white/5">
          <div className="space-y-1"><div className="flex items-center gap-2"><Skeleton className="size-4" rounded="rounded-md" /><Skeleton className="h-5 w-44" rounded="rounded-md" /></div><Skeleton className="h-4 w-80 max-w-full" rounded="rounded-md" /></div>
          <Skeleton className="h-6 w-28" rounded="rounded-full" />
        </div>
        <div className="mt-4">
        {embedded ? <div className="space-y-3">{[0, 1].map((row) => <div key={row} className="flex items-center justify-between gap-4"><Skeleton className="h-3 w-36" /><Skeleton className="h-4 w-10" /></div>)}</div> : (
        <StatCardGrid columns={2}>
          <SkeletonStatCard color="slate" showDetail />
          <SkeletonStatCard color="blue" showDetail />
        </StatCardGrid>
        )}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3 py-2">
        <Skeleton className="size-8 shrink-0" rounded="rounded-lg" />
        <div className="min-w-0 flex-1 space-y-1"><Skeleton className="h-4 w-40" rounded="rounded-md" /><Skeleton className="h-3 w-64 max-w-full" rounded="rounded-md" /></div>
      </div>
    </div>
  );
}

export function SkeletonBusinessDirectoryPage({
  loadingLabel = "Loading business directory",
}: { loadingLabel?: string } = {}) {
  return (
    <div role="status" aria-busy="true" aria-label={loadingLabel}>
      <StatCardGrid columns={3} className="mb-8">
        {(["blue", "green", "orange", "purple", "slate", "pink"] as const).map((color) => (
          <SkeletonStatCard key={color} color={color} />
        ))}
      </StatCardGrid>
      <SegmentedTabsFrame compact fullWidth className="mb-6">
        <Skeleton className="h-10 flex-1" rounded="rounded-lg" />
        <Skeleton className="h-10 flex-1" rounded="rounded-lg" />
      </SegmentedTabsFrame>
      <PageManagementSection title="" loading toolbar={<div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-10 min-w-32 flex-1" rounded="rounded-2xl" />
        <Skeleton className="h-10 w-32" rounded="rounded-2xl" />
        <Skeleton className="size-10" rounded="rounded-2xl" />
        <Skeleton className="size-10" rounded="rounded-2xl" />
        <Skeleton className="h-10 w-28" rounded="rounded-2xl" />
      </div>}>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <article
              key={index}
              className="flex min-h-72 flex-col border-b border-slate-100 p-4 dark:border-white/5 sm:border-r"
            >
              <div className="mb-3 flex items-start gap-3">
                <Skeleton className="size-14 shrink-0" rounded="rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="mb-2 h-4 w-1/2" rounded="rounded-md" />
                  <Skeleton className="mb-2 h-3 w-1/3" rounded="rounded-md" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" rounded="rounded-full" />
                    <Skeleton className="h-5 w-20" rounded="rounded-full" />
                  </div>
                </div>
                <Skeleton className="size-10 shrink-0" rounded="rounded-xl" />
              </div>
              <Skeleton className="mb-3 h-11 w-full" rounded="rounded-xl" />
              <div className="mb-3 grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((__, fieldIndex) => (
                  <Skeleton
                    key={fieldIndex}
                    className="h-10 w-full"
                    rounded="rounded-lg"
                  />
                ))}
              </div>
              <div className="mt-auto flex gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
                {Array.from({ length: 4 }).map((__, actionIndex) => (
                  <Skeleton
                    key={actionIndex}
                    className="h-9 flex-1"
                    rounded="rounded-xl"
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      </PageManagementSection>
    </div>
  );
}
