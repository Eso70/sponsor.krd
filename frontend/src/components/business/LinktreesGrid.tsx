"use client";

import {
  memo,
  useCallback,
  useState,
  useMemo,
  type ComponentType,
} from "react";
import { PageListImage } from "@/components/shared/PageListImage";
import { PageListUrl } from "@/components/shared/PageListUrl";
import { PageListTraffic } from "@/components/shared/PageListTraffic";

import {
  Archive,
  ArchiveRestore,
  CirclePause,
  CirclePlay,
  Trash2,
  Eye,
  CopyPlus,
  DollarSign,
  Ellipsis,
  Edit,
  ExternalLink,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { formatDate, getAbsoluteUrl } from "@/lib/utils/linktree-utils";
import {
  LINKTREE_TRAFFIC_LABELS,
  LinktreeCampaignButton,
  LinktreeMetaBadges,
  LinktreeMetaField,
  type LinktreeMetaBadgesProps,
  type PageListTrafficLabels,
} from "@/components/business/LinktreeMeta";
import { SkeletonLinktreeGrid } from "@/components/shared/SkeletonPageLayouts";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tooltip } from "@/components/shared/Tooltip";
import type { ManagementTablePagination } from "@/components/shared/ManagementTable";
import { ManagementGrid } from "@/components/shared/ManagementGrid";
import { ManagementCard } from "@/components/shared/ManagementCard";
import { GridCardActionButton } from "@/components/shared/GridCardActionButton";
import { CampaignProfitModal } from "@/features/campaigns/components/CampaignProfitModal";
import type { CampaignProfitCopy } from "@/features/campaigns/components/CampaignProfitModal";
import type { LinktreeListItem as Linktree } from "@linktree/types";
import {
  KURDISH_LINKTREE_LIST_COPY,
  type LinktreeListCopy,
} from "@/features/link-editor/components/linktree-list-copy";

interface LinktreesGridProps {
  publicPathPrefix?: string;
  apiBasePath?: string;
  data?: Linktree[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDuplicate?: (item: Linktree) => void;
  onDelete?: (id: string, uid: string, name: string) => void;
  onViewAnalytics?: (id: string, name: string) => void;
  viewActionLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /**
   * Opt in when `data` holds real Linktree records. It unlocks the fields that
   * only that projection fills in: slug, creation and update dates, template
   * and the age badge.
   */
  showLinktreeMeta?: boolean;
  /**
   * Enables the complete shared public-page card treatment for another page
   * domain without pretending that its metadata belongs to a Linktree.
   */
  showPageMeta?: boolean;
  MetaBadgesComponent?: ComponentType<LinktreeMetaBadgesProps>;
  trafficLabels?: PageListTrafficLabels;
  pagination?: ManagementTablePagination;
  onToggleCampaign?: (id: string, isCampaignActive: boolean) => void;
  onToggleArchive?: (id: string, isArchived: boolean) => void;
  onToggleStatus?: (id: string, status: "active" | "inactive") => void;
  sponsorKrdTheme?: boolean;
  listCopy?: Partial<LinktreeListCopy>;
  profitCopy?: Partial<CampaignProfitCopy>;
  calendarLocale?: "ckb" | "ar" | "en";
}

function getPublicIdentifier(item: Linktree): string {
  return item.public_identifier?.trim() || item.seo_name?.trim() || item.uid;
}

// Memoized card component for better performance
const LinktreeCard = memo(function LinktreeCard({
  item,
  onEdit,
  onDuplicate,
  onDelete,
  onViewAnalytics,
  onViewProfit,
  onToggleCampaign,
  onToggleArchive,
  onToggleStatus,
  viewActionLabel,
  copiedUid,
  onCopy,
  publicPathPrefix,
  showPageMeta,
  MetaBadgesComponent,
  trafficLabels,
  labels,
  metaCopy,
}: {
  item: Linktree;
  onEdit?: (id: string) => void;
  onDuplicate?: (item: Linktree) => void;
  onDelete?: (id: string, uid: string, name: string) => void;
  onViewAnalytics?: (id: string, name: string) => void;
  onViewProfit: (item: Linktree) => void;
  onToggleCampaign?: (id: string, isCampaignActive: boolean) => void;
  onToggleArchive?: (id: string, isArchived: boolean) => void;
  onToggleStatus?: (id: string, status: "active" | "inactive") => void;
  viewActionLabel: string;
  copiedUid: string | null;
  onCopy: (uid: string, e: React.MouseEvent) => void;
  publicPathPrefix: string;
  showPageMeta: boolean;
  MetaBadgesComponent: ComponentType<LinktreeMetaBadgesProps>;
  trafficLabels: PageListTrafficLabels;
  labels: LinktreeListCopy;
  metaCopy?: Partial<LinktreeListCopy>;
}) {
  const publicIdentifier = getPublicIdentifier(item);
  const [showAllActions, setShowAllActions] = useState(false);
  const url = useMemo(
    () => getAbsoluteUrl(publicIdentifier, publicPathPrefix),
    [publicIdentifier, publicPathPrefix],
  );
  const handleView = useCallback(() => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, [url]);

  const isCampaignActive = !!item.is_campaign_active;
  const expandedActionCount =
    3 +
    Number(Boolean(onViewAnalytics)) +
    Number(Boolean(onEdit)) +
    Number(Boolean(onDuplicate)) +
    Number(Boolean(onToggleArchive) && !item.is_default) +
    Number(Boolean(onToggleStatus) && !item.is_default) +
    Number(Boolean(onDelete) && item.uid !== "id" && !item.is_default);
  const showPrimaryActionLabels = !showAllActions || expandedActionCount <= 6;
  const primaryActionLayout = showPrimaryActionLabels
    ? "min-w-0 flex-1 gap-1.5 px-2"
    : "min-w-0 flex-1";
  const expandedActionLayout =
    expandedActionCount <= 6 ? "w-8 shrink-0 sm:w-9" : "min-w-0 flex-1";

  return (
    <ManagementCard intrinsicHeight={320}>
      {/* Top right Campaign button */}
      {!item.is_archived && (onToggleCampaign || isCampaignActive) && (
        <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10">
          <LinktreeCampaignButton
            id={item.id}
            isActive={isCampaignActive}
            onToggle={onToggleCampaign}
            listCopy={metaCopy}
          />
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="relative shrink-0">
          <PageListImage
            src={
              item.image || item.business_default_avatar || item.business_logo
            }
            name={item.name}
          />
          {isCampaignActive && (
            <span
              className="absolute bottom-0 right-0 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
              title={labels.campaignActive}
            />
          )}
        </div>
        <div className="flex-1 min-w-0 pr-20 sm:pr-24">
          <h3 className="text-xs sm:text-base font-bold text-gray-900 truncate mb-0.5 sm:mb-1">
            {item.name}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-2 mb-1 sm:mb-1.5">
            {item.subtitle?.trim() || "—"}
          </p>
          <MetaBadgesComponent
            item={item}
            showAgeBadge={showPageMeta}
            showTemplate={showPageMeta}
            onToggleCampaign={onToggleCampaign}
            hideCampaignBadge={true}
            listCopy={metaCopy}
          />
        </div>
      </div>

      <p className="mb-2 line-clamp-2 text-xs text-gray-500 sm:mb-3">
        {item.description?.trim() || "—"}
      </p>

      <PageListUrl
        url={url}
        boxed
        labels={labels}
        copied={copiedUid === publicIdentifier}
        onCopy={(event) => onCopy(publicIdentifier, event)}
        onOpen={handleView}
      />

      {/* Details Section */}
      {showPageMeta && (
        <div className="mb-2 grid grid-cols-2 gap-2 sm:mb-3">
          <LinktreeMetaField
            label={labels.created}
            value={formatDate(item.created_at)}
          />
          <LinktreeMetaField
            label={labels.updated}
            value={formatDate(item.updated_at)}
          />
        </div>
      )}

      {/* Traffic Section */}
      {showPageMeta && item.analytics && (
        <PageListTraffic
          views={item.analytics.unique_views}
          interactions={item.analytics.unique_clicks}
          labels={trafficLabels}
        />
      )}

      {/* Actions Section */}
      <div className="mt-auto flex flex-nowrap items-center gap-1 sm:gap-1.5 pt-2 sm:pt-2.5 border-t border-gray-200 dark:border-white/10">
        {onViewAnalytics && (
          <GridCardActionButton
            label={viewActionLabel}
            icon={Eye}
            tone="sky"
            showLabel={showPrimaryActionLabels}
            onClick={() => onViewAnalytics(item.id, item.name)}
          />
        )}
        {onEdit && (
          <GridCardActionButton
            label={labels.edit}
            icon={Edit}
            tone="amber"
            showLabel={showPrimaryActionLabels}
            onClick={() => onEdit(item.id)}
          />
        )}

        {onDuplicate ? (
          <Tooltip content={labels.duplicate} side="top">
            <button
              onClick={() => onDuplicate(item)}
              className={`flex h-8 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 transition-all duration-200 hover:bg-indigo-500/20 hover:text-indigo-800 active:scale-95 sm:h-9 sm:rounded-xl dark:text-indigo-300 ${primaryActionLayout}`}
              aria-label={labels.duplicate}
            >
              <CopyPlus className="h-3.5 w-3.5" />
              {showPrimaryActionLabels ? (
                <span className="truncate text-xs font-medium">
                  {labels.duplicate}
                </span>
              ) : null}
            </button>
          </Tooltip>
        ) : null}

        {showAllActions ? (
          <>
            <Tooltip content={labels.profit} side="top">
              <button
                onClick={() => onViewProfit(item)}
                className={`flex h-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 transition-all duration-200 hover:bg-emerald-500/20 hover:text-emerald-800 active:scale-95 sm:h-9 sm:rounded-xl dark:text-emerald-300 ${expandedActionLayout}`}
                aria-label={labels.profit}
              >
                <DollarSign className="h-3.5 w-3.5" />
              </button>
            </Tooltip>

            {onToggleArchive && !item.is_default ? (
              <Tooltip
                content={item.is_archived ? labels.restore : labels.archive}
                side="top"
              >
                <button
                  onClick={() => onToggleArchive(item.id, !item.is_archived)}
                  className={`flex h-8 items-center justify-center rounded-lg border transition-all duration-200 active:scale-95 sm:h-9 sm:rounded-xl ${expandedActionLayout} ${
                    item.is_archived
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800 dark:text-emerald-300"
                      : "border-purple-500/30 bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 hover:text-purple-800 dark:text-purple-300"
                  }`}
                  aria-label={
                    metaCopy
                      ? item.is_archived
                        ? labels.restore
                        : labels.archive
                      : item.is_archived
                        ? "Restore from archive"
                        : "Archive"
                  }
                >
                  {item.is_archived ? (
                    <ArchiveRestore className="h-3.5 w-3.5" />
                  ) : (
                    <Archive className="h-3.5 w-3.5" />
                  )}
                </button>
              </Tooltip>
            ) : null}

            {onToggleStatus && !item.is_default ? (
              <Tooltip
                content={
                  item.status === "inactive"
                    ? labels.activate
                    : labels.deactivate
                }
                side="top"
              >
                <button
                  onClick={() =>
                    onToggleStatus(
                      item.id,
                      item.status === "inactive" ? "active" : "inactive",
                    )
                  }
                  className={`flex h-8 items-center justify-center rounded-lg border transition-all duration-200 active:scale-95 sm:h-9 sm:rounded-xl ${expandedActionLayout} ${
                    item.status === "inactive"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800 dark:text-emerald-300"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 hover:text-rose-800 dark:text-rose-300"
                  }`}
                  aria-label={
                    metaCopy
                      ? item.status === "inactive"
                        ? labels.activate
                        : labels.deactivate
                      : item.status === "inactive"
                        ? "Activate page"
                        : "Deactivate page"
                  }
                >
                  {item.status === "inactive" ? (
                    <CirclePlay className="h-3.5 w-3.5" />
                  ) : (
                    <CirclePause className="h-3.5 w-3.5" />
                  )}
                </button>
              </Tooltip>
            ) : null}
          </>
        ) : null}

        {onDelete && item.uid !== "id" && !item.is_default ? (
          <Tooltip content={labels.delete} side="top">
            <button
              onClick={() => onDelete(item.id, item.uid, item.name)}
              className={`flex h-8 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-700 transition-all duration-200 hover:bg-red-500/20 hover:text-red-800 active:scale-95 sm:h-9 sm:rounded-xl dark:text-red-300 ${showAllActions ? expandedActionLayout : "w-8 shrink-0 sm:w-9"}`}
              aria-label={labels.delete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        ) : null}

        <Tooltip content={labels.view} side="top">
          <button
            onClick={handleView}
            className={`flex h-8 items-center justify-center rounded-lg border border-slate-300/70 bg-slate-100/80 text-slate-700 transition-all duration-200 hover:bg-slate-200 hover:text-slate-900 active:scale-95 sm:h-9 sm:rounded-xl dark:border-white/15 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white ${showAllActions ? expandedActionLayout : "w-8 shrink-0 sm:w-9"}`}
            aria-label={labels.viewButton}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </Tooltip>

        <Tooltip
          content={showAllActions ? labels.hideActions : labels.moreActions}
          side="top"
        >
          <button
            type="button"
            onClick={() => setShowAllActions((current) => !current)}
            aria-label={labels.moreActions}
            aria-expanded={showAllActions}
            className={`flex h-8 items-center justify-center rounded-lg border border-slate-300/70 bg-slate-100/80 text-slate-700 transition-all duration-200 hover:bg-slate-200 hover:text-slate-900 active:scale-95 sm:h-9 sm:rounded-xl dark:border-white/15 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white ${showAllActions ? expandedActionLayout : "w-8 shrink-0 sm:w-9"}`}
          >
            <Ellipsis className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    </ManagementCard>
  );
});

export const LinktreesGrid = memo(function LinktreesGrid({
  publicPathPrefix = "/linktree",
  apiBasePath = "/api/linktrees",
  data = [],
  isLoading = false,
  onEdit,
  onDuplicate,
  onDelete,
  onViewAnalytics,
  viewActionLabel = "ئامار",
  emptyTitle = "هیچ پەیجەک نەدۆزرایەوە",
  emptyDescription = "دەست پێ بکە بە دروستکردنی پەیج یەکەم",
  showLinktreeMeta = false,
  showPageMeta,
  MetaBadgesComponent = LinktreeMetaBadges,
  trafficLabels = LINKTREE_TRAFFIC_LABELS,
  pagination = { mode: "client" },
  onToggleCampaign,
  onToggleArchive,
  onToggleStatus,
  sponsorKrdTheme = false,
  listCopy,
  profitCopy,
  calendarLocale,
}: LinktreesGridProps) {
  const labels = { ...KURDISH_LINKTREE_LIST_COPY, ...listCopy };
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [profitTarget, setProfitTarget] = useState<Linktree | null>(null);
  const displaysPageMeta = showPageMeta ?? showLinktreeMeta;
  const handleCopyUrl = useCallback(
    async (uid: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const url = getAbsoluteUrl(uid, publicPathPrefix);
      const success = await copyToClipboard(url);
      if (success) {
        setCopiedUid(uid);
        setTimeout(() => {
          setCopiedUid(null);
        }, 2000);
        toast.success(labels.linkCopied);
      } else {
        toast.error(labels.linkCopyFailed);
      }
    },
    [publicPathPrefix, labels.linkCopied, labels.linkCopyFailed],
  );

  const handleDelete = useCallback(
    (id: string, uid: string, name: string) => {
      if (uid === "id") {
        return;
      }
      if (onDelete) {
        onDelete(id, uid, name);
      }
    },
    [onDelete],
  );

  // Cards outlined where the real ones will land, so the grid does not jump
  // when they arrive.
  if (isLoading)
    return (
      <SkeletonLinktreeGrid
        count={6}
        showPageMeta={displaysPageMeta}
        loadingLabel={labels.loadingCards}
      />
    );

  if (data.length === 0) {
    return (
      <EmptyState
        icon={LinkIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <>
      <ManagementGrid
        data={data}
        getItemKey={(item) => item.id}
        pagination={pagination}
        paginationCopy={{
          of: labels.paginationOf,
          previous: labels.paginationPrevious,
          next: labels.paginationNext,
        }}
        desktopColumns={3}
        renderItem={(item) => (
          <LinktreeCard
            item={item}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={handleDelete}
            onViewAnalytics={onViewAnalytics}
            onViewProfit={setProfitTarget}
            onToggleCampaign={onToggleCampaign}
            onToggleArchive={onToggleArchive}
            onToggleStatus={onToggleStatus}
            viewActionLabel={viewActionLabel}
            copiedUid={copiedUid}
            onCopy={handleCopyUrl}
            publicPathPrefix={publicPathPrefix}
            showPageMeta={displaysPageMeta}
            MetaBadgesComponent={MetaBadgesComponent}
            trafficLabels={trafficLabels}
            labels={labels}
            metaCopy={listCopy}
          />
        )}
      />
      <CampaignProfitModal
        key={profitTarget?.id || "closed"}
        isOpen={Boolean(profitTarget)}
        onClose={() => setProfitTarget(null)}
        linktreeId={profitTarget?.id || ""}
        apiBasePath={apiBasePath}
        pageName={profitTarget?.name || ""}
        sponsorKrdTheme={sponsorKrdTheme}
        copy={profitCopy}
        calendarLocale={calendarLocale}
      />
    </>
  );
});
