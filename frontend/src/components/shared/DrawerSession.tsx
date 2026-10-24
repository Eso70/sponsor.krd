"use client";

import { useState, type ReactNode } from "react";
import { DrawerSessionContext } from "./drawer-session-context";

export function DrawerSession({ children }: { children: ReactNode }) {
  const [session] = useState(() => {
    let entered = false;
    return {
      hasEntered: () => entered,
      markEntered: () => {
        entered = true;
      },
    };
  });
  return (
    <DrawerSessionContext.Provider value={session}>
      {children}
    </DrawerSessionContext.Provider>
  );
}
