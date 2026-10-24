"use client";

import type { HTMLAttributes, ReactNode } from "react";

/** Shared ready/pending metric rows: two columns below desktop, except a
 * deliberate full-width single-card row. Desktop columns are explicit. */

export type StatCardGridColumns = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Written out rather than interpolated: Tailwind only ships classes it can
 * see as complete strings in the source, so `lg:grid-cols-${n}` would compile
 * to nothing at all.
 */
const desktopColumns: Record<StatCardGridColumns, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

export interface StatCardGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Desktop columns. Below `lg`, two columns or one when explicitly set to 1. */
  columns?: StatCardGridColumns;
  className?: string;
}

export function StatCardGrid({
  children,
  columns = 4,
  className = "",
  ...props
}: StatCardGridProps) {
  return (
    <div
      {...props}
      className={`grid ${columns === 1 ? "grid-cols-1" : "grid-cols-2"} gap-3 sm:gap-4 ${desktopColumns[columns]} ${className}`}
    >
      {children}
    </div>
  );
}
