"use client";

import type { HTMLAttributes } from "react";
import { SHARED_CONTROL_CLASS } from "./shared-control-styles";
import { NavigationSelectionGroup } from "./NavigationSelection";
import styles from "./segmented-control.module.css";

/** One soft surface and spacing system for tabs, collection toggles and skeletons. */
export function SegmentedTabsFrame({
  compact = false,
  fullWidth = !compact,
  plain = false,
  vertical,
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  fullWidth?: boolean;
  compact?: boolean;
  vertical?: boolean;
  plain?: boolean;
}) {
  return (
    <div
      {...props}
      data-full-width={fullWidth || undefined}
      className={`${SHARED_CONTROL_CLASS} ${styles.frame} ${plain ? styles.plain : ""} ${compact ? styles.compact : ""} custom-scrollbar theme-custom-scrollbar ${fullWidth ? "w-full" : ""} ${className}`}
    >
      <NavigationSelectionGroup>
        <div
          data-stretch={fullWidth || compact || undefined}
          className={`${styles.list} ${vertical ? styles.vertical : ""} ${fullWidth || compact ? "w-full !min-w-0" : ""}`}
        >
          {children}
        </div>
      </NavigationSelectionGroup>
    </div>
  );
}
