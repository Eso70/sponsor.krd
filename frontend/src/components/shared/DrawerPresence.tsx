"use client";

import { Children, isValidElement, useContext, type ReactNode } from "react";
import { AnimatePresence, useIsPresent } from "motion/react";
import { DrawerSession } from "./DrawerSession";
import { DrawerSessionContext } from "./drawer-session-context";

/** Retain conditionally mounted drawer owners until their nested surface exits. */
export function DrawerPresence({
  children,
  inheritSession = false,
}: {
  children: ReactNode;
  inheritSession?: boolean;
}) {
  const session = useContext(DrawerSessionContext);
  const parentPresent = useIsPresent();
  // During a propagated exit, only retain outgoing children. Supplying fresh
  // children then makes Motion treat the same surface as entering and exiting.
  const presentChildren = parentPresent ? Children.toArray(children) : [];
  return (
    <AnimatePresence propagate>
      {inheritSession && session
        ? presentChildren
        : presentChildren.map((child, index) => (
            <DrawerSession
              key={isValidElement(child) ? (child.key ?? index) : index}
            >
              {child}
            </DrawerSession>
          ))}
    </AnimatePresence>
  );
}
