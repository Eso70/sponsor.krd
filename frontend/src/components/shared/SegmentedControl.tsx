"use client";

import { Tooltip } from "./Tooltip";
import { SegmentedTabsFrame } from "./SegmentedTabsFrame";
import styles from "./segmented-control.module.css";

/** Text-only choices share the same appearance as the system's page tabs. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accentMode = "tenant",
  className,
}: {
  options: readonly { value: T; label: string; tooltip?: string }[];
  value: T;
  onChange: (value: T) => void;
  accentMode?: "tenant" | "platform";
  className?: string;
}) {
  const active =
    accentMode === "platform"
      ? "sa-gradient sa-ink"
      : "theme-fill text-[var(--theme-ink)]";
  return (
    <SegmentedTabsFrame compact className={className}>
      {options.map((option) => (
        <Tooltip
          key={option.value}
          content={option.tooltip ?? option.label}
          side="bottom"
          className="min-w-0 flex-1"
        >
          <button
            type="button"
            aria-label={option.label}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`${styles.item} ${value === option.value ? active : ""}`}
          >
            {option.label}
          </button>
        </Tooltip>
      ))}
    </SegmentedTabsFrame>
  );
}
