"use client";

import { memo, useCallback, type RefObject } from "react";
import { BACKGROUND_PATTERN_OPTIONS, BackgroundPattern } from "@/lib/templates/background-pattern";
import type { BackgroundPatternStyle } from "@linktree/types";
import { PickerPopup } from "./PickerPopup";
import { PickerOptionCard } from "./PickerOptionCard";

export interface BackgroundPatternModalProps {
  anchorRef?: RefObject<HTMLElement | null>;
  copy?: { title: string; count: string; close: string; radiogroup: string; labels: Record<BackgroundPatternStyle, string> };
  isOpen: boolean;
  value: BackgroundPatternStyle;
  onChange: (value: BackgroundPatternStyle) => void;
  onClose: () => void;
}

export const BackgroundPatternModal = memo(function BackgroundPatternModal({ isOpen, value, onChange, onClose, copy, anchorRef }: BackgroundPatternModalProps) {
  const selectPattern = useCallback((next: BackgroundPatternStyle) => {
    onChange(next);
    onClose();
  }, [onChange, onClose]);
  return (
    <PickerPopup isOpen={isOpen} anchorRef={anchorRef} onClose={onClose}
      title={copy?.title ?? "شێوازی پاشبنەما هەڵبژێرە"} closeLabel={copy?.close ?? "Close"}
      onEnter={() => selectPattern(value)}>
      <div role="radiogroup" aria-label={copy?.radiogroup ?? "شێوازی پاشبنەما"} className="grid grid-cols-3 gap-2">
        {BACKGROUND_PATTERN_OPTIONS.map((option) => <PickerOptionCard key={option.value}
          label={copy?.labels[option.value] ?? option.label} role="radio" selected={value === option.value}
          onSelect={() => selectPattern(option.value)} preview={option.value === "none"
            ? <span className="absolute inset-0 grid place-items-center text-lg" style={{ color: "var(--picker-muted)" }}>—</span>
            : <BackgroundPattern accent="var(--picker-text)" className="pointer-events-none absolute inset-0 h-full w-full" opacityScale={3} style={option.value} />} />)}
      </div>
    </PickerPopup>
  );
});
