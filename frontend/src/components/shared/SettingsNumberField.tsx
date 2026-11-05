"use client";

import { SettingsField } from "./SettingsField";
import { NumberInput } from "./NumberInput";
import { settingsInputClass } from "./settings-styles";

export function SettingsNumberField({
  label, suffix, hint, value, min, max, step = 1, disabled = false, onChange,
}: {
  label: string; suffix: string; hint?: string; value: number;
  min: number; max: number; step?: number; disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <SettingsField label={label}>
      <div className="relative">
        <NumberInput value={value} min={min} max={max} step={step}
          disabled={disabled} onValueChange={onChange} aria-label={label}
          className={`${settingsInputClass} pr-20 tabular-nums disabled:cursor-not-allowed disabled:opacity-50`} />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">{suffix}</span>
      </div>
      <p className="mt-1 text-[10px] text-slate-400">
        {hint ?? `${min.toLocaleString("en-US")}–${max.toLocaleString("en-US")}`}
      </p>
    </SettingsField>
  );
}
