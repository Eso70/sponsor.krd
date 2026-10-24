"use client";

import styles from "./table-pagination.module.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import { Tooltip } from "@/components/shared/Tooltip";

export interface TablePaginationCopy {
  of: string;
  previous: string;
  next: string;
}

interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  copy?: Partial<TablePaginationCopy>;
}

export function TablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  copy,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {firstItem}–{lastItem} {copy?.of ?? "لە"} {totalItems.toLocaleString()}
      </span>
      <div className={styles.controls}>
        <Tooltip content={copy?.previous ?? "پەڕەی پێشوو"} side="top">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label={copy?.previous ?? "پەڕەی پێشوو"}
            className={`${SHARED_SOFT_BUTTON_CLASS} ${styles.button} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="min-w-0">{copy?.previous ?? "پێشوو"}</span>
          </button>
        </Tooltip>
        <span className="min-w-0 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          {page} / {totalPages}
        </span>
        <Tooltip content={copy?.next ?? "پەڕەی دواتر"} side="top">
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label={copy?.next ?? "پەڕەی دواتر"}
            className={`${SHARED_SOFT_BUTTON_CLASS} ${styles.button} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <span className="min-w-0">{copy?.next ?? "دواتر"}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
