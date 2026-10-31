"use client";

import { PageSelectionCheckbox, usePageSelection } from "@/components/shared/PageSelection";
import { PageListName } from "@/components/shared/PageListName";
import { PageListMobileCard } from "@/components/shared/PageListMobileCard";
import { LinktreeRowActions } from "./LinktreeRowActions";
import { memo, useCallback, useState, type ComponentType } from "react";
import {
  type AnalyticsSharingControl,
} from "@/features/analytics-sharing/components/AnalyticsShareButton";
import {
  type PagePinControl,
} from "@/components/shared/PagePinButton";
import { pageListLogo } from "@/components/shared/page-list-logo";
import { PageListImage } from "@/components/shared/PageListImage";
import { PageListUrl } from "@/components/shared/PageListUrl";
import { PageListTraffic } from "@/components/shared/PageListTraffic";

import { Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { formatDate, getAbsoluteUrl } from "@/lib/utils/linktree-utils";
import {
  ManagementTable,
  PAGE_LIST_ACTION_COLUMN_WIDTH,
  MANAGEMENT_TABLE_ROW_CLASS,
  type ManagementTableColumn,
  type ManagementTablePagination,
} from "@/components/shared/ManagementTable";
import {
  LINKTREE_TRAFFIC_LABELS,
  LinktreeMetaBadges,
  type LinktreeMetaBadgesProps,
  type PageListTrafficLabels,
} from "@/features/link-editor/components/LinktreeMeta";
import type { LinktreeListItem as Linktree } from "@linktree/types";
import {
  KURDISH_LINKTREE_LIST_COPY,
  type LinktreeListCopy,
} from "@/features/link-editor/components/linktree-list-copy";

interface LinktreesTableProps {
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
  /**
   * Opt in when `data` holds real Linktree records. It unlocks the fields that
   * only that projection fills in: template and the age badge.
   */
  showLinktreeMeta?: boolean;
  /** Use the complete shared list treatment for any supported public page. */
  showPageMeta?: boolean;
  MetaBadgesComponent?: ComponentType<LinktreeMetaBadgesProps>;
  trafficLabels?: PageListTrafficLabels;
  emptyDescription?: string;
  pagination?: ManagementTablePagination;

  listCopy?: Partial<LinktreeListCopy>;
}

/**
 * The header cells, in order.
 *
 * Both optional columns are table-level decisions rather than per-row ones, and
 * they are dropped from this list rather than rendered conditionally, so the
 * header count and the `<td>`s in `TableRow` cannot drift apart and shear the
 * columns.
 */
function buildColumns(
  displaysPageMeta: boolean,
  showTraffic: boolean,
  trafficLabels: PageListTrafficLabels,
  labels: LinktreeListCopy,
): ManagementTableColumn[] {
  return [
    { key: "image", header: labels.image, width: "w-16 sm:w-20" },
    { key: "name", header: labels.name, width: "w-32 sm:w-40" },
    {
      key: "subtitle",
      header: labels.subtitle,
      width: "w-32 lg:w-40",
      hideBelow: "md",
    },
    ...(displaysPageMeta
      ? []
      : ([
          { key: "slug", header: "Slug", width: "w-24", hideBelow: "lg" },
        ] as ManagementTableColumn[])),
    { key: "link", header: labels.link, width: "w-32 sm:w-40 lg:w-48" },
    ...(showTraffic
      ? ([
          {
            key: "traffic",
            header: trafficLabels.column,
            width: "w-24",
          },
        ] as ManagementTableColumn[])
      : []),
    { key: "created", header: labels.created, width: "w-28", hideBelow: "xl" },
    { key: "updated", header: labels.updated, width: "w-28", hideBelow: "xl" },
    {
      key: "actions",
      header: labels.actions,
      width: PAGE_LIST_ACTION_COLUMN_WIDTH,
    },
  ];
}

function getPublicIdentifier(item: Linktree): string {
  return item.public_identifier?.trim() || item.seo_name?.trim() || item.uid;
}

// 1. Memoized table row component for better performance
// Uses GPU rendering and content-visibility to prevent scrolling lag
const TableRow = memo(function TableRow({
  item,
  onEdit,

  onDelete,
  onViewAnalytics,
  pinControl,
  sharing,

  copiedUid,
  onCopy,
  formatDate,
  viewActionLabel,
  publicPathPrefix,
  showPageMeta,
  showTraffic,
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

  copiedUid: string | null;
  onCopy: (uid: string, e: React.MouseEvent) => void;
  formatDate: (dateString: string) => string;
  viewActionLabel: string;
  publicPathPrefix: string;
  showPageMeta: boolean;
  showTraffic: boolean;
  MetaBadgesComponent: ComponentType<LinktreeMetaBadgesProps>;
  trafficLabels: PageListTrafficLabels;
  labels: LinktreeListCopy;
  metaCopy?: Partial<LinktreeListCopy>;
}) {
  const selection = usePageSelection();
  const publicIdentifier = getPublicIdentifier(item);
  const handleView = useCallback(
    (uid: string) => {
      const url = getAbsoluteUrl(uid, publicPathPrefix);
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [publicPathPrefix],
  );

  return (
    <tr
      className={MANAGEMENT_TABLE_ROW_CLASS}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "80px",
      }}
    >
      {selection && <td className="px-2 py-3"><PageSelectionCheckbox id={item.id} name={item.name} /></td>}
      <td className="px-2 sm:px-3 py-3">
        <div className="relative w-8 h-8 sm:w-10 sm:h-10 mx-auto">
          <PageListImage
            src={pageListLogo(item.image, item.business_default_avatar)}
            name={item.name}
            variant="table"
          />
        </div>
      </td>
      <td className="px-2 sm:px-3 py-3">
        <span className="text-xs sm:text-sm font-semibold text-gray-900 wrap-break-word block mb-1">
          <PageListName name={item.name} verified={item.template_config?.verification_badge === true} verificationLabel={labels.verificationBadge} />
        </span>
        <MetaBadgesComponent
          item={item}
          showAgeBadge={showPageMeta}
          showTemplate={showPageMeta}
          listCopy={metaCopy}
        />
      </td>
      <td className="px-2 sm:px-3 py-3 hidden md:table-cell">
        {item.subtitle?.trim() && (
          <div className="text-xs text-gray-600 wrap-break-word line-clamp-2">
            {item.subtitle?.trim()}
          </div>
        )}
        {item.description?.trim() && (
          <div className="mt-0.5 text-[11px] text-gray-400 wrap-break-word line-clamp-2">
            {item.description?.trim()}
          </div>
        )}
      </td>
      {!showPageMeta && (
        <td className="px-2 sm:px-3 py-3 hidden lg:table-cell">
          {item.seo_name?.trim() && (
            <div className="text-xs text-gray-700 font-mono break-all">
              {item.seo_name?.trim()}
            </div>
          )}
        </td>
      )}
      <td className="px-2 sm:px-3 py-3">
        <PageListUrl
          url={getAbsoluteUrl(publicIdentifier, publicPathPrefix)}
          displayUrl={`${publicPathPrefix}/${publicIdentifier}`}
          labels={labels}
          copied={copiedUid === publicIdentifier}
          onCopy={(event) => onCopy(publicIdentifier, event)}
          onOpen={() => handleView(publicIdentifier)}
        />
      </td>
      {showTraffic && (
        <td className="px-2 sm:px-3 py-3 hidden sm:table-cell">
          <PageListTraffic
            views={item.analytics?.unique_views ?? 0}
            interactions={item.analytics?.unique_clicks ?? 0}
            labels={trafficLabels}
            compact
          />
        </td>
      )}
      <td className="px-2 sm:px-3 py-3 hidden xl:table-cell">
        <div className="text-xs text-gray-600 wrap-break-word">
          {formatDate(item.created_at)}
        </div>
      </td>
      <td className="px-2 sm:px-3 py-3 hidden xl:table-cell">
        <div className="text-xs text-gray-600 wrap-break-word">
          {formatDate(item.updated_at)}
        </div>
      </td>
      <td className="px-2 sm:px-3 py-3">
        <LinktreeRowActions item={item} onEdit={onEdit} onDelete={onDelete} onViewAnalytics={onViewAnalytics}
          pinControl={pinControl} sharing={sharing} viewActionLabel={viewActionLabel} editLabel={labels.editTable} deleteLabel={labels.delete} openLabel={labels.viewButton} onOpen={() => handleView(publicIdentifier)} />
      </td>
    </tr>
  );
});

// 2. Mobile-friendly card view defined OUTSIDE the parent component for react optimization
// Wrapped in React.memo to prevent garbage collection and unmounting/mounting overhead on parent render
const MobileCard = memo(function MobileCard({
  item,
  onEdit,

  onDelete,
  onViewAnalytics,
  pinControl,
  sharing,

  copiedUid,
  onCopy,
  onView,
  formatDate,
  viewActionLabel,
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

  copiedUid: string | null;
  onCopy: (uid: string, e: React.MouseEvent) => void;
  onView: (uid: string) => void;
  formatDate: (dateString: string) => string;
  viewActionLabel: string;
  publicPathPrefix: string;
  showPageMeta: boolean;
  MetaBadgesComponent: ComponentType<LinktreeMetaBadgesProps>;
  trafficLabels: PageListTrafficLabels;
  labels: LinktreeListCopy;
  metaCopy?: Partial<LinktreeListCopy>;
}) {
  const publicIdentifier = getPublicIdentifier(item);
  return (
    <PageListMobileCard
      title={item.name}
      verified={item.template_config?.verification_badge === true}
      verificationLabel={labels.verificationBadge}
      selection={<PageSelectionCheckbox id={item.id} name={item.name} />}
      image={<PageListImage src={pageListLogo(item.image, item.business_default_avatar)} name={item.name} variant="table" />}
      badges={<MetaBadgesComponent item={item} showAgeBadge={showPageMeta} showTemplate={showPageMeta} listCopy={metaCopy} />}
      description={item.subtitle?.trim() ? <p className="line-clamp-2 text-xs text-gray-600 [overflow-wrap:anywhere]" dir="auto">{item.subtitle.trim()}</p> : undefined}
      actions={<LinktreeRowActions item={item} onEdit={onEdit} onDelete={onDelete} onViewAnalytics={onViewAnalytics}
        pinControl={pinControl} sharing={sharing} viewActionLabel={viewActionLabel} editLabel={labels.editTable} deleteLabel={labels.delete} openLabel={labels.viewButton} onOpen={() => onView(publicIdentifier)} />}
    >
      <PageListUrl url={getAbsoluteUrl(publicIdentifier, publicPathPrefix)} displayUrl={`${publicPathPrefix}/${publicIdentifier}`} labels={labels}
        copied={copiedUid === publicIdentifier} onCopy={(event) => onCopy(publicIdentifier, event)} onOpen={() => onView(publicIdentifier)} />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {item.created_at && <span>{labels.created} {formatDate(item.created_at)}</span>}
        {item.updated_at && <span>{labels.updated} {formatDate(item.updated_at)}</span>}
      </div>
      {showPageMeta && item.analytics && <PageListTraffic views={item.analytics.unique_views} interactions={item.analytics.unique_clicks} labels={trafficLabels} compact />}
    </PageListMobileCard>
  );
});

export const LinktreesTable = memo(function LinktreesTable({
  publicPathPrefix = "/linktree",
  data = [],
  isLoading = false,
  onEdit,

  onDelete,
  onViewAnalytics,
  pinControl,
  sharing,
  viewActionLabel = "ئامار",
  emptyTitle = "هیچ داتایەک نەدۆزرایەوە",
  emptyDescription = "هیچ داتایەک بۆ پیشاندان نییە.",
  pagination = { mode: "client" },
  showLinktreeMeta = false,
  showPageMeta,
  MetaBadgesComponent = LinktreeMetaBadges,
  trafficLabels = LINKTREE_TRAFFIC_LABELS,

  listCopy,
}: LinktreesTableProps) {
  const labels = { ...KURDISH_LINKTREE_LIST_COPY, ...listCopy };
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const displaysPageMeta = showPageMeta ?? showLinktreeMeta;

  // The optional slug and traffic columns are table-level decisions so every
  // body row remains aligned with the header, even when one row has no totals.
  const showTraffic = displaysPageMeta && data.some((item) => item.analytics);
  const selection = usePageSelection();
  const columns = buildColumns(
    displaysPageMeta,
    showTraffic,
    trafficLabels,
    labels,
  );

  if (selection) columns.unshift({ key: "selection", header: <span className="sr-only">{selection.selectLabel}</span>, width: "w-12" });
  const formatDateString = useCallback((dateString: string) => {
    return formatDate(dateString);
  }, []);

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

  const handleView = useCallback(
    (uid: string) => {
      const url = getAbsoluteUrl(uid, publicPathPrefix);
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [publicPathPrefix],
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

  return (
    <ManagementTable
      data={data}
      columns={columns}
      getRowKey={(item) => item.id}
      isLoading={isLoading}
      skeletonLeadingCell={selection ? "checkbox" : "avatar"}
      loadingLabel={labels.loadingTable}
      paginationCopy={{
        of: labels.paginationOf,
        previous: labels.paginationPrevious,
        next: labels.paginationNext,
      }}
      minWidth="min-w-180"
      pagination={pagination}
      empty={{
        icon: LinkIcon,
        title: emptyTitle,
        description: emptyDescription,
      }}
      renderRow={(item) => (
        <TableRow
          item={item}
          onEdit={onEdit}

          onDelete={handleDelete}
          onViewAnalytics={onViewAnalytics}
          pinControl={pinControl}
          sharing={sharing}

          copiedUid={copiedUid}
          onCopy={handleCopyUrl}
          formatDate={formatDateString}
          viewActionLabel={viewActionLabel}
          publicPathPrefix={publicPathPrefix}
          showPageMeta={displaysPageMeta}
          showTraffic={showTraffic}
          MetaBadgesComponent={MetaBadgesComponent}
          trafficLabels={trafficLabels}
          labels={labels}
          metaCopy={listCopy}
        />
      )}
      renderCard={(item) => (
        <MobileCard
          item={item}
          onEdit={onEdit}

          onDelete={handleDelete}
          onViewAnalytics={onViewAnalytics}
          pinControl={pinControl}
          sharing={sharing}

          copiedUid={copiedUid}
          onCopy={handleCopyUrl}
          onView={handleView}
          formatDate={formatDateString}
          viewActionLabel={viewActionLabel}
          publicPathPrefix={publicPathPrefix}
          showPageMeta={displaysPageMeta}
          MetaBadgesComponent={MetaBadgesComponent}
          trafficLabels={trafficLabels}
          labels={labels}
          metaCopy={listCopy}
        />
      )}
    />
  );
});
