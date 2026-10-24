"use client";

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ColorGradientModal, type ColorGradientModalProps } from "./ColorGradientModal";
import { Tooltip } from "./Tooltip";
import { ColorPickerMark } from "./ColorPickerMark";
import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";

export function SolidColorPickerButton({ value, onChange, label, resetLabel, copy }: {
  value: string;
  onChange: (color: string) => void;
  label: string;
  resetLabel: string;
  copy?: ColorGradientModalProps["copy"];
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  return <>
    <Tooltip content={label} side="top">
      <button ref={anchor} type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((current) => !current)}
        className={`${SHARED_SOFT_BUTTON_CLASS} flex size-9 shrink-0 items-center justify-center`}>
        <ColorPickerMark value={value} />
      </button>
    </Tooltip>
    {value && <Tooltip content={resetLabel} side="top">
      <button type="button" aria-label={resetLabel} onClick={() => onChange("")}
        className={`${SHARED_SOFT_BUTTON_CLASS} flex size-9 shrink-0 items-center justify-center`}><RotateCcw className="size-4" /></button>
    </Tooltip>}
    <ColorGradientModal anchorRef={anchor} copy={copy} isOpen={open} value={value || "#ffffff"}
      onChange={onChange} onClose={() => setOpen(false)} allowGradient={false}
      solidFallback="#ffffff" gradientFallback="#ffffff" title={label} />
  </>;
}
