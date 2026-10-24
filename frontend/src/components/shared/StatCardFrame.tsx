import type { ReactNode } from "react";
import {
  statCardColorClasses,
  statCardIconBgClasses,
  statCardIconColorClasses,
  type StatCardColor,
} from "./stat-card-styles";

/** Shared geometry for resolved and pending cards; no data or client state. */
export function StatCardFrame({
  action,
  caption,
  className = "",
  color = "slate",
  compact = false,
  icon,
  loading = false,
  value,
}: {
  action?: ReactNode;
  caption: ReactNode;
  className?: string;
  color?: StatCardColor;
  compact?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  value: ReactNode;
}) {
  return (
    <article
      data-stat-card
      data-state={loading ? "loading" : "ready"}
      aria-hidden={loading || undefined}
      className={`relative flex h-full min-w-0 items-center rounded-2xl border ${compact ? "min-h-[76px] p-3" : "min-h-[76px] p-3 sm:min-h-[104px] sm:p-5 md:p-6"} ${statCardColorClasses[color]} ${className}`}
    >
      {action ? (
        <div className="absolute end-2 top-2 z-10">{action}</div>
      ) : null}
      <div
        className={`flex w-full min-w-0 items-center ${compact ? "gap-2.5" : "gap-3 sm:gap-4"} ${action ? "pe-7" : ""}`}
      >
        {icon ? (
          <div
            data-stat-card-icon
            className={`flex shrink-0 items-center justify-center border shadow-sm ${compact ? "size-[34px] rounded-lg" : "size-[34px] rounded-lg sm:size-[46px] sm:rounded-xl md:size-[50px]"} ${statCardIconBgClasses[color]} ${statCardIconColorClasses[color]}`}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1 text-start">
          <div
            data-stat-card-value
            className={`mb-0.5 min-w-0 font-bold leading-tight text-slate-700 dark:text-slate-200 ${compact ? "text-sm sm:text-base" : "text-lg sm:mb-1 sm:text-2xl md:text-3xl"}`}
          >
            {value}
          </div>
          <div
            data-stat-card-caption
            className={`min-w-0 font-medium leading-tight text-slate-600 dark:text-slate-400 ${compact ? "text-[10px] sm:text-[11px]" : "text-[10px] sm:text-xs md:text-sm"}`}
          >
            {caption}
          </div>
        </div>
      </div>
    </article>
  );
}
