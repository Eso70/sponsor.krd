"use client";

import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { Tooltip } from "@/components/shared/Tooltip";
import { SegmentedTabsFrame } from "./SegmentedTabsFrame";
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
  accent,
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
    if (!accent) return undefined;
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
    <SegmentedTabsFrame
      className={className}
      fullWidth={fullWidth}
      style={accentStyle}
      role="tablist"
    >
        {tabs.map((tab) => (
          <Tooltip key={tab.id} content={tab.label} side="top" className="flex-1">
            <button
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold outline-none transition sm:text-sm ${value === tab.id ? "theme-fill text-[var(--theme-ink)] shadow-sm" : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5"}`}
              aria-selected={value === tab.id}
              tabIndex={value === tab.id ? 0 : -1}
              role="tab"
              onKeyDown={(event) => {
                const index = tabs.findIndex((item) => item.id === tab.id);
                const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
                  event.key === "ArrowRight" ? (index + 1) % tabs.length :
                  event.key === "ArrowLeft" ? (index - 1 + tabs.length) % tabs.length : -1;
                if (next < 0) return;
                event.preventDefault();
                onChange(tabs[next].id);
                event.currentTarget.closest('[role="tablist"]')?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
              }}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          </Tooltip>
        ))}
    </SegmentedTabsFrame>
  );
}
