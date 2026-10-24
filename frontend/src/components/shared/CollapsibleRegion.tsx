import type { ReactNode } from "react";
import styles from "./collapsible-region.module.css";

/** Auto-sized disclosure with no measurements or retained interactive exits. */
export function CollapsibleRegion({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={styles.region} data-open={open} aria-hidden={!open} inert={!open}>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
