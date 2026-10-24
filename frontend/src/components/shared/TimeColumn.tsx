"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import styles from "./TimeColumn.module.css";

/** Stable ordered time choices, shared by date/time and time-only pickers. */
export function TimeColumn({ selected, values, onSelect, label, accent = "var(--business-website-color, var(--theme-primary, #64748b))", scrollbarClassName = "theme-custom-scrollbar" }: {
  selected: string; values: string[]; onSelect: (value: string) => void; label?: string;
  accent?: string; accentInk?: string; scrollbarClassName?: string;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { selectedRef.current?.scrollIntoView?.({ block: "nearest" }); }, [selected]);
  return <div className="min-w-0" role="group" aria-label={label}>
    {label && <p className="mb-2 text-center text-[11px] font-medium" style={{ color: "var(--picker-muted, #94a3b8)" }}>{label}</p>}
    <div role="listbox" aria-label={label} className={`${scrollbarClassName} max-h-32 space-y-1.5 overflow-y-auto overscroll-contain`}>
      {values.map((value, index) => <button key={value} type="button" role="option" aria-selected={value === selected}
        ref={value === selected ? selectedRef : undefined} tabIndex={value === selected ? 0 : -1}
        onClick={() => onSelect(value)}
        onKeyDown={event => {
          const next = event.key === "ArrowDown" ? (index + 1) % values.length : event.key === "ArrowUp" ? (index + values.length - 1) % values.length : event.key === "Home" ? 0 : event.key === "End" ? values.length - 1 : -1;
          if (next < 0) return;
          event.preventDefault(); onSelect(values[next]);
          const options = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="option"]');
          options?.[next]?.focus();
        }}
        className={`${SHARED_SOFT_BUTTON_CLASS} ${styles.option} ${value === selected ? styles.selected : ""} flex h-7 w-full items-center justify-center text-xs font-medium tabular-nums`}
        style={{ "--time-choice-accent": accent } as CSSProperties}>
        {value}
      </button>)}
    </div>
  </div>;
}
