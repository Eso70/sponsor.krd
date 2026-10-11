"use client";

import { VerificationBadge } from "@/components/shared/VerificationBadge";
import { Tooltip } from "@/components/shared/Tooltip";

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
      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
    >
      <VerificationBadge muted={!enabled} className="h-6 w-6" />
    </button>
    </Tooltip>
  );
}
