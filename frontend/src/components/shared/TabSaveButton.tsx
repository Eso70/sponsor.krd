"use client";

import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/shared/Tooltip";
import styles from "./page-management.module.css";
import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";

/** Shared save state with the same sizing and radius as other management actions. */
export function TabSaveButton({
  dirty,
  saving,
  onSave,
  disabled,
  accent,
  copy,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  disabled?: boolean;
  accent?: boolean;
  copy?: Partial<Record<"savingTooltip" | "saveTooltip" | "unchangedTooltip" | "saving" | "save" | "saved", string>>;
}) {
  const active =
    dirty && !disabled
      ? accent
        ? "theme-fill border-transparent text-[var(--theme-ink)] shadow-sm hover:brightness-95 cursor-pointer"
        : "border-transparent bg-slate-900 text-white shadow-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer"
      : SHARED_SOFT_BUTTON_CLASS;

  const tooltipLabel = saving
    ? copy?.savingTooltip ?? "پاشەکەوت دەکرێت..."
    : dirty && !disabled
      ? copy?.saveTooltip ?? "پاشەکەوتکردنی گۆڕانکارییەکان"
      : copy?.unchangedTooltip ?? "هیچ گۆڕانکارییەک نەکراوە";

  return (
    <Tooltip content={tooltipLabel} side="bottom">
      <button
        type="button"
        onClick={onSave}
        disabled={!dirty || saving || disabled}
        aria-busy={saving}
        className={cn(
          `${styles.create} border-0 transition-colors disabled:cursor-not-allowed disabled:opacity-60`,
          active,
        )}
      >
        <Save className="h-4 w-4" />
        {saving ? copy?.saving ?? "پاشەکەوتکردن..." : dirty && !disabled ? copy?.save ?? "پاشەکەوتکردن" : copy?.saved ?? "پاشەکەوت کرا"}
      </button>
    </Tooltip>
  );
}
