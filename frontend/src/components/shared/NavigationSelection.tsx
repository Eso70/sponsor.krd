"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import styles from "./navigation-selection.module.css";

const SelectionContext = createContext<string | undefined>(undefined);

/** One independently scoped moving selection for horizontal and vertical navigation. */
export function NavigationSelectionGroup({
  children,
}: {
  children: ReactNode;
}) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <SelectionContext.Provider value={id}>
        {children}
      </SelectionContext.Provider>
    </LayoutGroup>
  );
}

/** Only the highlight moves; selecting a distant destination never opens intervening pages. */
export function NavigationSelectionHighlight() {
  const id = useContext(SelectionContext);
  const reducedMotion = useReducedMotion();
  return (
    <motion.span
      aria-hidden="true"
      data-navigation-highlight
      className={styles.highlight}
      layoutId={id ? "active-selection" : undefined}
      initial={false}
      transition={{
        duration: reducedMotion ? 0 : 0.36,
        ease: [0.22, 1, 0.36, 1],
      }}
    />
  );
}
