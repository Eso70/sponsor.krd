"use client";

import type { LucideIcon } from "lucide-react";
import { Tooltip } from "./Tooltip";

const tones = {
  purple:
    "border-purple-500/30 bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 hover:text-purple-800 dark:text-purple-300",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 hover:text-rose-800 dark:text-rose-300",
  neutral:
    "border-slate-300/70 bg-slate-100/80 text-slate-700 hover:bg-slate-200 hover:text-slate-900 dark:border-white/15 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 hover:text-sky-800 dark:text-sky-300 dark:hover:bg-sky-500/20 dark:hover:text-sky-200",
  amber:
    "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 hover:text-yellow-800 dark:text-yellow-300 dark:hover:bg-yellow-500/20 dark:hover:text-yellow-200",
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/20 hover:text-cyan-800 dark:text-cyan-300 dark:hover:bg-cyan-500/20 dark:hover:text-cyan-200",
  emerald:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-200",
  indigo:
    "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 hover:text-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-200",
  red: "border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/20 hover:text-red-800 dark:text-red-300 dark:hover:bg-red-500/20 dark:hover:text-red-200",
};

/** Flexible card actions share the page grid's sizing without fixed-width overflow. */
export function GridCardActionButton({
  label,
  text,
  icon: Icon,
  tone,
  showLabel = false,
  disabled = false,
  compact = false,
  presentation = "grid",
  onClick,
}: {
  label: string;
  text?: string;
  icon: LucideIcon;
  tone: keyof typeof tones;
  showLabel?: boolean;
  disabled?: boolean;
  compact?: boolean;
  presentation?: "grid" | "table";
  onClick: () => void;
}) {
  return (
    <Tooltip content={label} side="top">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={
          presentation === "table"
            ? `flex shrink-0 cursor-pointer items-center justify-center rounded-lg p-1.5 transition-all duration-150 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${tones[
                tone
              ]
                .split(" ")
                .filter((token) => !/^(?:dark:)?(?:border-|bg-)/.test(token))
                .join(" ")}`
            : `flex h-8 ${compact ? "w-8 shrink-0 sm:w-9" : "min-w-0 flex-1"} cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:rounded-xl ${tones[tone]} ${showLabel ? "gap-1.5 px-2" : "px-0"}`
        }
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {showLabel && (
          <span className="truncate text-xs font-medium">{text || label}</span>
        )}
      </button>
    </Tooltip>
  );
}
