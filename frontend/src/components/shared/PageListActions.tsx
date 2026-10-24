import type { ReactNode } from "react";
import styles from "./management-collection.module.css";

/** Shared grid footer and three-column table action layout for page collections. */
export function PageListActions({
  variant,
  children,
}: {
  variant: "grid" | "table";
  children: ReactNode;
}) {
  return (
    <div
      className={`${
        variant === "grid"
          ? `${styles.cardActions} mt-auto border-t border-gray-200 pt-2 sm:pt-2.5 dark:border-white/10`
          : styles.rowActions
      } min-w-0`}
    >
      {children}
    </div>
  );
}
