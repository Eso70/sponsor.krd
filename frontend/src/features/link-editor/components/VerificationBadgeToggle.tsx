"use client";

import { VerificationBadge } from "@/components/shared/VerificationBadge";
import { Tooltip } from "@/components/shared/Tooltip";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";

export function VerificationBadgeToggle({ enabled, onChange, label }: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
}) {
  return (
    <Tooltip content={label} side="top">
    <button
      type="button"
      aria-label={label}
      aria-pressed={enabled}
      onClick={() => onChange(!enabled)}
      className={`${SHARED_SOFT_BUTTON_CLASS} flex size-10 shrink-0 cursor-pointer items-center justify-center`}
    >
      <VerificationBadge muted={!enabled} className="size-5" />
    </button>
    </Tooltip>
  );
}
