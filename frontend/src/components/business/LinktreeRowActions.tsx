"use client";

import { PageListActions } from "@/components/shared/PageListActions";
import { Eye, Edit, Trash2, ExternalLink } from "lucide-react";
import type { LinktreeListItem } from "@linktree/types";
import { GridCardActionButton } from "@/components/shared/GridCardActionButton";
import { PagePinButton, type PagePinControl } from "@/components/shared/PagePinButton";
import { AnalyticsShareButton, type AnalyticsSharingControl } from "@/features/analytics-sharing/components/AnalyticsShareButton";

export function LinktreeRowActions({ item, onEdit, onDelete, onViewAnalytics, pinControl, sharing, viewActionLabel, editLabel, deleteLabel, onOpen, openLabel }: {
  item: LinktreeListItem;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, uid: string, name: string) => void;
  onViewAnalytics?: (id: string, name: string) => void;
  pinControl?: PagePinControl;
  sharing?: AnalyticsSharingControl;
  viewActionLabel: string;
  editLabel: string;
  deleteLabel: string;
  onOpen?: () => void;
  openLabel?: string;
}) {
  return (
    <PageListActions variant="table">
      <PagePinButton id={item.id} pinned={item.is_pinned} control={pinControl} />
      {onViewAnalytics && <GridCardActionButton presentation="table" stopPropagation label={viewActionLabel} icon={Eye} tone="sky" onClick={() => onViewAnalytics(item.id, item.name)} />}
      {onEdit && <GridCardActionButton presentation="table" stopPropagation label={editLabel} icon={Edit} tone="amber" onClick={() => onEdit(item.id)} />}
      <AnalyticsShareButton id={item.id} control={sharing} />
      {onDelete && item.uid !== "id" && !item.is_default && <GridCardActionButton presentation="table" stopPropagation label={deleteLabel} icon={Trash2} tone="red" onClick={() => onDelete(item.id, item.uid, item.name)} />}
      {onOpen && openLabel && <GridCardActionButton presentation="table" stopPropagation label={openLabel} icon={ExternalLink} tone="neutral" onClick={onOpen} />}
    </PageListActions>
  );
}
