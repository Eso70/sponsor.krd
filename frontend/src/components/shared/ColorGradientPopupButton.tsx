"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ColorGradientModal, type ColorGradientModalProps } from "./ColorGradientModal";
import { ColorPickerMark } from "./ColorPickerMark";
import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";

type ColorGradientPopupButtonProps = Omit<ColorGradientModalProps, "anchorRef" | "isOpen" | "onClose"> & {
  label: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
};

/** Shared Forms/Linktree color control with the existing anchored picker. */
export function ColorGradientPopupButton({ label, open, onOpenChange, onClose, ...picker }: ColorGradientPopupButtonProps) {
  const anchor = useRef<HTMLButtonElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const changeOpen = useCallback((next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }, [open, onOpenChange]);
  const close = useCallback(() => {
    changeOpen(false);
    onClose?.();
  }, [changeOpen, onClose]);
  return <>
    <button ref={anchor} type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={isOpen}
      onClick={() => changeOpen(!isOpen)}
      className={`${SHARED_SOFT_BUTTON_CLASS} flex h-10 min-w-0 items-center justify-center gap-2 px-2 text-xs font-semibold`}>
      <ColorPickerMark value={picker.value} />
      <span>{label}</span>
      <ChevronDown aria-hidden className="size-3 shrink-0" />
    </button>
    <ColorGradientModal {...picker} anchorRef={anchor} isOpen={isOpen} onClose={close} title={picker.title ?? label} />
  </>;
}
