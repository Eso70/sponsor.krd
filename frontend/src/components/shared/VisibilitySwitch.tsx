"use client";
import { cn } from "@/lib/utils";
import { Tooltip } from "./Tooltip";

export function VisibilitySwitch({
  checked,
  onChange,
  label,
  tooltip = label,
  stateLabel,
  compact = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  tooltip?: string;
  stateLabel?: string;
  compact?: boolean;
}) {
  return (
    <Tooltip content={tooltip} side="top">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        title={tooltip}
        onClick={() => onChange(!checked)}
        className={cn(
          "flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-primary)]",
          compact ? "h-9 px-1" : "h-10 border px-3 text-xs font-bold",
          !compact &&
            (checked
              ? "border-[color-mix(in_srgb,var(--theme-primary)_35%,transparent)] bg-[color-mix(in_srgb,var(--theme-primary)_8%,transparent)] text-[var(--theme-primary)]"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/[0.08]"),
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "relative h-5 w-9 shrink-0 rounded-full transition-colors",
            checked ? "theme-fill" : "bg-slate-200 dark:bg-white/15",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
              "left-0.5",
              checked ? "translate-x-4" : "translate-x-0",
            )}
          />
        </span>
        {stateLabel}
      </button>
    </Tooltip>
  );
}
