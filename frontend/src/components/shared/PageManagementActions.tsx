import type { ReactNode } from "react";
import styles from "./page-management.module.css";

/** Wrapping toolbar actions retain the same sizing at every dashboard breakpoint. */
export function PageManagementActions({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${styles.actions} flex min-w-0 flex-wrap items-center gap-2 sm:gap-3`}
    >
      {children}
    </div>
  );
}
