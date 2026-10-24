"use client";

import { PageManagementSection } from "./PageManagementSection";
import { ManagementGridLayout } from "./ManagementGridLayout";
import { ManagementCard } from "./ManagementCard";
import { PhoneMockup } from "./PhoneMockup";
import { SegmentedTabsFrame } from "./SegmentedTabsFrame";
import collectionStyles from "./management-collection.module.css";
import { StatCardFrame } from "./StatCardFrame";
import { StatCardGrid, type StatCardGridColumns } from "./StatCardGrid";
import type { StatCardColor } from "./stat-card-styles";
import { Skeleton } from "./SkeletonBlock";
export { Skeleton } from "./SkeletonBlock";
import { DashboardSidebarSkeleton } from "./DashboardSidebarSkeleton";
import { DashboardHeaderSkeleton } from "./DashboardHeaderSkeleton";
import {
  MANAGEMENT_MODAL_BACKDROP_CLASS,
  MANAGEMENT_MODAL_FOOTER_CLASS,
  MANAGEMENT_MODAL_HEADER_CLASS,
  MANAGEMENT_MODAL_SURFACE_CLASS,
} from "@/components/shared/management-modal-styles";

/**
 * Loading placeholders shaped like the content that is coming.
 *
 * A spinner says "wait" and nothing else: the layout jumps when the data
 * lands, and the reader has no idea whether they are waiting for one row or
 * fifty. A skeleton reserves the real space, so the page settles into what was
 * already outlined instead of rearranging itself.
 *
 * Compose the primitives rather than hand-rolling pulsing placeholders — that
 * is how the pulse, the palette and the reduced-motion behaviour stay the same
 * everywhere.
 */

/**
 * Lines of text. The last one is short, the way a real paragraph ends, so a
 * block of them does not read as a solid slab.
 */
export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          rounded="rounded-md"
          className={`h-3 ${index === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/** One card: media band, heading, a couple of lines, then its actions. */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 p-4 dark:border-white/10 ${className}`}
    >
      <Skeleton className="mb-4 h-28 w-full" rounded="rounded-xl" />
      <Skeleton className="mb-2 h-4 w-1/2" rounded="rounded-md" />
      <SkeletonText lines={2} />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  );
}

export function SkeletonCardGrid({
  count = 6,
  className = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className} role="status" aria-label="بارکردن">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

/** Rows of even height, matching a table body while it loads. */
export function SkeletonTable({
  rows = 6,
  columns = 5,
  className = "",
  loadingLabel = "Loading table",
  leadingCell = "avatar",
}: {
  rows?: number;
  columns?: number;
  leadingCell?: "avatar" | "checkbox" | "text";
  className?: string;
  loadingLabel?: string;
}) {
  return (
    <div
      className={`w-full ${className}`}
      role="status"
      aria-busy="true"
      aria-label={loadingLabel}
      dir="ltr"
    >
      <div className={`${collectionStyles.frame} divide-y divide-slate-100 dark:divide-white/5 md:hidden`}>
        {Array.from({ length: Math.min(rows, 4) }).map((_, index) => (
          <div key={index} data-skeleton-mobile-row className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              {leadingCell === "checkbox" && <Skeleton className="size-5 shrink-0" rounded="rounded-md" />}
              <Skeleton className="h-4 w-3/4" rounded="rounded-md" />
            </div>
            <Skeleton className="h-3 w-1/2" rounded="rounded-md" />
            <Skeleton className="h-3 w-full" rounded="rounded-md" />
            <div className="flex gap-2 border-t border-slate-100 pt-2 dark:border-white/5">
              {Array.from({ length: 4 }).map((_, action) => <Skeleton key={action} className="size-8" rounded="rounded-lg" />)}
            </div>
          </div>
        ))}
      </div>
      <div className={`${collectionStyles.frame} hidden w-full md:block`}>
        <div
          className={`${collectionStyles.header} grid gap-3 px-3 py-3`}
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-3/4" rounded="rounded-md" />
          ))}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              data-skeleton-table-row
              className="grid min-h-16 items-center gap-3 px-3 py-3"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <div key={columnIndex} className="flex items-center gap-2">
                  {columnIndex === 0 && leadingCell !== "text" && (
                    <Skeleton className={leadingCell === "checkbox" ? "size-5 shrink-0" : "size-9 shrink-0"}
                      rounded={leadingCell === "checkbox" ? "rounded-md" : "rounded-full"} />
                  )}
                  {!(columnIndex === 0 && leadingCell === "checkbox") && (
                  <Skeleton
                    className={
                      columnIndex === columns - 1 ? "h-8 w-20" : "h-3 flex-1"
                    }
                    rounded={
                      columnIndex === columns - 1 ? "rounded-lg" : "rounded-md"
                    }
                  />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Label-and-control rows for editor or settings data that has not arrived yet. */
export function SkeletonForm({
  fields = 5,
  className = "",
  showMedia = true,
  announce = true,
}: {
  fields?: number;
  className?: string;
  showMedia?: boolean;
  announce?: boolean;
}) {
  return (
    <div
      className={`space-y-5 ${className}`}
      role={announce ? "status" : undefined}
      aria-label={announce ? "Loading form data" : undefined}
    >
      {showMedia && (
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 shrink-0" rounded="rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32 max-w-full" rounded="rounded-md" />
            <Skeleton className="h-10 w-40 max-w-full" />
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: fields }).map((_, index) => (
          <div
            key={index}
            className={
              index === fields - 1 && fields % 2 !== 0 ? "sm:col-span-2" : ""
            }
          >
            <Skeleton className="mb-2 h-3 w-24" rounded="rounded-md" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
      </div>
      <div>
        <Skeleton className="mb-3 h-3 w-28" rounded="rounded-md" />
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full" rounded="rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Full management-page fallback used while a lazily loaded page bundle arrives. */
export function SkeletonManagementPage({
  cardCount = 6,
  statCount = 6,
}: {
  cardCount?: number;
  statCount?: number;
}) {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading management page"
    >
      <StatCardGrid columns={3}>
        {Array.from({ length: statCount }).map((_, index) => (
          <SkeletonStatCard key={index} />
        ))}
      </StatCardGrid>
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025] sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Skeleton
              className="mb-2 h-7 w-52 max-w-full"
              rounded="rounded-md"
            />
            <Skeleton className="h-3 w-72 max-w-full" rounded="rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid gap-4 border-t border-slate-100 pt-6 dark:border-white/5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: cardCount }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Template catalogue loading reuses its real section, grid, cards and phones. */
export function SkeletonTemplatePage({ loadingLabel = "Loading templates", previewCount = 3 }: { loadingLabel?: string; previewCount?: number } = {}) {
  return <div className="w-full min-w-0 space-y-4 pb-8 sm:space-y-6 sm:pb-10" role="status" aria-label={loadingLabel} aria-busy="true">
    <div aria-hidden="true">
      <StatCardGrid columns={3}>
        {(["blue", "green", "purple"] as const).map((color) => <SkeletonStatCard key={color} color={color} />)}
      </StatCardGrid>
    </div>
    <SegmentedTabsFrame aria-hidden="true" fullWidth>
      <Skeleton className="h-11 flex-1" rounded="rounded-xl" />
      <Skeleton className="h-11 flex-1" rounded="rounded-xl" />
    </SegmentedTabsFrame>
    <PageManagementSection loading title="" toolbar={<Skeleton className="h-10 w-full" rounded="rounded-2xl" />}>
      <div aria-hidden="true">
        <ManagementGridLayout desktopColumns={3} items={Array.from({ length: previewCount }, (_, index) => ({
          key: String(index),
          content: <ManagementCard intrinsicHeight={730}>
            <div className="relative flex w-full justify-center">
              <PhoneMockup ariaLabel="" size="responsive" active={false} />
            </div>
          </ManagementCard>,
        }))} />
      </div>
    </PageManagementSection>
  </div>;
}
/** Public Linktree frame: identity, copy, action links, and footer. */
export function SkeletonPublicLinktreePage({
  loadingLabel = "Loading Linktree page",
}: { loadingLabel?: string } = {}) {
  return (
    <main
      className="flex min-h-dvh justify-center bg-slate-100 px-4 py-8 dark:bg-[#0b0d0e] sm:py-12"
      role="status"
      aria-busy="true"
      aria-label={loadingLabel}
    >
      <div className="w-full max-w-xl text-center">
        <Skeleton
          className="mx-auto size-24 border-4 border-white shadow-lg dark:border-white/10"
          rounded="rounded-full"
        />
        <Skeleton
          className="mx-auto mt-5 h-7 w-48 max-w-full"
          rounded="rounded-md"
        />
        <Skeleton
          className="mx-auto mt-3 h-4 w-64 max-w-full"
          rounded="rounded-md"
        />
        <div className="mx-auto mt-4 max-w-md">
          <SkeletonText lines={2} />
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              data-skeleton-link-row
              className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 dark:border-white/10 dark:bg-white/5"
            >
              <Skeleton className="size-8 shrink-0" rounded="rounded-xl" />
              <Skeleton className="h-4 flex-1" rounded="rounded-md" />
              <Skeleton className="size-5 shrink-0" rounded="rounded-md" />
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-200 pt-5 dark:border-white/10">
          <Skeleton className="size-7" rounded="rounded-lg" />
          <Skeleton className="h-3 w-28" rounded="rounded-md" />
        </div>
      </div>
    </main>
  );
}

export type SkeletonDashboardBody = "analytics" | "table" | "form";

/**
 * Complete dashboard frame used by route-level loading boundaries.
 *
 * The desktop sidebar and the header reserve the exact regions owned by the
 * real dashboard shell. On mobile the off-canvas sidebar stays hidden, just as
 * it does after the dashboard has loaded.
 */
export function SkeletonDashboardShell({
  navigationItems,
  sidebarCollapsed = false,
  platformAdminTheme = false,
  children,
}: {
  navigationItems?: number;
  sidebarCollapsed?: boolean;
  platformAdminTheme?: boolean;
  children?: React.ReactNode;
} = {}) {
  return (
    <div
      className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 dark:bg-[#161B22] dark:text-gray-100"
      dir="ltr"
      data-sponsor-krd-theme={platformAdminTheme ? true : undefined}
      data-platform-admin-theme={platformAdminTheme ? true : undefined}
    >
      <DashboardSidebarSkeleton
        navigationItems={navigationItems}
        platformAdminTheme={platformAdminTheme}
        collapsed={sidebarCollapsed}
      />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeaderSkeleton />

        <main className="min-h-0 flex-1 overflow-hidden">
          <div className="mx-auto h-full max-w-7xl overflow-hidden px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
            {children ?? <SkeletonDashboardPage statCount={4} body="table" />}
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Shared dashboard-page frame for data-heavy business surfaces.
 *
 * It preserves the real order—metrics, optional tabs, then the main surface—
 * while the body variant mirrors the kind of content that will replace it.
 */
export function SkeletonDashboardPage({
  statCount = 4,
  tabCount = 0,
  body = "table",
  className = "",
  loadingLabel = "Loading dashboard data",
}: {
  statCount?: number;
  tabCount?: number;
  body?: SkeletonDashboardBody;
  className?: string;
  loadingLabel?: string;
}) {
  return (
    <div
      className={`min-h-[55vh] space-y-5 py-1 ${className}`}
      role="status"
      aria-label={loadingLabel}
    >
      {statCount > 0 && (
        <StatCardGrid columns={4}>
          {Array.from({ length: statCount }).map((_, index) => (
            <SkeletonStatCard key={index} />
          ))}
        </StatCardGrid>
      )}
      {tabCount > 0 && (
        <SegmentedTabsFrame compact fullWidth>
          {Array.from({ length: tabCount }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-9 min-w-24 flex-1"
              rounded="rounded-lg"
            />
          ))}
        </SegmentedTabsFrame>
      )}
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025] sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <Skeleton
              className="mb-2 h-6 w-56 max-w-full"
              rounded="rounded-md"
            />
            <Skeleton className="h-3 w-96 max-w-full" rounded="rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="border-t border-slate-100 pt-6 dark:border-white/5">
          {body === "form" ? (
            <SkeletonForm announce={false} fields={6} showMedia={false} />
          ) : body === "analytics" ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"
                >
                  <Skeleton className="mb-2 h-4 w-32" rounded="rounded-md" />
                  <Skeleton
                    className="mb-5 h-3 w-48 max-w-full"
                    rounded="rounded-md"
                  />
                  <div className="flex h-36 items-end gap-2">
                    {[45, 72, 58, 88, 66, 94, 76].map((height, barIndex) => (
                      <Skeleton
                        key={barIndex}
                        className="flex-1"
                        rounded="rounded-t-md"
                        // A deterministic chart outline communicates scale without implying data.
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mb-3 grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    className="h-3 w-full"
                    rounded="rounded-md"
                  />
                ))}
              </div>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Non-interactive modal shell shown while a lazily loaded dialog bundle arrives. */
export function SkeletonModal({
  wide = false,
  platformAdminTheme = false,
}: {
  wide?: boolean;
  platformAdminTheme?: boolean;
}) {
  return (
    <div
      className="modal-ltr fixed inset-0 z-[140] flex items-center justify-center p-2 sm:p-4"
      role="status"
      aria-label="Loading dialog"
      data-sponsor-krd-theme={platformAdminTheme ? true : undefined}
      data-platform-admin-theme={platformAdminTheme ? true : undefined}
    >
      <div className={MANAGEMENT_MODAL_BACKDROP_CLASS} />
      <div
        className={`${MANAGEMENT_MODAL_SURFACE_CLASS} ${wide ? "max-w-4xl" : "max-w-2xl"}`}
      >
        <div className={`${MANAGEMENT_MODAL_HEADER_CLASS} items-center`}>
          <div className="min-w-0 flex-1">
            <Skeleton
              className="mb-2 h-6 w-48 max-w-full"
              rounded="rounded-md"
            />
            <Skeleton className="h-3 w-32" rounded="rounded-md" />
          </div>
          <Skeleton className="h-9 w-9 shrink-0" />
        </div>
        <div className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
          <Skeleton className="h-2 w-full" rounded="rounded-full" />
        </div>
        <div className="flex-1 overflow-hidden p-5 sm:p-6">
          <SkeletonForm announce={false} />
        </div>
        <div className={`${MANAGEMENT_MODAL_FOOTER_CLASS} flex gap-3`}>
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 flex-1" />
        </div>
      </div>
    </div>
  );
}

/** The same responsive grid and card shell used by loaded statistics. */
export function SkeletonStatCards({
  count = 2,
  columns = (count === 6
    ? 3
    : Math.min(6, Math.max(1, count))) as StatCardGridColumns,
  className = "",
  compact = false,
  loadingLabel = "بارکردن",
}: {
  count?: number;
  columns?: StatCardGridColumns;
  className?: string;
  compact?: boolean;
  loadingLabel?: string;
}) {
  return (
    <StatCardGrid
      columns={columns}
      className={className}
      role="status"
      aria-busy="true"
      aria-label={loadingLabel}
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonStatCard compact={compact} key={index} />
      ))}
    </StatCardGrid>
  );
}

/** Every pending slot shares the resolved card's spacing and responsive sizing. */
export function SkeletonStatCard({
  className,
  color = "slate",
  compact = false,
  showIcon = true,
  showDetail = false,
  showAction = false,
}: {
  className?: string;
  color?: StatCardColor;
  compact?: boolean;
  showIcon?: boolean;
  showDetail?: boolean;
  showAction?: boolean;
}) {
  return (
    <StatCardFrame
      className={className}
      color={color}
      compact={compact}
      loading
      action={
        showAction ? (
          <Skeleton className="size-7" rounded="rounded-lg" />
        ) : undefined
      }
      icon={
        showIcon ? (
          <Skeleton
            className={compact ? "size-4" : "size-4 sm:size-5 md:size-6"}
            rounded="rounded-md"
          />
        ) : undefined
      }
      value={
        <Skeleton className="h-[1.25em] w-2/3 max-w-32" rounded="rounded-md" />
      }
      caption={
        <div className="flex min-w-0 items-center gap-1.5">
          <Skeleton
            className="h-[1.25em] w-1/2 max-w-28"
            rounded="rounded-md"
          />
          {showDetail ? (
            <Skeleton className="h-[1em] w-1/3 max-w-20" rounded="rounded-md" />
          ) : null}
        </div>
      }
    />
  );
}

/** A list of rows that each carry an icon, a label and some figures. */
export function SkeletonList({
  rows = 5,
  className = "",
  loadingLabel = "بارکردن",
}: {
  rows?: number;
  className?: string;
  loadingLabel?: string;
}) {
  return (
    <div
      className={`divide-y divide-slate-100 rounded-2xl border border-slate-100 dark:divide-white/5 dark:border-white/10 ${className}`}
      role="status"
      aria-label={loadingLabel}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3">
          <Skeleton className="h-9 w-9 shrink-0" rounded="rounded-lg" />
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-2 h-3.5 w-1/3" rounded="rounded-md" />
            <Skeleton className="h-2.5 w-1/5" rounded="rounded-md" />
          </div>
          <Skeleton className="h-3.5 w-10 shrink-0" rounded="rounded-md" />
          <Skeleton
            className="hidden h-3.5 w-10 shrink-0 sm:block"
            rounded="rounded-md"
          />
        </div>
      ))}
    </div>
  );
}
