import type { HTMLAttributes } from "react";
import { SHARED_CONTROL_CLASS } from "./shared-control-styles";
import styles from "./segmented-control.module.css";

/** One soft surface and spacing system for tabs, collection toggles and skeletons. */
export function SegmentedTabsFrame({
  fullWidth,
  compact,
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  fullWidth?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      {...props}
      className={`${SHARED_CONTROL_CLASS} ${styles.frame} ${compact ? styles.compact : ""} custom-scrollbar theme-custom-scrollbar ${fullWidth ? "w-full" : ""} ${className}`}
    >
      <div
        className={`${styles.list} ${fullWidth || compact ? "w-full !min-w-0" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
