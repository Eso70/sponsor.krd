"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Eye,
  FileText,
  MousePointerClick,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LinktreeListItem } from "@linktree/types";

import { ManagementToolbar } from "@/components/shared/ManagementToolbar";
import { ClearAnalyticsButton } from "@/components/shared/ClearAnalyticsButton";
import { DashboardSurface } from "@/components/shared/DashboardSurface";
import { PageHeader } from "@/components/shared/PageHeader";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { SkeletonLinktreeGrid } from "@/components/shared/SkeletonPageLayouts";
import { StatCard } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { ANALYTICS_TERMS } from "@/components/shared/analytics-terminology";
import { DASHBOARD_PAGE_LABELS } from "@/components/shared/dashboard-page-labels";
import type { LinktreeListCopy } from "./linktree-list-copy";
import type { PageListTrafficLabels } from "@/components/business/LinktreeMeta";
import type { CampaignProfitCopy } from "@/features/campaigns/components/CampaignProfitModal";

const KURDISH_COPY = {
  title: DASHBOARD_PAGE_LABELS.linktrees,
  description:
    "پەیجەکانت دروست و بەڕێوە ببە و بینین و کلیکەکانی هەر پەیجێک چاودێری بکە.",
  limitReached: "سنووری دروستکردنی پەڕە پڕ بووە",
  totalPages: "کۆی پەڕەکانی لینکتری",
  totalViews: ANALYTICS_TERMS.totalViews,
  uniqueViews: ANALYTICS_TERMS.uniqueViewer,
  totalClicks: ANALYTICS_TERMS.totalClicks,
  clickRate: ANALYTICS_TERMS.clickRate,
  conversions: "گۆڕانەکان",
  analytics: "ئامار",
  noArchived: "هیچ پەڕەیەکی ئەرشیفکراو نییە",
  archivedDescription:
    "ئەو پەڕانەی بە دەستی ئەرشیفیان دەکەیت لێرەدا دەردەکەون.",
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

const LoadingCopyContext = createContext<Partial<LinktreeListCopy> | undefined>(
  undefined,
);

function LoadingGrid() {
  const copy = useContext(LoadingCopyContext);
  return (
    <SkeletonLinktreeGrid
      count={6}
      loadingLabel={copy?.loadingCards ?? "پەیجەکان بار دەکرێن"}
    />
  );
}

function LoadingTable() {
  const copy = useContext(LoadingCopyContext);
  return (
    <SkeletonTable
      rows={6}
      columns={8}
      loadingLabel={copy?.loadingTable ?? "خشتەی پەیجەکان بار دەکرێت"}
    />
  );
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
    emptyDescription: archived ? labels.archivedDescription : emptyDescription,
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
              <ManagementToolbar
                labels={labels}
                searchQuery={searchQuery}
                isSearchModalOpen={isSearchModalOpen}
                viewMode={viewMode}
                onSearchAction={onSearchAction}
                onViewModeChange={onViewModeChange}
                onRefresh={onRefresh}
                onCreate={onCreate}
                archiveFilter={archiveFilter}
                onArchiveFilterChange={
                  supportsArchive ? setArchiveFilter : undefined
                }
                isRefreshing={isRefreshing}
                createDisabled={createDisabled}
                createDisabledTooltip={
                  createDisabledTooltip ?? labels.limitReached
                }
                accentMode={accentMode}
                leadingAction={
                  <ClearAnalyticsButton
                    onClick={onClearAnalytics}
                    hasData={hasAnalyticsData}
                    disabled={isRefreshing || isClearingAnalytics}
                    labels={{
                      clear: labels.clearAnalytics,
                      noData: labels.noAnalytics,
                    }}
                  />
                }
              />
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
