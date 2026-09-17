"use client";

import type { ReactNode } from "react";

import {
  useManagementPagination,
  type ManagementTablePagination,
} from "@/components/shared/ManagementTable";

interface ManagementGridProps<T> {
  data: T[];
  getItemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  pagination?: ManagementTablePagination;
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
  desktopColumns = 3,
  className = "",
}: ManagementGridProps<T>) {
  const { visibleData, footer } = useManagementPagination(data, pagination);

  const cellBorders = (index: number) => {
    const total = visibleData.length;
    const lastTwoRowStart = total - (total % 2 || 2);
    const lastThreeRowStart = total - (total % 3 || 3);
    const mobile = index < total - 1 ? "border-b" : "border-b-0";
    const twoColumns = `${index % 2 === 0 ? "lg:border-r" : "lg:border-r-0"} ${index < lastTwoRowStart ? "lg:border-b" : "lg:border-b-0"}`;
    const threeColumns =
      desktopColumns === 3
        ? `${index % 3 === 2 ? "xl:border-r-0" : "xl:border-r"} ${index < lastThreeRowStart ? "xl:border-b" : "xl:border-b-0"}`
        : "";
    return `${mobile} ${twoColumns} ${threeColumns}`;
  };

  return (
    <div className={className} dir="ltr">
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 ${desktopColumns === 3 ? "xl:grid-cols-3" : ""}`}
      >
        {visibleData.map((item, index) => (
          <div
            key={getItemKey(item)}
            className={`min-w-0 border-slate-100 dark:border-white/5 ${cellBorders(index)}`}
          >
            {renderItem(item)}
          </div>
        ))}
      </div>
      {footer}
    </div>
  );
}
