"use client";

import { Search, X } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import styles from "./page-management.module.css";

/** Shared search/clear action for dashboard collection toolbars. */
export function ManagementSearchTrigger({ query, open, onClick, labels }: {
  query: string;
  open: boolean;
  onClick: () => void;
  labels: { clearSearch: string; searchTooltip: string; search: string; searchPlaceholder: string };
}) {
  const hasQuery = Boolean(query.trim());
  return <Tooltip content={hasQuery ? labels.clearSearch : labels.searchTooltip} side="bottom">
    <button type="button" data-management-search onClick={onClick}
      aria-label={hasQuery ? labels.clearSearch : labels.search}
      aria-haspopup={hasQuery ? undefined : "dialog"} aria-expanded={hasQuery ? undefined : open}
      className={`${SHARED_SOFT_BUTTON_CLASS} ${styles.search} w-full text-xs font-medium`}>
      <Search className="size-4 shrink-0 opacity-70" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-start">{hasQuery ? query : labels.searchPlaceholder}</span>
      {hasQuery ? <X className="size-4 shrink-0" aria-hidden /> :
        <kbd className="hidden shrink-0 rounded-md bg-slate-200/60 px-1.5 py-0.5 font-sans text-[9px] text-slate-500 sm:inline dark:bg-white/5 dark:text-slate-400">Ctrl K</kbd>}
    </button>
  </Tooltip>;
}
