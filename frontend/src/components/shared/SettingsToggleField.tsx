"use client";

import { VisibilitySwitch } from "./VisibilitySwitch";

export function SettingsToggleField({ enabled, onChange, label }: {
  enabled: boolean; onChange: (value: boolean) => void; label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      <VisibilitySwitch checked={enabled} onChange={onChange} label={label} compact />
    </div>
  );
}
