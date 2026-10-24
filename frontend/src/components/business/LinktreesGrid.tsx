"use client";
import { PageListActions } from "@/components/shared/PageListActions";
import { PageListDescription } from "@/components/shared/PageListDescription";
import { PageSelectionCheckbox, usePageSelection } from "@/components/shared/PageSelection";
import { PageListCardMedia } from "@/components/shared/PageListCardMedia";
import { pageListLogo } from "@/components/shared/page-list-logo";

import {
  memo,
  useCallback,
  useState,
  useMemo,
  type ComponentType,
} from "react";
import {
  AnalyticsShareButton,
  type AnalyticsSharingControl,
} from "@/features/analytics-sharing/components/AnalyticsShareButton";
import {
  PagePinButton,
  type PagePinControl,
} from "@/components/shared/PagePinButton";
import { LinktreeListBanner } from "@/features/link-editor/components/LinktreeListBanner";
import { PageListCardHeader } from "@/components/shared/PageListCardHeader";
import { PageListUrl } from "@/components/shared/PageListUrl";
import { PageListTraffic } from "@/components/shared/PageListTraffic";

import {
  Trash2,
  Eye,
  Edit,
  ExternalLink,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { formatDate, getAbsoluteUrl } from "@/lib/utils/linktree-utils";
import {
  LINKTREE_TRAFFIC_LABELS,
  LinktreeMetaBadges,
  LinktreeMetaField,
  type LinktreeMetaBadgesProps,
  type PageListTrafficLabels,
} from "@/components/business/LinktreeMeta";
import { PageCollectionSkeleton } from "@/components/shared/PageCollectionSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ManagementTablePagination } from "@/components/shared/ManagementTable";
import { ManagementGrid } from "@/components/shared/ManagementGrid";
import { ManagementCard } from "@/components/shared/ManagementCard";
import { GridCardActionButton } from "@/components/shared/GridCardActionButton";
import type { LinktreeListItem as Linktree } from "@linktree/types";
import {
  KURDISH_LINKTREE_LIST_COPY,
  type LinktreeListCopy,
} from "@/features/link-editor/components/linktree-list-copy";

interface LinktreesGridProps {
  publicPathPrefix?: string;

  data?: Linktree[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;

  onDelete?: (id: string, uid: string, name: string) => void;
  onViewAnalytics?: (id: string, name: string) => void;
  pinControl?: PagePinControl;
  sharing?: AnalyticsSharingControl;
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

  listCopy?: Partial<LinktreeListCopy>;
}

function getPublicIdentifier(item: Linktree): string {
  return item.public_identifier?.trim() || item.seo_name?.trim() || item.uid;
}

// Memoized card component for better performance
const LinktreeCard = memo(function LinktreeCard({
  item,
  onEdit,

  onDelete,
  onViewAnalytics,
  pinControl,
  sharing,

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

  onDelete?: (id: string, uid: string, name: string) => void;
  onViewAnalytics?: (id: string, name: string) => void;
  pinControl?: PagePinControl;
  sharing?: AnalyticsSharingControl;

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
  const url = useMemo(
    () => getAbsoluteUrl(publicIdentifier, publicPathPrefix),
    [publicIdentifier, publicPathPrefix],
  );
  const handleView = useCallback(() => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, [url]);

  const showPrimaryActionLabels = true;
  return (
    <ManagementCard
      intrinsicHeight={480}
      className="text-center"
      media={
        <PageListCardMedia
          action={
            <PagePinButton
              iconOnly
              id={item.id}
              pinned={item.is_pinned}
              control={pinControl}
            />
          }
        >
          <LinktreeListBanner config={item.template_config} />
          <div className="absolute left-3 top-3 z-10"><PageSelectionCheckbox id={item.id} name={item.name} /></div>
        </PageListCardMedia>
      }
    >
      <PageListCardHeader
        name={item.name}
        logo={pageListLogo(item.image, item.business_default_avatar)}
        subtitle={item.subtitle}
        badges={
          <MetaBadgesComponent
            item={item}
            showAgeBadge={showPageMeta}
            showTemplate={showPageMeta}
            listCopy={metaCopy}
            className="justify-center"
          />
        }
      />

      <PageListDescription>{item.description}</PageListDescription>

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
          centered
          views={item.analytics.unique_views}
          interactions={item.analytics.unique_clicks}
          labels={trafficLabels}
        />
      )}

      {/* Actions Section */}
<PageListActions variant="grid">
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
        <AnalyticsShareButton
          id={item.id}
          control={sharing}
          presentation="grid"
        />

        {onDelete && item.uid !== "id" && !item.is_default ? (
          <GridCardActionButton
            label={labels.delete}
            icon={Trash2}
            tone="red"
            compact
            onClick={() => onDelete(item.id, item.uid, item.name)}
          />
        ) : null}

        <GridCardActionButton
          label={labels.viewButton}
          icon={ExternalLink}
          tone="neutral"
          compact
          onClick={handleView}
        />
      </PageListActions>
    </ManagementCard>
  );
});

export const LinktreesGrid = memo(function LinktreesGrid({
  publicPathPrefix = "/linktree",

  data = [],
  isLoading = false,
  onEdit,

  onDelete,
  onViewAnalytics,
  pinControl,
  sharing,
  viewActionLabel = "ئامار",
  emptyTitle = "هیچ پەیجەک نەدۆزرایەوە",
  emptyDescription = "دەست پێ بکە بە دروستکردنی پەیج یەکەم",
  showLinktreeMeta = false,
  showPageMeta,
  MetaBadgesComponent = LinktreeMetaBadges,
  trafficLabels = LINKTREE_TRAFFIC_LABELS,
  pagination = { mode: "client" },

  listCopy,
}: LinktreesGridProps) {
  const selection = usePageSelection();
  const labels = { ...KURDISH_LINKTREE_LIST_COPY, ...listCopy };
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
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
      <PageCollectionSkeleton
        selectable={Boolean(selection)}
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

            onDelete={handleDelete}
            onViewAnalytics={onViewAnalytics}
            pinControl={pinControl}
            sharing={sharing}

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
    </>
  );
});
