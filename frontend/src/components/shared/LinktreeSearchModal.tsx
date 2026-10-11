"use client";

import { useMemo } from "react";
import type { LinktreeListItem } from "@linktree/types";
import {
  ManagementSearchModal,
  type ManagementSearchModalCopy,
  type ManagementSearchModalProps,
} from "./ManagementSearchModal";

export type LinktreeSearchModalCopy = ManagementSearchModalCopy;
export interface LinktreeSearchModalProps
  extends Omit<ManagementSearchModalProps, "items" | "onSelect"> {
  items: LinktreeListItem[];
  onSelect: (item: LinktreeListItem) => void;
  publicPathPrefix?: string;
}

/** Linktree metadata adapter for the shared management search UI. */
export function LinktreeSearchModal({
  items,
  onSelect,
  publicPathPrefix = "/linktree",
  ...props
}: LinktreeSearchModalProps) {
  const searchItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        subtitle: `${publicPathPrefix}/${item.seo_name || item.uid}`,
        searchTerms: [item.uid, item.seo_name || ""],
      })),
    [items, publicPathPrefix],
  );
  return (
    <ManagementSearchModal
      {...props}
      items={searchItems}
      onSelect={(item) => {
        const selected = items.find((candidate) => candidate.id === item.id);
        if (selected) onSelect(selected);
      }}
    />
  );
}
