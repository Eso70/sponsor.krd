"use client";

import { useId, useState, type CSSProperties } from "react";
import styles from "./ColorChannelSlider.module.css";

/** Native keyboard/touch slider with a matching number field that supports clearing and typing. */
export function ColorChannelSlider({
  label,
  value,
  max,
  unit = "",
  track,
  color,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
  track: string;
  color: string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<{ base: number; text: string } | null>(
    null,
  );
  const text = draft?.base === value ? draft.text : String(value);
  const commit = (raw: string) => {
    if (raw.trim() === "") return;
    const next = Number(raw);
    if (Number.isFinite(next))
      onChange(Math.min(max, Math.max(0, Math.round(next))));
  };
  return (
    <div className={styles.row} data-modal-enter-ignore>
      <label
        htmlFor={id}
        className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400"
        title={label}
      >
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        aria-valuetext={`${value}${unit}`}
        className={styles.slider}
        style={
          {
            "--channel-track": track,
            "--channel-color": color,
          } as CSSProperties
        }
        onChange={(event) => {
          setDraft(null);
          onChange(Number(event.target.value));
        }}
      />
      <div className={styles.number}>
        <input
          type="number"
          min={0}
          max={max}
          step={1}
          value={text}
          aria-label={label}
          className="modal-standard-input border border-gray-200 bg-white text-gray-700 outline-none dark:border-white/10 dark:bg-[#161b22] dark:text-gray-100"
          inputMode="numeric"
          onChange={(event) => {
            const raw = event.target.value;
            const next = Number(raw);
            if (
              raw.trim() !== "" &&
              Number.isInteger(next) &&
              next >= 0 &&
              next <= max
            ) {
              onChange(next);
              setDraft({ base: next, text: raw });
            } else setDraft({ base: value, text: raw });
          }}
          onBlur={() => {
            commit(text);
            setDraft(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
        {unit && <span aria-hidden>{unit}</span>}
      </div>
    </div>
  );
}
