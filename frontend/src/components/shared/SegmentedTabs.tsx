"use client";

import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { Tooltip } from "@/components/shared/Tooltip";
import {
  isWebsiteColor,
  parseWebsiteColor,
  readableInk,
} from "@/lib/utils/parse-website-color";

export interface SegmentedTab<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  accent = "var(--theme-primary)",
  fullWidth,
  className,
}: {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (value: T) => void;
  accent?: string;
  fullWidth?: boolean;
  className?: string;
}) {
  const accentStyle = (() => {
    if (!isWebsiteColor(accent)) {
      return { "--theme-primary": accent } as CSSProperties;
    }

    const parsed = parseWebsiteColor(accent);
    return {
      "--theme-primary": parsed.primary,
      "--theme-css": parsed.css,
      "--theme-ink": readableInk(parsed.primary),
    } as CSSProperties;
  })();

  return (
    <div
      className={`custom-scrollbar brand-custom-scrollbar theme-custom-scrollbar overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-[#1c222b] ${fullWidth ? "w-full" : ""} ${className ?? ""}`}
      style={accentStyle}
    >
      <div className={`flex gap-1 ${fullWidth ? "w-full" : "min-w-max sm:min-w-0"}`}>
        {tabs.map((tab) => (
          <Tooltip key={tab.id} content={tab.label} side="top" className="flex-1">
            <button
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold outline-none transition sm:text-sm ${value === tab.id ? "theme-fill text-[var(--theme-ink)] shadow-sm" : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5"}`}
              aria-selected={value === tab.id}
              role="tab"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
