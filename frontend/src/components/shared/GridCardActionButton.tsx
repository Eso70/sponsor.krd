"use client";

import { SHARED_ACTION_CLASS } from "./shared-control-styles";
import type { LucideIcon } from "lucide-react";
import { Tooltip } from "./Tooltip";

const tones = {
  purple: "bg-purple-500/[0.05] text-purple-700 hover:bg-purple-500/[0.09] dark:bg-purple-400/[0.07] dark:text-purple-300 dark:hover:bg-purple-400/[0.12]",
  rose: "bg-rose-500/[0.05] text-rose-700 hover:bg-rose-500/[0.09] dark:bg-rose-400/[0.07] dark:text-rose-300 dark:hover:bg-rose-400/[0.12]",
  neutral: "bg-slate-100/60 text-slate-600 hover:bg-slate-200/50 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.09]",
  sky: "bg-sky-500/[0.05] text-sky-700 hover:bg-sky-500/[0.09] dark:bg-sky-400/[0.07] dark:text-sky-300 dark:hover:bg-sky-400/[0.12]",
  amber: "bg-yellow-500/[0.05] text-yellow-700 hover:bg-yellow-500/[0.09] dark:bg-yellow-400/[0.07] dark:text-yellow-300 dark:hover:bg-yellow-400/[0.12]",
  cyan: "bg-cyan-500/[0.05] text-cyan-700 hover:bg-cyan-500/[0.09] dark:bg-cyan-400/[0.07] dark:text-cyan-300 dark:hover:bg-cyan-400/[0.12]",
  emerald: "bg-emerald-500/[0.05] text-emerald-700 hover:bg-emerald-500/[0.09] dark:bg-emerald-400/[0.07] dark:text-emerald-300 dark:hover:bg-emerald-400/[0.12]",
  indigo: "bg-indigo-500/[0.05] text-indigo-700 hover:bg-indigo-500/[0.09] dark:bg-indigo-400/[0.07] dark:text-indigo-300 dark:hover:bg-indigo-400/[0.12]",
  red: "bg-red-500/[0.05] text-red-700 hover:bg-red-500/[0.09] dark:bg-red-400/[0.07] dark:text-red-300 dark:hover:bg-red-400/[0.12]",
};

const actionStyle = `${SHARED_ACTION_CLASS} flex h-8 cursor-pointer items-center justify-center rounded-[14px] border-0 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none sm:h-9`;

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
  stopPropagation = false,
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
  stopPropagation?: boolean;
}) {
  return (
    <Tooltip content={label} side="top">
      <button
        type="button"
        data-primary-action={showLabel}
        onClick={(event) => {
          if (stopPropagation) event.stopPropagation();
          onClick();
        }}
        disabled={disabled}
        aria-label={label}
        className={
          presentation === "table"
            ? `${actionStyle} w-8 shrink-0 p-1.5 sm:w-9 ${tones[tone]}`
            : `${actionStyle} ${compact ? "w-8 shrink-0 sm:w-9" : "min-w-0 flex-1"} ${tones[tone]} ${showLabel ? "gap-1.5 px-2.5" : "px-0"}`
        }
      >
        <Icon aria-hidden="true" strokeWidth={1.75} className="h-3.5 w-3.5 shrink-0" />
        {showLabel && (
          <span className="truncate text-xs font-medium">{text || label}</span>
        )}
      </button>
    </Tooltip>
  );
}
