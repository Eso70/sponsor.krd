import { Loader2 } from "lucide-react";
import { MotionSpinner } from "@/components/motion/MotionPrimitives";
import { Tooltip } from "@/components/shared/Tooltip";

/** Consistent modal footer actions with optional loading and single-action modes. */

export function ModalFooterActions({
  submitLabel,
  submitDisabled,
  isSubmitting = false,
  submittingLabel = "پاشەکەوت دەکرێت...",
  cancelLabel = "پاشگەزبوونەوە",
  showCancel = true,
  compact = false,
  submitTone = "primary",
  onCancel,
  onSubmit,
}: {
  submitLabel: string;
  submitDisabled: boolean;
  isSubmitting?: boolean;
  submittingLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  compact?: boolean;
  submitTone?: "primary" | "secondary";
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      {showCancel ? (
        <Tooltip
          content={cancelLabel}
          side="top"
          className={compact ? "shrink-0" : "flex-1"}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className={`flex items-center justify-center border border-slate-200 font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 cursor-pointer ${compact ? "h-9 rounded-lg px-5 text-xs" : "h-11 w-full rounded-xl text-sm"}`}
          >
            {cancelLabel}
          </button>
        </Tooltip>
      ) : null}
      <Tooltip
        content={isSubmitting ? submittingLabel : submitLabel}
        side="top"
        className={compact ? "shrink-0" : "flex-1"}
      >
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled || isSubmitting}
          className={`flex items-center justify-center gap-2 border font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${submitTone === "secondary" ? "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10" : "theme-fill border-transparent text-[var(--theme-ink)] hover:brightness-95"} ${compact ? "h-9 rounded-lg px-5 text-xs" : "h-11 w-full rounded-xl text-sm"}`}
        >
          {isSubmitting ? (
            <>
              <MotionSpinner>
                <Loader2 className="h-4 w-4" />
              </MotionSpinner>
              <span>{submittingLabel}</span>
            </>
          ) : (
            submitLabel
          )}
        </button>
      </Tooltip>
    </>
  );
}
