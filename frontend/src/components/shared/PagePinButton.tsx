"use client";

import { Pin } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { pageActionCopy } from "@/features/shared/i18n/page-action-copy";

export interface PagePinControl {
  toggle: (id: string, pinned: boolean) => Promise<void>;
  pending: ReadonlySet<string>;
  locale: "en" | "ar" | "ckb";
  disabled?: boolean;
}

export function PagePinButton({
  id,
  pinned = false,
  control,
  disabled = false,
  iconOnly = false,
}: {
  id: string;
  pinned?: boolean;
  control?: PagePinControl;
  disabled?: boolean;
  iconOnly?: boolean;
}) {
  if (!control) return null;
  const copy = pageActionCopy(control.locale);
  const label = pinned ? copy.unpin : copy.pin;
  return (
    <Tooltip content={label} side="top">
      <button
        type="button"
        aria-label={label}
        aria-pressed={pinned}
        aria-busy={control.pending.has(id)}
        disabled={disabled || control.disabled || control.pending.has(id)}
        className={`inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:cursor-wait disabled:opacity-50 ${iconOnly ? (pinned ? "text-[var(--theme-primary)]" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200") : pinned ? "bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-200"}`}
        onClick={(event) => {
          event.stopPropagation();
          void control.toggle(id, !pinned);
        }}
      >
        <Pin
          aria-hidden
          className="size-4"
          fill={pinned ? "currentColor" : "none"}
        />
      </button>
    </Tooltip>
  );
}
