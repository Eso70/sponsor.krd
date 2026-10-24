"use client";
import { Calendar } from "lucide-react";
import { DateInput } from "@/components/shared/DateTimeInput";
import { Tooltip } from "@/components/shared/Tooltip";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import { analyticsInsightsCopy } from "../analytics-insights-copy";
import type { PageAnalyticsCopy } from "../page-analytics-copy";
import type { DateRangePreset } from "../page-analytics-range";
const DATE_RANGE_OPTIONS: DateRangePreset[] = [
  "today",
  "24h",
  "7d",
  "all",
  "custom",
];
export function PageAnalyticsRange({
  labels,
  locale,
  preset,
  setPreset,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  disabled = false,
  title,
}: {
  labels: PageAnalyticsCopy;
  locale: "en" | "ar" | "ckb";
  preset: DateRangePreset;
  setPreset: (value: DateRangePreset) => void;
  customFrom: string;
  customTo: string;
  setCustomFrom: (value: string) => void;
  setCustomTo: (value: string) => void;
  disabled?: boolean;
  title?: string;
}) {
  const insightsCopy = analyticsInsightsCopy[locale];
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        {title && (
          <h2
            className="min-w-0 max-w-full truncate text-sm font-bold text-slate-700 dark:text-slate-200"
            dir="auto"
            title={title}
          >
            {title}
          </h2>
        )}
        <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
        <div className="flex gap-1.5 flex-wrap">
          {DATE_RANGE_OPTIONS.map((id) => {
            const active = preset === id;
            const label =
              id === "24h"
                ? insightsCopy.twoDays
                : id === "7d"
                  ? labels.last7d
                  : labels[id];
            const hint =
              id === "24h"
                ? insightsCopy.twoDays
                : id === "7d"
                  ? labels.last7dHint
                  : labels[`${id}Hint`];
            return (
              <Tooltip key={id} content={hint} side="top">
                <button
                  disabled={disabled}
                  type="button"
                  aria-label={hint}
                  aria-pressed={active}
                  onClick={() => setPreset(id)}
                  className={`${SHARED_SOFT_BUTTON_CLASS} px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? "theme-fill border-transparent text-[var(--theme-ink,#fff)] shadow-sm"
                      : "bg-white dark:bg-[#161B22] border-slate-100 dark:border-white/8 text-slate-500 dark:text-gray-400 hover:border-slate-200 dark:hover:border-white/20"
                  }`}
                >
                  {label}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {preset === "custom" && (
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <DateInput
              disabled={disabled}
              locale={locale}
              label={labels.fromDate}
              value={customFrom}
              onChange={setCustomFrom}
              accent="var(--theme-primary, #64748b)"
              max={customTo || undefined}
            />
          </div>
          <span className="text-slate-300 dark:text-white/20 text-sm font-light shrink-0 mt-5">
            →
          </span>
          <div className="flex-1 min-w-0">
            <DateInput
              disabled={disabled}
              locale={locale}
              label={labels.toDate}
              value={customTo}
              onChange={setCustomTo}
              accent="var(--theme-primary, #64748b)"
              min={customFrom || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
