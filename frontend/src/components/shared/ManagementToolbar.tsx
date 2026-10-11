"use client";

import type { ReactNode } from "react";
import { LayoutGrid, Plus, RefreshCw, Search, Table2, X } from "lucide-react";
import { MotionSpinner } from "@/components/motion/MotionPrimitives";
import { Tooltip } from "./Tooltip";

export interface ManagementToolbarCopy {
  clearSearch: string;
  searchTooltip: string;
  search: string;
  searchPlaceholder: string;
  activePages: string;
  archivedPages: string;
  active: string;
  archived: string;
  gridView: string;
  tableView: string;
  refreshPages: string;
  refresh: string;
  createTooltip: string;
  create: string;
}

export function ManagementToolbar({
  labels,
  searchQuery,
  isSearchModalOpen,
  viewMode,
  onSearchAction,
  onViewModeChange,
  onRefresh,
  onCreate,
  archiveFilter = "active",
  onArchiveFilterChange,
  isRefreshing = false,
  createDisabled = false,
  createDisabledTooltip,
  accentMode = "tenant",
  leadingAction,
}: {
  labels: ManagementToolbarCopy;
  searchQuery: string;
  isSearchModalOpen: boolean;
  viewMode: "grid" | "table";
  onSearchAction: () => void;
  onViewModeChange: (mode: "grid" | "table") => void;
  onRefresh: () => void | Promise<void>;
  onCreate: () => void;
  archiveFilter?: "active" | "archived";
  onArchiveFilterChange?: (filter: "active" | "archived") => void;
  isRefreshing?: boolean;
  createDisabled?: boolean;
  createDisabledTooltip?: string;
  accentMode?: "tenant" | "platform";
  leadingAction?: ReactNode;
}) {
  const usesPlatformAccent = accentMode === "platform";
  const supportsArchive = Boolean(onArchiveFilterChange);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {leadingAction}
      <Tooltip
        content={searchQuery.trim() ? labels.clearSearch : labels.searchTooltip}
        side="bottom"
      >
        <button
          type="button"
          onClick={onSearchAction}
          aria-label={searchQuery.trim() ? labels.clearSearch : labels.search}
          className={`group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border px-0 shadow-sm transition-all duration-300 hover:shadow active:scale-95 ${searchQuery.trim() ? "" : "sm:w-44 sm:justify-between sm:px-3.5"} ${isSearchModalOpen ? (usesPlatformAccent ? "sa-soft sa-soft-border" : "theme-soft") : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50/50 hover:text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"}`}
        >
          {searchQuery.trim() ? (
            <X className="h-4 w-4 text-slate-500 dark:text-gray-400" />
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-2">
                <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-gray-500" />
                <span className="hidden truncate text-xs font-semibold text-slate-400 sm:inline dark:text-gray-500">
                  {labels.searchPlaceholder}
                </span>
              </div>
              <kbd className="hidden items-center gap-0.5 rounded bg-slate-100 px-1 py-0.5 font-sans text-[8px] font-bold text-slate-400 select-none sm:inline-flex dark:bg-white/10 dark:text-gray-500">
                Ctrl K
              </kbd>
            </>
          )}
        </button>
      </Tooltip>
      {supportsArchive ? (
        <div className="flex h-10 shrink-0 items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
          {(["active", "archived"] as const).map((filter) => (
            <Tooltip
              key={filter}
              content={
                filter === "active" ? labels.activePages : labels.archivedPages
              }
              side="bottom"
            >
              <button
                type="button"
                onClick={() => onArchiveFilterChange?.(filter)}
                aria-pressed={archiveFilter === filter}
                className={`flex h-8 cursor-pointer items-center justify-center rounded-lg px-3 text-xs font-semibold transition-all active:scale-95 ${archiveFilter === filter ? (usesPlatformAccent ? "sa-gradient sa-ink shadow-sm" : "theme-fill text-[var(--theme-ink)] shadow-sm") : "text-slate-500 hover:bg-slate-50/50 hover:text-slate-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"}`}
              >
                <span>
                  {filter === "active" ? labels.active : labels.archived}
                </span>
              </button>
            </Tooltip>
          ))}
        </div>
      ) : null}
      <div className="flex h-10 shrink-0 items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
        {(["grid", "table"] as const).map((mode) => {
          const Icon = mode === "grid" ? LayoutGrid : Table2;
          return (
            <Tooltip
              key={mode}
              content={mode === "grid" ? labels.gridView : labels.tableView}
              side="bottom"
            >
              <button
                type="button"
                onClick={() => onViewModeChange(mode)}
                aria-label={
                  mode === "grid" ? labels.gridView : labels.tableView
                }
                aria-pressed={viewMode === mode}
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-95 ${viewMode === mode ? (usesPlatformAccent ? "sa-gradient sa-ink shadow-md" : "theme-fill text-[var(--theme-ink)] shadow-md") : "text-slate-500 hover:bg-slate-50/50 hover:text-slate-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            </Tooltip>
          );
        })}
      </div>
      <Tooltip content={labels.refreshPages} side="bottom">
        <button
          type="button"
          onClick={() => void onRefresh()}
          aria-busy={isRefreshing}
          disabled={isRefreshing}
          aria-label={labels.refresh}
          className="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
        >
          <MotionSpinner active={isRefreshing}>
            <RefreshCw className="h-4 w-4" />
          </MotionSpinner>
        </button>
      </Tooltip>
      <Tooltip
        content={
          createDisabled
            ? (createDisabledTooltip ?? labels.createTooltip)
            : labels.createTooltip
        }
        side="bottom"
      >
        <button
          type="button"
          disabled={createDisabled}
          onClick={onCreate}
          className={`group flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-transparent px-3.5 text-xs font-black shadow-sm transition hover:brightness-95 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${usesPlatformAccent ? "sa-gradient sa-ink" : "theme-fill text-[var(--theme-ink)]"}`}
        >
          <Plus className="h-4 w-4" />
          <span>{labels.create}</span>
        </button>
      </Tooltip>
    </div>
  );
}
