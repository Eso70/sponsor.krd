"use client";

import { useLayoutEffect } from "react";

const locks = new Set<symbol>();
let restore: (() => void) | undefined;

/** Keep the document stable until the last retained overlay has unmounted. */
export function useDocumentScrollLock(enabled: boolean) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const token = Symbol("document-scroll-lock");
    if (locks.size === 0) {
      const overflow = document.body.style.overflow;
      const gutter = document.documentElement.style.scrollbarGutter;
      document.documentElement.style.scrollbarGutter = "stable";
      document.body.style.overflow = "hidden";
      restore = () => {
        document.body.style.overflow = overflow;
        document.documentElement.style.scrollbarGutter = gutter;
      };
    }
    locks.add(token);
    return () => {
      locks.delete(token);
      if (locks.size === 0) {
        restore?.();
        restore = undefined;
      }
    };
  }, [enabled]);
}
