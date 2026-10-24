import { Tooltip } from "./Tooltip";
import styles from "./page-management.module.css";

/** Text-only collection view controls shared by every management toolbar. */
export function ManagementViewToggle({
  value,
  onChange,
  gridLabel,
  tableLabel,
  accentMode = "tenant",
}: {
  value: "grid" | "table";
  onChange: (value: "grid" | "table") => void;
  gridLabel: string;
  tableLabel: string;
  accentMode?: "tenant" | "platform";
}) {
  const activeClass =
    accentMode === "platform"
      ? "sa-gradient sa-ink"
      : "theme-fill text-[var(--theme-ink)]";
  return (
    <div className={`${styles.segmentGroup} ${styles.view}`}>
      {(["grid", "table"] as const).map((mode) => {
        const label = mode === "grid" ? gridLabel : tableLabel;
        return (
          <Tooltip key={mode} content={label} side="top">
            <button
              type="button"
              onClick={() => onChange(mode)}
              aria-label={label}
              aria-pressed={value === mode}
              className={`${styles.segment} ${value === mode ? activeClass : ""}`}
            >
              {label}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
