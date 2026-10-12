"use client";
import { useState } from "react";
import { useFormPreviewPageFocus } from "./use-form-preview-page-focus";

/** Preview-only browsing preserves responses and follows explicit editor tab changes. */
export function useFormPreviewNavigation(
  pageIds: string[],
  finalPage: boolean,
  publicPage = false,
) {
  const requestedPage = finalPage ? pageIds.at(-1)! : pageIds[0];
  const [selection, setSelection] = useState({
    finalPage,
    pageId: requestedPage,
  });
  if (selection.finalPage !== finalPage) {
    setSelection({ finalPage, pageId: requestedPage });
  }
  const pageId =
    selection.finalPage === finalPage ? selection.pageId : requestedPage;
  const currentIndex = Math.max(0, pageIds.indexOf(pageId));
  const { contentRef, prepareNavigation } = useFormPreviewPageFocus(
    pageIds[currentIndex],
    publicPage,
  );
  const goTo = (next: string) => {
    if (!pageIds.includes(next) || next === pageIds[currentIndex]) return;
    prepareNavigation();
    setSelection({ finalPage, pageId: next });
  };
  return { currentIndex, contentRef, goTo };
}
