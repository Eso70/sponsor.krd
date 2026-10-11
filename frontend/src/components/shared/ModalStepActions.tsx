import type { ReactNode } from "react";
import { Tooltip } from "./Tooltip";
import { ModalFooterActions } from "./ModalFooterActions";

/** Compact wizard actions grouped on the right, with a neutral Back action. */
export function ModalStepActions({
  primaryLabel,
  primaryDisabled = false,
  onPrimary,
  backLabel,
  onBack,
  primaryHint,
}: {
  primaryLabel: string;
  primaryHint?: ReactNode;
  primaryDisabled?: boolean;
  onPrimary: () => void;
  backLabel?: string;
  onBack?: () => void;
}) {
  return (
    <div className="flex w-full items-center justify-end gap-2" dir="ltr">
      {onBack && backLabel && (
        <ModalFooterActions
          compact
          submitTone="secondary"
          showCancel={false}
          submitLabel={backLabel}
          submitDisabled={false}
          onSubmit={onBack}
          onCancel={onBack}
        />
      )}
      <Tooltip
        content={primaryHint}
        disabled={!primaryHint}
        side="top"
        tooltipClassName="!whitespace-normal"
      >
        <div className="inline-flex">
          <ModalFooterActions
            compact
            showCancel={false}
            submitLabel={primaryLabel}
            submitDisabled={primaryDisabled}
            onSubmit={onPrimary}
            onCancel={onPrimary}
          />
        </div>
      </Tooltip>
    </div>
  );
}
