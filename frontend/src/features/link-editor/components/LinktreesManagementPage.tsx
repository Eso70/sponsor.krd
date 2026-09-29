"use client";

import dynamic from "next/dynamic";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  Eye,
  FileText,
  LayoutGrid,
  MousePointerClick,
  Plus,
  RefreshCw,
  Search,
  Table2,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import type { LinktreeListItem } from "@linktree/types";

import { MotionSpinner } from "@/components/motion/MotionPrimitives";
import { ClearAnalyticsButton } from "@/components/shared/ClearAnalyticsButton";
import { DashboardSurface } from "@/components/shared/DashboardSurface";
import { PageHeader } from "@/components/shared/PageHeader";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { SkeletonLinktreeGrid } from "@/components/shared/SkeletonPageLayouts";
import { StatCard } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { ANALYTICS_TERMS } from "@/components/shared/analytics-terminology";
import { DASHBOARD_PAGE_LABELS } from "@/components/shared/dashboard-page-labels";
import { Tooltip } from "@/components/shared/Tooltip";
import type { LinktreeListCopy } from "./linktree-list-copy";
import type { PageListTrafficLabels } from "@/components/business/LinktreeMeta";
import type { CampaignProfitCopy } from "@/features/campaigns/components/CampaignProfitModal";

const KURDISH_COPY = {
  title: DASHBOARD_PAGE_LABELS.linktrees,
  description: "پەیجەکانت دروست و بەڕێوە ببە و بینین و کلیکەکانی هەر پەیجێک چاودێری بکە.",
  limitReached: "سنووری دروستکردنی پەڕە پڕ بووە",
  totalPages: "کۆی پەڕەکانی لینکتری",
  totalViews: ANALYTICS_TERMS.totalViews,
  uniqueViews: ANALYTICS_TERMS.uniqueViewer,
  totalClicks: ANALYTICS_TERMS.totalClicks,
  clickRate: ANALYTICS_TERMS.clickRate,
  conversions: "گۆڕانەکان",
  analytics: "ئامار",
  noArchived: "هیچ پەڕەیەکی ئەرشیفکراو نییە",
  archivedDescription: "ئەو پەڕانەی بە دەستی ئەرشیفیان دەکەیت لێرەدا دەردەکەون.",
  clearSearch: "پاککردنەوەی گەڕان",
  searchTooltip: "گەڕان لە پەڕەکان (Ctrl+K)",
  search: "گەڕان",
  searchPlaceholder: "گەڕان...",
  activePages: "پەڕە چالاکەکان",
  archivedPages: "پەڕە ئەرشیفکراوەکان",
  active: "چالاک",
  archived: "ئەرشیف",
  gridView: "پیشاندانی تۆڕی (گرید)",
  tableView: "پیشاندانی خشتەیی",
  refreshPages: "نوێکردنەوەی پەیجەکان",
  refresh: "نوێکردنەوە",
  createTooltip: "دروستکردنی پەیجی نوێ",
  create: "پەیجی نوێ",
  clearAnalytics: "پاککردنەوەی هەموو داتاکانی بینین و کلیک",
  noAnalytics: "هیچ داتایەک نییە",
} as const;

const LoadingCopyContext = createContext<Partial<LinktreeListCopy> | undefined>(undefined);

function LoadingGrid() {
  const copy = useContext(LoadingCopyContext);
  return <SkeletonLinktreeGrid count={6} loadingLabel={copy?.loadingCards ?? "پەیجەکان بار دەکرێن"} />;
}

function LoadingTable() {
  const copy = useContext(LoadingCopyContext);
  return <SkeletonTable rows={6} columns={8} loadingLabel={copy?.loadingTable ?? "خشتەی پەیجەکان بار دەکرێت"} />;
}

export type LinktreesManagementCopy = {
  [Key in keyof typeof KURDISH_COPY]: string;
};

const LinktreesGrid = dynamic(
  () =>
    import("@/components/business/LinktreesGrid").then((module) => ({
      default: module.LinktreesGrid,
    })),
  { ssr: false, loading: LoadingGrid },
);
const LinktreesTable = dynamic(
  () =>
    import("@/components/business/LinktreesTable").then((module) => ({
      default: module.LinktreesTable,
    })),
  { ssr: false, loading: LoadingTable },
);

export interface LinktreesManagementPageProps {
  linktrees: LinktreeListItem[];
  linktreeCount: number;
  isLoading: boolean;
  totalViews: number;
  uniqueViews: number;
  totalClicks: number;
  conversions: number;
  isRefreshing: boolean;
  isClearingAnalytics: boolean;
  hasAnalyticsData: boolean;
  searchQuery: string;
  isSearchModalOpen: boolean;
  viewMode: "grid" | "table";
  onClearAnalytics: () => void;
  onRefresh: (rethrow?: boolean) => void | Promise<void>;
  onSearchAction: () => void;
  onViewModeChange: (viewMode: "grid" | "table") => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDuplicate?: (item: LinktreeListItem) => void;
  onDelete?: (id: string, uid: string, name: string) => void;
  onViewAnalytics: (id: string, name: string) => void;
  onToggleCampaign?: (
    id: string,
    isCampaignActive: boolean,
  ) => void | Promise<void>;
  onToggleArchive?: (id: string, isArchived: boolean) => void | Promise<void>;
  onToggleStatus?: (
    id: string,
    status: "active" | "inactive",
  ) => void | Promise<void>;
  description?: string;
  createDisabled?: boolean;
  createDisabledTooltip?: string;
  publicPathPrefix?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  managementNavigation?: ReactNode;
  alternativeContent?: ReactNode;
  accentMode?: "tenant" | "platform";
  copy?: Partial<LinktreesManagementCopy>;
  listCopy?: Partial<LinktreeListCopy>;
  trafficLabels?: PageListTrafficLabels;
  profitCopy?: Partial<CampaignProfitCopy>;
  calendarLocale?: "ckb" | "ar" | "en";
}

export function LinktreesManagementPage({
  linktrees,
  linktreeCount,
  isLoading,
  totalViews,
  uniqueViews,
  totalClicks,
  conversions,
  isRefreshing,
  isClearingAnalytics,
  hasAnalyticsData,
  searchQuery,
  isSearchModalOpen,
  viewMode,
  onClearAnalytics,
  onRefresh,
  onSearchAction,
  onViewModeChange,
  onCreate,
  onEdit,
  onDuplicate,
  onDelete,
  onViewAnalytics,
  onToggleCampaign,
  onToggleArchive,
  onToggleStatus,
  description,
  createDisabled = false,
  createDisabledTooltip,
  publicPathPrefix,
  emptyTitle,
  emptyDescription,
  managementNavigation,
  alternativeContent,
  accentMode = "tenant",
  copy,
  listCopy,
  trafficLabels,
  profitCopy,
  calendarLocale,
}: LinktreesManagementPageProps) {
  const labels = { ...KURDISH_COPY, ...copy };
  const [archiveFilter, setArchiveFilter] = useState<"active" | "archived">(
    "active",
  );
  const supportsArchive = Boolean(onToggleArchive);
  const displayedLinktrees = useMemo(() => {
    if (!supportsArchive) return linktrees;
    return linktrees.filter((item) =>
      archiveFilter === "archived"
        ? Boolean(item.is_archived)
        : !item.is_archived,
    );
  }, [archiveFilter, linktrees, supportsArchive]);
  const ctr =
    totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";
  const archived = supportsArchive && archiveFilter === "archived";
  const usesPlatformAccent = accentMode === "platform";
  const listProps = {
    data: displayedLinktrees,
    isLoading,
    onEdit,
    onDuplicate,
    onDelete,
    onViewAnalytics,
    onToggleCampaign,
    onToggleArchive,
    onToggleStatus,
    publicPathPrefix,
    apiBasePath: usesPlatformAccent
      ? "/api/platform/linktrees"
      : "/api/linktrees",
    showLinktreeMeta: true,
    viewActionLabel: labels.analytics,
    emptyTitle: archived ? labels.noArchived : emptyTitle,
    emptyDescription: archived
      ? labels.archivedDescription
      : emptyDescription,
    sponsorKrdTheme: usesPlatformAccent,
    listCopy,
    trafficLabels,
    profitCopy,
    calendarLocale,
  };

  return (
    <LoadingCopyContext.Provider value={listCopy}>
      <StatCardGrid columns={3} className="mb-8">
        <StatCard
          loading={isLoading}
          loadingLabel={listCopy?.loadingCards ?? "پەیجەکان بار دەکرێن"}
          icon={FileText}
          label={labels.totalPages}
          value={linktreeCount}
          color="blue"
        />
        <StatCard
          loading={isLoading}
          loadingLabel={listCopy?.loadingCards ?? "پەیجەکان بار دەکرێن"}
          icon={Eye}
          label={labels.totalViews}
          value={totalViews}
          color="purple"
        />
        <StatCard
          loading={isLoading}
          loadingLabel={listCopy?.loadingCards ?? "پەیجەکان بار دەکرێن"}
          icon={Users}
          label={labels.uniqueViews}
          value={uniqueViews}
          color="slate"
        />
        <StatCard
          loading={isLoading}
          loadingLabel={listCopy?.loadingCards ?? "پەیجەکان بار دەکرێن"}
          icon={MousePointerClick}
          label={labels.totalClicks}
          value={totalClicks}
          color="green"
        />
        <StatCard
          loading={isLoading}
          loadingLabel={listCopy?.loadingCards ?? "پەیجەکان بار دەکرێن"}
          icon={Target}
          label={labels.clickRate}
          value={`${ctr}%`}
          color="orange"
        />
        <StatCard
          loading={isLoading}
          loadingLabel={listCopy?.loadingCards ?? "پەیجەکان بار دەکرێن"}
          icon={TrendingUp}
          label={labels.conversions}
          value={conversions}
          color="pink"
        />
      </StatCardGrid>

      {managementNavigation}
      {alternativeContent ?? (
        <DashboardSurface as="div" className="space-y-6">
          <PageHeader
            title={labels.title}
            description={description ?? labels.description}
            icon={FileText}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <ClearAnalyticsButton
                  onClick={onClearAnalytics}
                  hasData={hasAnalyticsData}
                  disabled={isRefreshing || isClearingAnalytics}
                  labels={{ clear: labels.clearAnalytics, noData: labels.noAnalytics }}
                />
                <Tooltip
                  content={
                    searchQuery.trim()
                      ? labels.clearSearch
                      : labels.searchTooltip
                  }
                  side="bottom"
                >
                  <button
                    type="button"
                    onClick={onSearchAction}
                    aria-label={
                      searchQuery.trim() ? labels.clearSearch : labels.search
                    }
                    className={`group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border px-0 shadow-sm transition-all duration-300 hover:shadow active:scale-95 ${searchQuery.trim() ? "" : "sm:w-44 sm:justify-between sm:px-3.5"} ${isSearchModalOpen ? (usesPlatformAccent ? "sa-soft sa-soft-border" : "theme-soft") : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50/50 hover:text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"}`}
                  >
                    {searchQuery.trim() ? (
                      <X className="h-4 w-4 text-slate-500 dark:text-gray-400" />
                    ) : (
                      <>
                        <div className="flex min-w-0 items-center gap-2">
                          <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-gray-500" />
                          <span className="hidden truncate text-xs font-semibold text-slate-400 sm:inline dark:text-gray-500">
                            {labels.searchPlaceholder}
                          </span>
                        </div>
                        <kbd className="hidden items-center gap-0.5 rounded bg-slate-100 px-1 py-0.5 font-sans text-[8px] font-bold text-slate-400 select-none sm:inline-flex dark:bg-white/10 dark:text-gray-500">
                          Ctrl K
                        </kbd>
                      </>
                    )}
                  </button>
                </Tooltip>
                {supportsArchive ? (
                  <div className="flex h-10 shrink-0 items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
                    {(["active", "archived"] as const).map((filter) => (
                      <Tooltip
                        key={filter}
                        content={
                          filter === "active"
                            ? labels.activePages
                            : labels.archivedPages
                        }
                        side="bottom"
                      >
                        <button
                          type="button"
                          onClick={() => setArchiveFilter(filter)}
                          aria-pressed={archiveFilter === filter}
                          className={`flex h-8 cursor-pointer items-center justify-center rounded-lg px-3 text-xs font-semibold transition-all active:scale-95 ${archiveFilter === filter ? (usesPlatformAccent ? "sa-gradient sa-ink shadow-sm" : "theme-fill text-[var(--theme-ink)] shadow-sm") : "text-slate-500 hover:bg-slate-50/50 hover:text-slate-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"}`}
                        >
                          <span>
                            {filter === "active" ? labels.active : labels.archived}
                          </span>
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                ) : null}
                <div className="flex h-10 shrink-0 items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
                  {(["grid", "table"] as const).map((mode) => {
                    const Icon = mode === "grid" ? LayoutGrid : Table2;
                    return (
                      <Tooltip
                        key={mode}
                        content={
                          mode === "grid"
                            ? labels.gridView
                            : labels.tableView
                        }
                        side="bottom"
                      >
                        <button
                          type="button"
                          onClick={() => onViewModeChange(mode)}
                          aria-pressed={viewMode === mode}
                          className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-95 ${viewMode === mode ? (usesPlatformAccent ? "sa-gradient sa-ink shadow-md" : "theme-fill text-[var(--theme-ink)] shadow-md") : "text-slate-500 hover:bg-slate-50/50 hover:text-slate-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"}`}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
                <Tooltip content={labels.refreshPages} side="bottom">
                  <button
                    type="button"
                    onClick={() => void onRefresh()}
                    aria-busy={isRefreshing}
                    disabled={isRefreshing}
                    aria-label={labels.refresh}
                    className="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
                  >
                    <MotionSpinner active={isRefreshing}>
                      <RefreshCw className="h-4 w-4" />
                    </MotionSpinner>
                  </button>
                </Tooltip>
                <Tooltip
                  content={
                    createDisabled
                      ? (createDisabledTooltip ?? labels.limitReached)
                      : labels.createTooltip
                  }
                  side="bottom"
                >
                  <button
                    type="button"
                    disabled={createDisabled}
                    onClick={onCreate}
                    className={`group flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-transparent px-3.5 text-xs font-black shadow-sm transition hover:brightness-95 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${usesPlatformAccent ? "sa-gradient sa-ink" : "theme-fill text-[var(--theme-ink)]"}`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>{labels.create}</span>
                  </button>
                </Tooltip>
              </div>
            }
          />
          <div className="border-t border-slate-100 pt-6 dark:border-white/5">
            {viewMode === "grid" ? (
              <LinktreesGrid {...listProps} />
            ) : (
              <LinktreesTable {...listProps} />
            )}
          </div>
        </DashboardSurface>
      )}
    </LoadingCopyContext.Provider>
  );
}
