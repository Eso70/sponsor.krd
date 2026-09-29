"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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
    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {firstItem}–{lastItem} {copy?.of ?? "لە"} {totalItems.toLocaleString()}
      </span>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Tooltip content={copy?.previous ?? "پەڕەی پێشوو"} side="top">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label={copy?.previous ?? "پەڕەی پێشوو"}
            className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            {copy?.previous ?? "پێشوو"}
          </button>
        </Tooltip>
        <span className="min-w-16 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          {page} / {totalPages}
        </span>
        <Tooltip content={copy?.next ?? "پەڕەی دواتر"} side="top">
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label={copy?.next ?? "پەڕەی دواتر"}
            className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 cursor-pointer"
          >
            {copy?.next ?? "دواتر"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
