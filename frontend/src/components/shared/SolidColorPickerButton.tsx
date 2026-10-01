"use client";

import { useState } from "react";
import { Palette, RotateCcw } from "lucide-react";
import { ColorGradientModal, type ColorGradientModalProps } from "./ColorGradientModal";
import { Tooltip } from "./Tooltip";

export function SolidColorPickerButton({ value, onChange, label, resetLabel, copy }: {
  value: string;
  onChange: (color: string) => void;
  label: string;
  resetLabel: string;
  copy?: ColorGradientModalProps["copy"];
}) {
  const [open, setOpen] = useState(false);
  return <>
    <Tooltip content={label} side="top">
      <button type="button" aria-label={label} onClick={() => setOpen(true)}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 dark:border-white/10"
        style={value ? { background: value } : undefined}>
        {!value && <Palette className="size-4" />}
      </button>
    </Tooltip>
    {value && <button type="button" aria-label={resetLabel} onClick={() => onChange("")}
      className="shrink-0 cursor-pointer p-2 text-gray-400 hover:text-red-500"><RotateCcw className="size-4" /></button>}
    <ColorGradientModal copy={copy} isOpen={open} value={value || "#ffffff"}
      onChange={onChange} onClose={() => setOpen(false)} allowGradient={false}
      solidFallback="#ffffff" gradientFallback="#ffffff" title={label} />
  </>;
}
