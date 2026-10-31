"use client";

import { useLayoutEffect, type RefObject } from "react";

const documents = new WeakMap<Document, { locks: Set<symbol>; restore: () => void }>();

function lockDocument(ownerDocument: Document) {
  const token = Symbol("document-scroll-lock");
  let state = documents.get(ownerDocument);
  if (!state) {
    const overflow = ownerDocument.body.style.overflow;
    const gutter = ownerDocument.documentElement.style.scrollbarGutter;
    ownerDocument.documentElement.style.scrollbarGutter = "stable";
    ownerDocument.body.style.overflow = "hidden";
    state = { locks: new Set(), restore: () => {
      ownerDocument.body.style.overflow = overflow;
      ownerDocument.documentElement.style.scrollbarGutter = gutter;
    } };
    documents.set(ownerDocument, state);
  }
  state.locks.add(token);
  return () => {
    state.locks.delete(token);
    if (state.locks.size === 0) {
      state.restore();
      documents.delete(ownerDocument);
    }
  };
}

/** Keep each owning document stable until its final overlay closes. */
export function useDocumentScrollLock(enabled: boolean, ownerRef?: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (!enabled) return;
    return lockDocument(ownerRef?.current?.ownerDocument ?? document);
  }, [enabled, ownerRef]);
}
