"use client";

import { useCallback, useId, useRef, useState } from "react";
import { PickerPopup } from "./PickerPopup";
import { Clock3 } from "lucide-react";
import { SHARED_CONTROL_CLASS, SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import pickerStyles from "./DateTimeInput.module.css";
import { TimeColumn } from "./TimeColumn";

/**
 * A keyboard-editable time field using the shared anchored PickerPopup and
 * ordered hour, minute and period choices from DateTimeInput.
 *
 * `value` is always 24-hour `HH:MM`, which is what the API stores; the field
 * can switch between 12-hour and 24-hour notation without changing that value.
 */

const MINUTE_STEP = 5;

const TIME_INPUT_COPY = {
  ckb: {
    optional: "ئارەزوومەندانە", open: "کردنەوەی", invalid: "کاتەکە بە شێوەی 09:30 AM بنووسە.",
    hour: "کاتژمێر", minute: "خولەک", now: "ئێستا", done: "تەواو", close: "داخستن", format: "شێوازی کات", twelve: "١٢ کاتژمێر", twentyFour: "٢٤ کاتژمێر",
  },
  ar: {
    optional: "اختياري", open: "فتح", invalid: "أدخل الوقت بصيغة 09:30 AM.",
    hour: "الساعة", minute: "الدقيقة", now: "الآن", done: "تم", close: "إغلاق", format: "تنسيق الوقت", twelve: "12 ساعة", twentyFour: "24 ساعة",
  },
  en: {
    optional: "Optional", open: "Open", invalid: "Enter the time as 09:30 AM.",
    hour: "Hour", minute: "Minute", now: "Now", done: "Done", close: "Close", format: "Time format", twelve: "12h", twentyFour: "24h",
  },
} as const;

/**
 * The business's own website colour, falling back to the dashboard theme and
 * then to a neutral slate. Mirrors what other public-page surfaces use, so
 * the picker belongs to the page it is editing rather than to the admin chrome.
 */
const BUSINESS_ACCENT =
  "var(--business-website-color, var(--theme-primary, #64748b))";

export function parseTimeValue(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

function toValue(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** `13:05` reads as `01:05 PM`. */
function toDisplay(value: string, format: "12h" | "24h"): string {
  const parsed = parseTimeValue(value);
  if (!parsed) return "";
  if (format === "24h") return toValue(parsed.hours, parsed.minutes);
  const hour12 = parsed.hours % 12 || 12;
  const period = parsed.hours >= 12 ? "PM" : "AM";
  return `${String(hour12).padStart(2, "0")}:${String(parsed.minutes).padStart(2, "0")} ${period}`;
}

/**
 * Reads what was typed, in either notation.
 *
 * `21:30`, `9:30 pm` and `0930pm` all land on the same time; a bare `9:30` is
 * taken at face value, so a 24-hour typist is never second-guessed.
 */
export function parseTypedTime(raw: string): string | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;
  const match = /^(\d{1,2})[:.\s]?(\d{2})?\s*(am|pm)?$/.exec(text);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const period = match[3];
  if (minutes > 59) return null;
  if (period) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (period === "pm" ? 12 : 0);
  } else if (hours > 23) return null;
  return toValue(hours, minutes);
}

/** Keeps typing inside `hh:mm PP` without fighting the caret. */
function maskTyped(raw: string): string {
  const cleaned = raw.replace(/[^\dapmAPM: ]/g, "").slice(0, 8);
  if (cleaned.includes(":")) return cleaned;
  const digits = cleaned.replace(/\D/g, "").slice(0, 4);
  const suffix = /[ap]/i.exec(cleaned)?.[0]?.toUpperCase();
  const period = suffix ? `${suffix}M` : "";
  if (digits.length <= 2) return period ? `${digits} ${period}` : digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}${period ? ` ${period}` : ""}`;
}

export function TimeInput({ value, onChange, label, hideLabel = false, disabled = false, className = "", required = false, accent = BUSINESS_ACCENT, locale = "ckb" }: {
  value: string; onChange: (value: string) => void; label: string; hideLabel?: boolean;
  disabled?: boolean; className?: string; required?: boolean; accent?: string; locale?: keyof typeof TIME_INPUT_COPY;
}) {
  const copy = TIME_INPUT_COPY[locale];
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<"12h" | "24h">("12h");
  const [typing, setTyping] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const close = useCallback(() => { setIsOpen(false); requestAnimationFrame(() => buttonRef.current?.focus()); }, []);
  const current = parseTimeValue(value) ?? { hours: 9, minutes: 0 };
  const hour12 = current.hours % 12 || 12;
  const period = current.hours >= 12 ? "PM" : "AM";
  const steppedMinutes = Array.from({ length: 60 / MINUTE_STEP }, (_, index) => String(index * MINUTE_STEP).padStart(2, "0"));
  const currentMinute = String(current.minutes).padStart(2, "0");
  const minuteValues = steppedMinutes.includes(currentMinute) ? steppedMinutes : [...steppedMinutes, currentMinute].sort();
  const commit = (hours: number, minutes: number) => { setInvalid(false); setTyping(null); onChange(toValue(hours, minutes)); };
  const commitTyped = () => {
    if (typing === null) return;
    if (!typing.trim() && !required) { setTyping(null); setInvalid(false); onChange(""); return; }
    const parsed = parseTypedTime(typing);
    if (!parsed) { setInvalid(true); setTyping(null); return; }
    const time = parseTimeValue(parsed)!;
    commit(time.hours, time.minutes);
  };
  return <div className={`block ${className}`}>
    {!hideLabel && <span className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">{label}</span>}
    <div ref={anchorRef} dir="ltr" className={`${SHARED_CONTROL_CLASS} ${pickerStyles.field} flex h-10 w-full items-center overflow-hidden`} aria-invalid={invalid}
      onClick={() => { if (!disabled) { setIsOpen(true); inputRef.current?.focus(); } }}
      style={{ "--time-accent": accent } as React.CSSProperties}>
      <input ref={inputRef} type="text" maxLength={8} value={typing ?? toDisplay(value, format)} disabled={disabled} required={required}
        onClick={() => setIsOpen(true)}
        onChange={(event) => { setTyping(maskTyped(event.target.value)); setInvalid(false); }} onBlur={commitTyped}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commitTyped(); } if (event.key === "ArrowDown") { event.preventDefault(); setIsOpen(true); } }}
        aria-label={label} aria-invalid={invalid} aria-describedby={invalid ? errorId : undefined} placeholder="--:--" inputMode="text" dir="ltr"
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-medium tabular-nums outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50" />
      <button ref={buttonRef} type="button" disabled={disabled} onClick={() => { setIsOpen(true); inputRef.current?.focus(); }}
        aria-label={`${copy.open} ${label}`} aria-haspopup="dialog" aria-expanded={isOpen}
        className="flex h-full w-9 shrink-0 items-center justify-center bg-transparent text-slate-500 disabled:opacity-50">
        <Clock3 className="size-4" aria-hidden />
      </button>
    </div>
    {invalid && <span id={errorId} role="alert" className="mt-1 block text-xs text-red-500">{copy.invalid}</span>}
    <PickerPopup isOpen={isOpen && !disabled} onClose={close} anchorRef={anchorRef} title={label} closeLabel={copy.close} width={248} align="start" keepAnchorFocus hideHeader>
      <div role="group" aria-label={copy.format} className="mb-3 flex gap-2" dir="ltr">
        {(["12h", "24h"] as const).map(mode => <button key={mode} type="button" aria-pressed={format === mode}
          className={`${SHARED_SOFT_BUTTON_CLASS} flex-1 px-3 py-2 text-xs font-semibold`}
          onClick={() => { commitTyped(); setFormat(mode); }}>{mode === "12h" ? copy.twelve : copy.twentyFour}</button>)}
      </div>
      <div className={`grid ${format === "12h" ? "grid-cols-3" : "grid-cols-2"} gap-2`} dir="ltr">
        <TimeColumn accent={accent} label={copy.hour} selected={String(format === "12h" ? hour12 : current.hours).padStart(2, "0")}
          values={Array.from({ length: format === "12h" ? 12 : 24 }, (_, index) => String(index + (format === "12h" ? 1 : 0)).padStart(2, "0"))}
          onSelect={next => commit(format === "12h" ? Number(next) % 12 + (period === "PM" ? 12 : 0) : Number(next), current.minutes)} />
        <TimeColumn accent={accent} label={copy.minute} selected={currentMinute} values={minuteValues} onSelect={next => commit(current.hours, Number(next))} />
        {format === "12h" && <TimeColumn accent={accent} label={locale === "en" ? "Period" : locale === "ar" ? "الفترة" : "بەشی ڕۆژ"} selected={period} values={["AM", "PM"]}
          onSelect={next => commit(hour12 % 12 + (next === "PM" ? 12 : 0), current.minutes)} />}
      </div>
      <div className={`${pickerStyles.compactActions} mt-3 flex items-center justify-between gap-2`}>
        <button type="button" className={`${SHARED_SOFT_BUTTON_CLASS} px-3 py-2 text-xs font-semibold`}
          onClick={() => { const now = new Date(); commit(now.getHours(), now.getMinutes()); }}>{copy.now}</button>
        <button type="button" className={`${SHARED_SOFT_BUTTON_CLASS} px-3 py-2 text-xs font-semibold`} onClick={close}>{copy.done}</button>
      </div>
    </PickerPopup>
  </div>;
}
