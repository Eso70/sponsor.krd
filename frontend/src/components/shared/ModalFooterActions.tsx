import { Loader2 } from "lucide-react";
import { MotionSpinner } from "@/components/motion/MotionPrimitives";
import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
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
            className={`${SHARED_SOFT_BUTTON_CLASS} flex items-center justify-center font-bold disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "h-9 rounded-lg px-5 text-xs" : "h-11 w-full rounded-xl text-sm"}`}
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
          className={`${SHARED_SOFT_BUTTON_CLASS} flex items-center justify-center gap-2 font-bold disabled:cursor-not-allowed disabled:opacity-60 ${submitTone === "secondary" ? "" : "theme-fill"} ${compact ? "h-9 rounded-lg px-5 text-xs" : "h-11 w-full rounded-xl text-sm"}`}
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
