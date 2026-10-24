"use client";

import { memo, type ReactNode } from "react";
import { Check, Lock } from "lucide-react";
import styles from "./PickerOptionCard.module.css";

/** A visual option retains its preview while caption and selection stay readable. */
export const PickerOptionCard = memo(function PickerOptionCard({ label, selected, disabled = false, lockedLabel, onSelect, preview, role = "button" }: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  lockedLabel?: string;
  onSelect: () => void;
  preview: ReactNode;
  role?: "button" | "radio";
}) {
  return (
    <button type="button" role={role} onClick={onSelect} disabled={disabled} aria-label={label}
      aria-pressed={role === "button" ? selected : undefined} aria-checked={role === "radio" ? selected : undefined}
      title={disabled ? `${label} (${lockedLabel ?? "Locked"})` : label}
      className={`${styles.card} ${selected ? styles.selected : ""}`}>
      <span className={styles.preview} aria-hidden>{preview}</span>
      <span className={styles.caption}>{label}</span>
      {(selected || disabled) && <span className={styles.indicator} aria-hidden>
        {disabled ? <Lock className="size-3" /> : <Check className="size-3" />}
      </span>}
    </button>
  );
});
