"use client";
import { useEffect, useRef } from "react";
/** Reset only the preview's scroll/focus when its navigation changes pages. */
export function useFormPreviewPageFocus(page: string, publicPage = false) {
  const contentRef = useRef<HTMLDivElement>(null);
  const navigationPending = useRef(false);
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    content.scrollTop = 0;
    if (navigationPending.current) {
      if (publicPage) window.scrollTo(0, 0);
      content.focus({ preventScroll: true });
    }
    navigationPending.current = false;
  }, [page, publicPage]);
  return {
    contentRef,
    prepareNavigation: () => {
      navigationPending.current = true;
    },
  };
}
