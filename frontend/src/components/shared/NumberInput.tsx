"use client";

import { useState } from "react";

interface NumberInputProps {
  value: number | null;
  onValueChange: (value: number) => void;
  /** Lower bound; also the value an emptied field falls back to on blur. Defaults to 0. */
  min?: number;
  step?: number;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  /**
   * Empties the field on focus so typing starts fresh, instead of the caret
   * landing inside the existing number and appending digits to it. The previous
   * value is restored on blur if nothing is typed.
   */
  clearOnFocus?: boolean;
  /** Hides the browser's native increment/decrement controls. */
  hideSteppers?: boolean;
  /** Plain decimal entry without exponent notation, letters or browser arrows. */
  decimalOnly?: boolean;
  onEmpty?: () => void;
  max?: number;
}

/**
 * Numeric field shared by editor surfaces. Centralises the parse/clamp/empty
 * handling that was previously re-implemented inline next to every
 * `<input type="number">` (prices, durations, quotas).
 */
export function NumberInput({
  value,
  onValueChange,
  min = 0,
  step,
  className,
  placeholder,
  clearOnFocus = false,
  hideSteppers = false,
  decimalOnly = false,
  onEmpty,
  max,
  "aria-label": ariaLabel,
}: NumberInputProps) {
  // While focused the raw text is authoritative, so a half-typed or empty
  // field isn't fought by the numeric value flowing back down.
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (raw: string) => {
    const parsed = Number(raw);
    if (raw.trim() === "" || Number.isNaN(parsed)) return min;
    if (decimalOnly) return parsed;
    return Math.min(max ?? Infinity, Math.max(min, parsed));
  };

  return (
    <input
      type={decimalOnly ? "text" : "number"}
      inputMode={step && !Number.isInteger(step) ? "decimal" : "numeric"}
      min={min}
      max={max}
      step={step}
      value={draft ?? (value === null ? "" : String(value))}
      aria-label={ariaLabel}
      placeholder={placeholder}
      className={`${className || ""} ${
        hideSteppers
          ? "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          : ""
      }`.trim()}
      dir="ltr"
      onFocus={() => {
        if (clearOnFocus) setDraft("");
      }}
      onChange={(event) => {
        const raw = decimalOnly
          ? event.target.value
              .replace(/[٠-٩۰-۹]/g, (digit) =>
                String(digit.charCodeAt(0) - (digit >= "۰" ? 0x06f0 : 0x0660)),
              )
              .replace(/٫/g, ".")
          : event.target.value;
        if (decimalOnly && !/^\d*(?:\.\d*)?$/.test(raw)) return;
        setDraft(raw);
        if (raw === "" && onEmpty) {
          onEmpty();
          return;
        }
        onValueChange(commit(raw));
      }}
      onBlur={(event) => {
        if (event.target.value === "" && onEmpty) onEmpty();
        else onValueChange(commit(event.target.value));
        setDraft(null);
      }}
    />
  );
}
