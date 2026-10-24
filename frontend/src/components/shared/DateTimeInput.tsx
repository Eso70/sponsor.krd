"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { PickerPopup } from "./PickerPopup";
import { SHARED_CONTROL_CLASS, SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import pickerStyles from "./DateTimeInput.module.css";
import {
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { TimeColumn } from "./TimeColumn";
import { Tooltip } from "@/components/shared/Tooltip";

interface DateTimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  /** Earliest selectable date/datetime (ISO format matching the mode). */
  min?: string;
  /** Latest selectable date/datetime (ISO format matching the mode). */
  max?: string;
  disabled?: boolean;
  dateOnly?: boolean;
  required?: boolean;
  accent?: string;
  /**
   * Drops the built-in label, for surfaces that already caption the control.
   * The label is still required and still reaches assistive technology through
   * `aria-label`, so hiding it changes the look and nothing else.
   */
  hideLabel?: boolean;
  ariaDescribedBy?: string;
  /** Localizes calendar chrome without changing the stored ISO value. */
  locale?: "ckb" | "ar" | "en";
}

const BUSINESS_ACCENT =
  "var(--business-website-color, var(--theme-primary, #64748b))";

// Full Kurdish month names for the calendar header / month selector.
const MONTH_NAMES = [
  "کانوونی دووەم",
  "شوبات",
  "ئازار",
  "نیسان",
  "ئایار",
  "حوزەیران",
  "تەممووز",
  "ئاب",
  "ئەیلوول",
  "تشرینی یەکەم",
  "تشرینی دووەم",
  "کانوونی یەکەم",
];

// 3-letter English abbreviations shown in the compact month picker grid.
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const WEEKDAY_NAMES = ["ی", "د", "س", "چ", "پ", "ه", "ش"];
const ARABIC_MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const ARABIC_WEEKDAY_NAMES = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];
const ENGLISH_MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ENGLISH_WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseLocalDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLocalDateTime(date: Date) {
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
  return date;
}

function formatLocalDate(date: Date) {
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTypedDateTime(date: Date) {
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${String(date.getFullYear()).slice(-2)}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

function parseTypedDateTime(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = 2000 + Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (month < 1 || month > 12 || day < 1) return null;
  const now = new Date();
  const isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
  const date = new Date(year, month - 1, day, isToday ? now.getHours() : 0, isToday ? now.getMinutes() : 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function defaultDateTime() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatMaskedDate(rawValue: string, previousValue: string) {
  const deleting = rawValue.length < previousValue.length;
  const sanitized = rawValue.replace(/[^\d/]/g, "");
  let parts = sanitized.split("/");
  if (parts.length === 1 && parts[0].length > 2) {
    const digits = parts[0].slice(0, 6);
    parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)];
  }
  const year = (parts[0] || "").slice(0, 2);
  if (year.length < 2) return year;
  if (parts.length === 1) return deleting ? year : `${year}/`;
  let month = (parts[1] || "").slice(0, 2);
  if (month.length === 1 && /^[2-9]$/.test(month) && !deleting) month = `0${month}`;
  if (month.length === 2) {
    const n = Number(month);
    if (n < 1 || n > 12) month = month[0];
  }
  if (month.length < 2) return `${year}/${month}`;
  if (parts.length === 2) return deleting ? `${year}/${month}` : `${year}/${month}/`;
  let day = (parts[2] || "").slice(0, 2);
  if (day.length === 1 && /^[4-9]$/.test(day) && !deleting) day = `0${day}`;
  if (day.length === 2) {
    const maxDay = daysInMonth(2000 + Number(year), Number(month) - 1);
    const n = Number(day);
    if (n < 1 || n > maxDay) day = day[0];
  }
  return `${year}/${month}/${day}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Year range: 10 years back so analytics/historical dates are reachable.
const THIS_YEAR = new Date().getFullYear();
const YEAR_START = THIS_YEAR - 10;
const YEAR_END = THIS_YEAR + 30;
const ALL_YEARS = Array.from({ length: YEAR_END - YEAR_START + 1 }, (_, i) => YEAR_START + i);

export function DateTimeInput({
  label,
  value,
  onChange,
  hint,
  min,
  max,
  disabled = false,
  dateOnly = false,
  required = false,
  accent = BUSINESS_ACCENT,
  hideLabel = false,
  ariaDescribedBy,
  locale = "ckb",
}: DateTimeInputProps) {
  const arabic = locale === "ar";
  const english = locale === "en";
  const monthNames = arabic ? ARABIC_MONTH_NAMES : english ? ENGLISH_MONTH_NAMES : MONTH_NAMES;
  const weekdayNames = arabic ? ARABIC_WEEKDAY_NAMES : english ? ENGLISH_WEEKDAY_NAMES : WEEKDAY_NAMES;
  const [isOpen, setIsOpen] = useState(false);
  const errorId = useId();
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closePicker = useCallback(() => setIsOpen(false), []);
  const yearScrollRef = useRef<HTMLDivElement>(null);

  const parseValue = (candidate: string) =>
    dateOnly ? parseLocalDate(candidate) : parseLocalDateTime(candidate);

  const initialValue = parseValue(value);
  const [inputValue, setInputValue] = useState(() =>
    initialValue ? formatTypedDateTime(initialValue) : "",
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  useEffect(() => {
    inputRef.current?.setCustomValidity(validationError ?? "");
  }, [validationError]);
  const [headerSelector, setHeaderSelector] = useState<"month" | "year" | null>(null);
  const [draft, setDraft] = useState<Date>(() => parseValue(value) || defaultDateTime());
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    const initial = parseValue(value) || defaultDateTime();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });

  const minimum = min ? parseValue(min) : null;
  const maximum = max ? parseValue(max) : null;


  // Auto-scroll year grid to the selected year when panel opens.
  useEffect(() => {
    if (headerSelector === "year" && yearScrollRef.current) {
      const selected = yearScrollRef.current.querySelector<HTMLElement>("[data-selected='true']");
      selected?.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [headerSelector]);

  const openPicker = () => {
    if (disabled || isOpen) return;
    const next = parseValue(value) || parseTypedDateTime(inputValue) || defaultDateTime();
    setDraft(next);
    setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    setHeaderSelector(null);
    setIsOpen(true);
  };

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    return Array.from({ length: 42 }, (_, i) => new Date(year, month, i - firstWeekday + 1));
  }, [visibleMonth]);

  const hour12 = draft.getHours() % 12 || 12;
  const period = draft.getHours() >= 12 ? "PM" : "AM";

  const atFirstAllowedMonth = visibleMonth.getFullYear() <= YEAR_START && visibleMonth.getMonth() === 0;
  const atLastAllowedMonth = visibleMonth.getFullYear() >= YEAR_END && visibleMonth.getMonth() === 11;

  /** True when every day in the given month falls outside [min, max]. */
  const isMonthDisabled = (year: number, monthIdx: number): boolean => {
    if (minimum) {
      const lastDay = new Date(year, monthIdx + 1, 0);
      if (startOfDay(lastDay) < startOfDay(minimum)) return true;
    }
    if (maximum) {
      const firstDay = new Date(year, monthIdx, 1);
      if (startOfDay(firstDay) > startOfDay(maximum)) return true;
    }
    return false;
  };

  /** True when the entire year falls outside [min, max]. */
  const isYearDisabled = (year: number): boolean => {
    if (minimum && year < minimum.getFullYear()) return true;
    if (maximum && year > maximum.getFullYear()) return true;
    return false;
  };

  const commit = (candidate: Date) => {
    let next = candidate;
    if (minimum && next < minimum) next = new Date(minimum);
    if (maximum && next > maximum) next = new Date(maximum);
    setDraft(next);
    setInputValue(formatTypedDateTime(next));
    setValidationError(null);
    onChange(dateOnly ? formatLocalDate(next) : formatLocalDateTime(next));
  };

  const validateTypedValue = () => {
    if (!inputValue.trim()) {
      setValidationError(null);
      onChange("");
      return true;
    }
    const parsed = parseTypedDateTime(inputValue);
    if (!parsed) {
      setValidationError(arabic ? "اكتب التاريخ بصيغة سنة/شهر/يوم؛ مثل 26/03/09." : english ? "Enter the date as year/month/day, for example 26/03/09." : "بەروارەکە بە شێوەی ساڵ/مانگ/ڕۆژ بنووسە؛ بۆ نموونە 26/03/09.");
      return false;
    }
    const stored = parseValue(value);
    if (!dateOnly && stored) parsed.setHours(stored.getHours(), stored.getMinutes());
    if (minimum && parsed < minimum) {
      setValidationError(arabic ? `لا يمكن أن يكون التاريخ قبل ${formatTypedDateTime(minimum)}.` : english ? `Date cannot be before ${formatTypedDateTime(minimum)}.` : `بەروارەکە نابێت پێش ${formatTypedDateTime(minimum)} بێت.`);
      return false;
    }
    if (maximum && parsed > maximum) {
      setValidationError(arabic ? `لا يمكن أن يكون التاريخ بعد ${formatTypedDateTime(maximum)}.` : english ? `Date cannot be after ${formatTypedDateTime(maximum)}.` : `بەروارەکە نابێت لە ${formatTypedDateTime(maximum)} دواتر بێت.`);
      return false;
    }
    commit(parsed);
    return true;
  };

  const setHour = (hour: number) => {
    const next = new Date(draft);
    next.setHours((hour % 12) + (period === "PM" ? 12 : 0));
    commit(next);
  };
  const setMinute = (minute: number) => {
    const next = new Date(draft);
    next.setMinutes(minute);
    commit(next);
  };
  const setPeriod = (nextPeriod: "AM" | "PM") => {
    const next = new Date(draft);
    const baseHour = next.getHours() % 12;
    next.setHours(baseHour + (nextPeriod === "PM" ? 12 : 0));
    commit(next);
  };

  const chooseDay = (day: Date) => {
    commit(new Date(
      day.getFullYear(), day.getMonth(), day.getDate(),
      dateOnly ? 0 : draft.getHours(),
      dateOnly ? 0 : draft.getMinutes(),
    ));
  };

  const todayDate = new Date();
  const isTodayDisabled =
    (!!minimum && startOfDay(todayDate) < startOfDay(minimum)) ||
    (!!maximum && startOfDay(todayDate) > startOfDay(maximum));

  // Highlight the committed value, not the draft.
  const selectedDate = parseValue(value);

  return (
    <div className="block">
      {!hideLabel && (
        <span className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
          {label}
        </span>
      )}
      <div
        ref={triggerRef}
        data-date-field
        className={`${SHARED_CONTROL_CLASS} ${pickerStyles.field} flex h-10 w-full items-center overflow-hidden`}
        onClick={() => { openPicker(); inputRef.current?.focus(); }}
        aria-invalid={!!validationError}
      >
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={inputValue}
          disabled={disabled}
          onChange={(event) => {
            setInputValue((current) => formatMaskedDate(event.target.value, current));
            setValidationError(null);
          }}
          onBlur={validateTypedValue}
          onKeyDown={(event) => {
            if (event.key === "Enter") { event.preventDefault(); validateTypedValue(); }
            if (event.key === "ArrowDown") { event.preventDefault(); openPicker(); }
          }}
          aria-label={label}
          aria-invalid={!!validationError}
          aria-describedby={[ariaDescribedBy, validationError ? errorId : undefined].filter(Boolean).join(" ") || undefined}
          placeholder="YY/MM/DD"
          maxLength={8}
          inputMode="numeric"
          dir="ltr"
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-medium tabular-nums outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => { openPicker(); inputRef.current?.focus(); }}
          aria-label={arabic ? `فتح ${label}` : english ? `Open ${label}` : `کردنەوەی ${label}`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="flex h-full w-9 shrink-0 items-center justify-center bg-transparent text-slate-500 disabled:cursor-not-allowed"
        >
          <CalendarClock className="h-4 w-4" />
        </button>
      </div>
      {validationError && (
        <span id={errorId} role="alert" className="mt-1.5 block text-[10px] font-semibold leading-4 text-red-500">
          {validationError}
        </span>
      )}
      {hint && (
        <span className="mt-1.5 block text-[10px] leading-4 text-slate-400 dark:text-slate-500">
          {hint}
        </span>
      )}

      <PickerPopup isOpen={isOpen && !disabled} onClose={closePicker} anchorRef={triggerRef}
        title={label} closeLabel={arabic ? "إغلاق" : english ? "Close" : "داخستن"}
        width={dateOnly ? 280 : 440} align="start" keepAnchorFocus hideHeader>
        <div className={pickerStyles.calendar} style={{ "--date-accent": accent } as React.CSSProperties}>
            <div className={dateOnly ? "block" : pickerStyles.dateTimeLayout}>

              {/* ── Calendar panel ── */}
              <div className="relative min-w-0">

                {/* Header */}
                <div className="flex items-center gap-1.5 px-0 py-1">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setHeaderSelector((c) => c === "month" ? null : "month")}
                      className={`${SHARED_SOFT_BUTTON_CLASS} flex min-w-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold  transition hover:bg-slate-100  dark:hover:bg-white/[0.07]`}
                    >
                      <span className="truncate">{monthNames[visibleMonth.getMonth()]}</span>
                      <ChevronDown className={`h-3 w-3 shrink-0  transition-transform duration-200 ${headerSelector === "month" ? "rotate-180" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeaderSelector((c) => c === "year" ? null : "year")}
                      className={`${SHARED_SOFT_BUTTON_CLASS} flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold  transition hover:bg-slate-100  dark:hover:bg-white/[0.07]`}
                    >
                      {/* Full 4-digit year */}
                      {visibleMonth.getFullYear()}
                      <ChevronDown className={`h-3 w-3  transition-transform duration-200 ${headerSelector === "year" ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={atFirstAllowedMonth}
                      onClick={() => setVisibleMonth((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
                      aria-label={arabic ? "الشهر السابق" : english ? "Previous month" : "مانگی پێشوو"}
                      className={`${SHARED_SOFT_BUTTON_CLASS} flex h-7 w-7 items-center justify-center rounded-lg  transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white/[0.07]`}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={atLastAllowedMonth}
                      onClick={() => setVisibleMonth((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
                      aria-label={arabic ? "الشهر التالي" : english ? "Next month" : "مانگی داهاتوو"}
                      className={`${SHARED_SOFT_BUTTON_CLASS} flex h-7 w-7 items-center justify-center rounded-lg  transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white/[0.07]`}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      aria-label={arabic ? "إغلاق" : english ? "Close" : "داخستن"}
                      className={`${SHARED_SOFT_BUTTON_CLASS} flex h-7 w-7 items-center justify-center rounded-lg  transition hover:bg-slate-100  dark:hover:bg-white/[0.07] `}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Month / Year overlay */}
                {headerSelector && (
                  <div
                    className="absolute inset-x-0 top-10 z-20 rounded-xl p-1 shadow-sm"
                    style={{ background: "var(--picker-surface)" }}
                  >
                    {headerSelector === "month" ? (
                      <div className="grid grid-cols-4 gap-1 p-2.5">
                        {monthNames.map((name, i) => {
                          const dis = isMonthDisabled(visibleMonth.getFullYear(), i);
                          const sel = visibleMonth.getMonth() === i;
                          return (
                            <Tooltip key={name} content={name} side="top">
                              <button
                                type="button"
                                disabled={dis}
                                aria-label={name}
                                onClick={() => {
                                  setVisibleMonth((c) => new Date(c.getFullYear(), i, 1));
                                  setHeaderSelector(null);
                                }}
                                className={`${SHARED_SOFT_BUTTON_CLASS} px-1 py-2 text-center text-[10px] disabled:cursor-not-allowed disabled:opacity-30`}
                                aria-pressed={sel}
                              >
                                {arabic ? name : MONTH_SHORT[i]}
                              </button>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ) : (
                      <div ref={yearScrollRef} className={`theme-custom-scrollbar max-h-44 overflow-y-auto p-2.5`}>
                        <div className="grid grid-cols-4 gap-1">
                          {ALL_YEARS.map((year) => {
                            const dis = isYearDisabled(year);
                            const sel = visibleMonth.getFullYear() === year;
                            return (
                              <button
                                key={year}
                                type="button"
                                data-selected={sel}
                                aria-pressed={sel}
                                disabled={dis}
                                onClick={() => {
                                  setVisibleMonth((c) => new Date(year, c.getMonth(), 1));
                                  setHeaderSelector(null);
                                }}
                                className={`${SHARED_SOFT_BUTTON_CLASS} px-1 py-2 text-center text-[10px] disabled:cursor-not-allowed disabled:opacity-30`}

                              >
                                {year}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Weekday headers */}
                <div className={`grid grid-cols-7 pt-2 pb-1`}>
                  {weekdayNames.map((day, i) => (
                    <span key={`${day}-${i}`} className="flex h-7 items-center justify-center text-[9px] font-bold  ">
                      {day}
                    </span>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1 pb-2">
                  {calendarDays.map((day) => {
                    const isSelected = !!selectedDate && sameDay(day, selectedDate);
                    const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                    const isDisabled =
                      (!!minimum && startOfDay(day) < startOfDay(minimum)) ||
                      (!!maximum && startOfDay(day) > startOfDay(maximum));
                    return (
                      <button
                        key={day.toISOString()}
                        aria-pressed={isSelected}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => chooseDay(day)}
                        className={`${SHARED_SOFT_BUTTON_CLASS} ${pickerStyles.day} flex h-7 items-center justify-center text-[11px] tabular-nums disabled:cursor-not-allowed disabled:opacity-20 ${isCurrentMonth ? "" : "opacity-40"}`}

                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className={`flex items-center justify-between gap-2 pt-1`}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setInputValue("");
                      setValidationError(null);
                      setIsOpen(false);
                    }}
                    className={`${SHARED_SOFT_BUTTON_CLASS} rounded-lg px-2.5 py-1.5 text-[10px] font-bold   transition hover:bg-slate-100  dark:hover:bg-white/[0.07] `}
                  >
                    {arabic ? "مسح" : english ? "Clear" : "پاککردنەوە"}
                  </button>
                  <button
                    type="button"
                    disabled={isTodayDisabled}
                    onClick={() => {
                      const now = new Date();
                      commit(now);
                      setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                    }}
                    className={`${SHARED_SOFT_BUTTON_CLASS} rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[color-mix(in_srgb,var(--date-accent)_10%,transparent)]`}
                    style={{ color: "var(--date-accent)" }}
                  >
                    {arabic ? "اليوم" : english ? "Today" : "ئەمڕۆ"}
                  </button>
                </div>
              </div>

              {/* ── Time panel (datetime mode only) ── */}
              {!dateOnly && (
                <div className="grid min-w-0 grid-cols-3 gap-1.5 p-2">
                  <TimeColumn
                    label={english ? "Hour" : arabic ? "الساعة" : "کاتژمێر"}
                    accent={accent}
                    accentInk="var(--theme-ink, #ffffff)"
                    selected={String(hour12).padStart(2, "0")}
                    values={Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))}
                    onSelect={(next) => setHour(Number(next))}
                  />
                  <TimeColumn
                    label={english ? "Minute" : arabic ? "الدقيقة" : "خولەک"}
                    accent={accent}
                    accentInk="var(--theme-ink, #ffffff)"
                    selected={String(draft.getMinutes()).padStart(2, "0")}
                    values={Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))}
                    onSelect={(next) => setMinute(Number(next))}
                  />
                  <TimeColumn
                    label={english ? "Period" : arabic ? "الفترة" : "بەشی ڕۆژ"}
                    accent={accent}
                    accentInk="var(--theme-ink, #ffffff)"
                    selected={period}
                    values={["AM", "PM"]}
                    onSelect={(next) => setPeriod(next as "AM" | "PM")}
                  />
                </div>
              )}
            </div>
        </div>
      </PickerPopup>
    </div>
  );
}

export function DateInput(props: Omit<DateTimeInputProps, "dateOnly">) {
  return <DateTimeInput {...props} dateOnly />;
}
