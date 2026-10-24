"use client";

import type { ReactNode } from "react";

import {
  useManagementPagination,
  type ManagementTablePagination,
} from "@/components/shared/ManagementTable";
import type { TablePaginationCopy } from "@/components/shared/TablePagination";
import { ManagementGridLayout } from "./ManagementGridLayout";

interface ManagementGridProps<T> {
  data: T[];
  getItemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  pagination?: ManagementTablePagination;
  paginationCopy?: Partial<TablePaginationCopy>;
  desktopColumns?: 2 | 3;
  className?: string;
}

/**
 * Shared card-grid frame for dashboard management collections.
 *
 * It owns the responsive columns, joined card borders, surface colors, and
 * pagination so switching between a management table and grid never changes
 * the page size or visual language.
 */
export function ManagementGrid<T>({
  data,
  getItemKey,
  renderItem,
  pagination,
  paginationCopy,
  desktopColumns = 3,
  className = "",
}: ManagementGridProps<T>) {
  const { visibleData, footer } = useManagementPagination(
    data,
    pagination,
    paginationCopy,
  );

  return (
    <ManagementGridLayout
      className={className}
      desktopColumns={desktopColumns}
      footer={footer}
      items={visibleData.map((item) => ({
        key: getItemKey(item),
        content: renderItem(item),
      }))}
    />
  );
}
