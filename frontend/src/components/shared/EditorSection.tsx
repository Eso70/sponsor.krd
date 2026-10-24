"use client";

import { SHARED_CARD_CLASS } from "./shared-surface-styles";
import { useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./EditorSection.module.css";
import { VisibilitySwitch } from "@/components/shared/VisibilitySwitch";

/** Compact accordion shared by dashboard editors. */
export function EditorSection({
  title,
  disabled = false,
  open,
  onToggle,
  enabled,
  onEnabled,
  enabledLabel,
  children,
  step,
  leading,
  actions,
  reorderId,
  reorderGroup,
}: {
  title: string;
  disabled?: boolean;
  open: boolean;
  onToggle: () => void;
  enabled?: boolean;
  onEnabled?: (enabled: boolean) => void;
  enabledLabel?: string;
  children: ReactNode;
  step?: number;
  leading?: ReactNode;
  actions?: ReactNode;
  reorderId?: string;
  reorderGroup?: string;
}) {
  const id = useId();
  return (
    <section
      data-reorder-id={reorderId}
      data-reorder-group={reorderGroup}
      className={`${styles.section} ${SHARED_CARD_CLASS} overflow-hidden`}
    >
      <div className="relative flex items-center gap-3 bg-slate-50/70 px-4 dark:bg-white/[0.03]">
        {leading}
        <button
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 py-4 text-start text-sm font-bold text-slate-700 dark:text-slate-200"
        >
          <span
            className={`flex min-w-0 items-center gap-3 ${actions ? "pe-8" : ""}`}
          >
            {step && (
              <span
                aria-hidden
                className="theme-soft flex size-7 shrink-0 items-center justify-center rounded-lg text-xs"
              >
                {step}
              </span>
            )}
            <span className="truncate">{title}</span>
          </span>
          <ChevronDown
            aria-hidden
            className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {actions && (
          <div
            className={`${styles.actions} absolute end-11 top-1/2 -translate-y-1/2`}
          >
            {actions}
          </div>
        )}
        {onEnabled && (
          <VisibilitySwitch
            compact
            checked={enabled ?? true}
            onChange={onEnabled}
            label={enabledLabel ?? title}
          />
        )}
      </div>
      <div
        id={id}
        hidden={!open}
        className="space-y-4 border-t border-slate-200/60 p-4 dark:border-white/[0.06]"
      >
        {children}
      </div>
    </section>
  );
}
