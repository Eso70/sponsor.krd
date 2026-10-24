"use client";

import { createContext } from "react";

/** Tracks the first surface across a lazy drawer's skeleton/content handoff. */
export const DrawerSessionContext = createContext<{
  hasEntered: () => boolean;
  markEntered: () => void;
} | null>(null);
