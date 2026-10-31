"use client";

import { useDeleteSelectedPages } from "@/features/shared/use-delete-selected-pages";
import { sortLinktreesForDashboard } from "../linktree-list-order";
import { usePagePinning } from "@/features/shared/use-page-pinning";
import dynamic from "next/dynamic";
import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FileText } from "lucide-react";
import type { LinktreeListItem } from "@linktree/types";

import { ManagementToolbar } from "@/components/shared/ManagementToolbar";
import { usePageSelectionState } from "@/components/shared/use-page-selection-state";
import { PageSelectionContext } from "@/components/shared/PageSelection";
import { PageSelectionActions } from "@/components/shared/PageSelectionActions";
import { pageSelectionCopy } from "@/components/shared/page-selection-copy";
import { PageManagementSection } from "@/components/shared/PageManagementSection";
import { PAGE_MANAGEMENT_PAGE_SIZE } from "@/components/shared/page-management";
import { PageManagementCollection, PageManagementCollectionFallback } from "@/components/shared/PageManagementCollection";
import { RequestErrorNotice } from "@/components/shared/RequestErrorNotice";
import { linktreeStatsCopy } from "../linktree-stats-copy";
import { LinktreeStats } from "./LinktreeStats";
import { DASHBOARD_PAGE_LABELS } from "@/components/shared/dashboard-page-labels";
import type { LinktreeListCopy } from "./linktree-list-copy";
import type { PageListTrafficLabels } from "@/features/link-editor/components/LinktreeMeta";

const KURDISH_COPY = {
  title: DASHBOARD_PAGE_LABELS.linktrees,
  description:
    "پەیجەکانت دروست و بەڕێوە ببە و بینین و کلیکەکانی هەر پەیجێک چاودێری بکە.",
  limitReached: "سنووری دروستکردنی پەڕە پڕ بووە",
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
  gridView: "تۆڕ",
  tableView: "خشتە",
  refreshPages: "نوێکردنەوەی پەیجەکان",
  refresh: "نوێکردنەوە",
  createTooltip: "دروستکردنی پەیجی نوێ",
  create: "پەیجی نوێ",
} as const;

export type LinktreesManagementCopy = {
  [Key in keyof typeof KURDISH_COPY]: string;
};

const LinktreesGrid = dynamic(
  () =>
    import("@/components/business/LinktreesGrid").then((module) => ({
      default: module.LinktreesGrid,
    })),
  { ssr: false, loading: PageManagementCollectionFallback },
);
const LinktreesTable = dynamic(
  () =>
    import("@/components/business/LinktreesTable").then((module) => ({
      default: module.LinktreesTable,
    })),
  { ssr: false, loading: PageManagementCollectionFallback },
);

export interface LinktreesManagementPageProps {
  headerControls?: ReactNode;
  linktrees: LinktreeListItem[];
  linktreeCount: number;
  totalViews: number;
  uniqueViews: number;
  totalClicks: number;
  uniqueClicks: number;
  contactActions: number | null;
  isLoading: boolean;
  analyticsLoading?: boolean;
  analyticsUnavailable?: boolean;
  pagesUnavailable?: boolean;
  locale?: "en" | "ar" | "ckb";
  isRefreshing: boolean;
  isClearingAnalytics: boolean;
  canClearAnalytics?: boolean;
  canDelete?: boolean;
  searchQuery: string;
  isSearchModalOpen: boolean;
  viewMode: "grid" | "table";
  onClearAnalytics: (ids: readonly string[]) => Promise<void>;
  onRefresh: (rethrow?: boolean) => void | Promise<void>;
  onSearchAction: () => void;
  onViewModeChange: (viewMode: "grid" | "table") => void;
  onCreate: () => void;
  onEdit: (id: string) => void;

  onDelete?: (id: string, uid: string, name: string) => void;
  onViewAnalytics: (id: string, name: string) => void;
  pinApiBase?: string;
  onPinnedChange?: (id: string, pinned: boolean) => void | Promise<void>;
  canPin?: boolean;
  canShareAnalytics?: boolean;
  onToggleArchive?: (id: string, isArchived: boolean) => void | Promise<void>;

  description?: string;
  createDisabled?: boolean;
  createDisabledTooltip?: string;
  publicPathPrefix?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  managementNavigation?: ReactNode;
  alternativeContent?: ReactNode;
  accentMode?: "tenant" | "platform";
  accentColor?: string | null;
  copy?: Partial<LinktreesManagementCopy>;
  listCopy?: Partial<LinktreeListCopy>;
  trafficLabels?: PageListTrafficLabels;
}

export function LinktreesManagementPage({
  linktrees,
  linktreeCount,
  isLoading,
  totalViews,
  uniqueViews,
  totalClicks,
  uniqueClicks,
  contactActions,
  analyticsLoading = isLoading,
  analyticsUnavailable = false,
  pagesUnavailable = false,
  locale = "ckb",
  headerControls,
  isRefreshing,
  isClearingAnalytics,
  canClearAnalytics = true,
  canDelete,
  searchQuery,
  isSearchModalOpen,
  viewMode,
  onClearAnalytics,
  onRefresh,
  onSearchAction,
  onViewModeChange,
  onCreate,
  onEdit,

  onDelete,
  onViewAnalytics,
  onToggleArchive,
  pinApiBase = "/api/linktrees",
  onPinnedChange,
  canPin = true,
  canShareAnalytics = true,

  description,
  createDisabled = false,
  createDisabledTooltip,
  publicPathPrefix,
  emptyTitle,
  emptyDescription,
  managementNavigation,
  alternativeContent,
  accentMode = "tenant",
  accentColor,
  copy,
  listCopy,
  trafficLabels,
}: LinktreesManagementPageProps) {
  const [pinVersion, setPinVersion] = useState(0);
  const pinControl = usePagePinning(pinApiBase, locale, async (id, pinned) => {
    if (onPinnedChange) await onPinnedChange(id, pinned);
    else await onRefresh(true);
    setPinVersion((version) => version + 1);
  });
  const labels = { ...KURDISH_COPY, ...copy };
  const pending = isLoading || analyticsLoading || isRefreshing;
  const loadingCopy = linktreeStatsCopy(locale);
  const [archiveFilter, setArchiveFilter] = useState<"active" | "archived">(
    "active",
  );
  const supportsArchive = Boolean(onToggleArchive);
  const displayedLinktrees = useMemo(() => {
    if (!supportsArchive) return sortLinktreesForDashboard(linktrees);
    return sortLinktreesForDashboard(linktrees).filter((item) =>
      archiveFilter === "archived"
        ? Boolean(item.is_archived)
        : !item.is_archived,
    );
  }, [archiveFilter, linktrees, supportsArchive]);
  const canDeletePages = canDelete ?? Boolean(onDelete);
  const canSelect = canClearAnalytics || canDeletePages;
  const selectionScope = JSON.stringify([pinApiBase, archiveFilter, searchQuery, canClearAnalytics, canDeletePages]);
  const selection = usePageSelectionState(selectionScope);
  const availableIds = new Set(displayedLinktrees.map((item) => item.id));
  const selectedIds = selection.ids.filter((id) => availableIds.has(id));
  const bulkDelete = useDeleteSelectedPages({
    apiBase: pinApiBase, enabled: canDeletePages && !pending && !isClearingAnalytics,
    onSelectionChange: selection.select, refresh: async () => { await onRefresh(true); },
  });
  const selectionDisabled = pending || isClearingAnalytics || bulkDelete.deleting;
  const selectedSet = new Set(selectedIds);
  const deletableIds = displayedLinktrees.filter((item) => selectedSet.has(item.id) && item.uid !== "id" && !item.is_default).map((item) => item.id);
  const selectionControl = canSelect ? {
    ids: new Set(selectedIds), disabled: selectionDisabled, selectLabel: pageSelectionCopy(locale).select,
    toggle: selection.toggle,
  } : null;
  const archived = supportsArchive && archiveFilter === "archived";
  const usesPlatformAccent = accentMode === "platform";
  const listProps = {
    data: displayedLinktrees,
    pagination: {
      mode: "client" as const,
      pageSize: PAGE_MANAGEMENT_PAGE_SIZE,
      resetKey: `${pinVersion}:${archiveFilter}:${searchQuery}`,
    },
    isLoading: isLoading || isRefreshing || bulkDelete.deleting,
    onEdit,

    onDelete: canDeletePages ? onDelete : undefined,
    onViewAnalytics,
    sharing: canShareAnalytics
      ? {
          apiBase: pinApiBase,
          locale,
          disabled: isLoading || isRefreshing,
          accentColor,
          platformTheme: usesPlatformAccent,
          headerControls,
        }
      : undefined,
    pinControl: canPin
      ? { ...pinControl, disabled: isLoading || isRefreshing }
      : undefined,

    publicPathPrefix,

    showLinktreeMeta: true,
    viewActionLabel: labels.analytics,
    emptyTitle: archived ? labels.noArchived : emptyTitle,
    emptyDescription: archived ? labels.archivedDescription : emptyDescription,
    sponsorKrdTheme: usesPlatformAccent,
    listCopy,
    trafficLabels,
  };

  return (
      <PageSelectionContext.Provider value={selectionControl}>
      <LinktreeStats
        pages={linktreeCount}
        views={totalViews}
        visitors={uniqueViews}
        clicks={totalClicks}
        clickers={uniqueClicks}
        contacts={contactActions}
        loading={pending}
        unavailable={analyticsUnavailable}
        pagesUnavailable={pagesUnavailable}
        locale={locale}
      />

      {managementNavigation}
      {alternativeContent ?? (
        <PageManagementSection
          title={labels.title}
          description={description ?? labels.description}
          icon={<FileText className="size-5" />}
          toolbar={
            <ManagementToolbar
              labels={labels}
              searchQuery={searchQuery}
              isSearchModalOpen={isSearchModalOpen}
              viewMode={viewMode}
              onSearchAction={onSearchAction}
              onViewModeChange={onViewModeChange}
              onCreate={onCreate}
              archiveFilter={archiveFilter}
              onArchiveFilterChange={
                supportsArchive ? setArchiveFilter : undefined
              }
              createDisabled={createDisabled}
              createDisabledTooltip={
                createDisabledTooltip ?? labels.limitReached
              }
              accentMode={accentMode}
              leadingAction={canSelect && <PageSelectionActions key={selectionScope} ids={selectedIds} locale={locale} disabled={selectionDisabled}
                onSelectAll={() => selection.select(displayedLinktrees.map((item) => item.id))}
                onDeselect={selection.clear}
                onDelete={canClearAnalytics ? onClearAnalytics : undefined}
                onDeleteRecords={canDeletePages ? bulkDelete.remove : undefined}
                deletableIds={deletableIds} />}

            />
          }
        >
          {!pending && (pagesUnavailable || analyticsUnavailable) && <RequestErrorNotice message={loadingCopy.loadFailed} />}
          <PageManagementCollection loading={pending || bulkDelete.deleting} viewMode={viewMode}
            selectable={Boolean(selectionControl)} columns={selectionControl ? 9 : 8}
            loadingLabel={viewMode === "grid"
              ? listCopy?.loadingCards ?? loadingCopy.loadingCards
              : listCopy?.loadingTable ?? loadingCopy.loadingTable}>
          {viewMode === "grid" ? (
            <LinktreesGrid {...listProps} />
          ) : (
            <LinktreesTable {...listProps} />
          )}
          </PageManagementCollection>
        </PageManagementSection>
      )}
      </PageSelectionContext.Provider>
  );
}
