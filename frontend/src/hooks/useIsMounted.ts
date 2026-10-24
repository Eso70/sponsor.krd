"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => { };

/** Defer browser-only portals until hydration without changing server markup. */
export function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
