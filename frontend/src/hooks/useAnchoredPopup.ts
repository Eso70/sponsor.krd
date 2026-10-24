"use client";

import { anchoredPopupPosition } from "@/lib/utils/anchored-popup-position";
import { useEffect, useState, type CSSProperties, type RefObject } from "react";

/** Shared viewport bounds, theme inheritance and outside dismissal for editor popups. */
export function useAnchoredPopup({
  isOpen,
  anchorRef,
  popupRef,
  onClose,
  align = "start",
  preferredWidth = 400,
}: {
  isOpen: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  popupRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  align?: "start" | "end";
  preferredWidth?: number;
}) {
  const [style, setStyle] = useState<CSSProperties>({});
  useEffect(() => {
    if (!isOpen || !anchorRef) return;
    const ownerDocument = anchorRef.current?.ownerDocument ?? document;
    const ownerWindow = ownerDocument.defaultView ?? window;
    const position = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const dialog = anchor.closest('[role="dialog"]')?.getBoundingClientRect();
      const theme = ownerWindow.getComputedStyle(anchor);
      const alignsRight = (theme.direction === "rtl") !== (align === "end");
      const inherited: Record<string, string> = {};
      for (const key of [
        "--business-website-color",
        "--theme-primary",
        "--theme-css",
        "--theme-ink",
        "--sponsor-krd-accent",
        "--sponsor-krd-accent-gradient",
        "--sponsor-krd-accent-ink",
        "--preview-accent",
        "--shared-control-surface",
        "--shared-control-hover",
        "--shared-control-text",
        "--shared-control-muted",
        "--shared-control-radius",
      ]) {
        const value = theme.getPropertyValue(key).trim();
        if (value) inherited[key] = value;
      }
      setStyle({
        ...inherited,
        ...anchoredPopupPosition({
          anchor: rect,
          ownerWindow,
          width: preferredWidth,
          alignRight: alignsRight,
          container: dialog,
          maxHeight: 540,
        }),
      });
    };
    const outside = (event: PointerEvent) => {
      if (
        event.target &&
        "nodeType" in event.target &&
        !popupRef.current?.contains(event.target as Node) &&
        !anchorRef.current?.contains(event.target as Node)
      )
        onClose();
    };
    position();
    ownerWindow.visualViewport?.addEventListener("resize", position);
    ownerWindow.visualViewport?.addEventListener("scroll", position);
    ownerWindow.addEventListener("resize", position);
    ownerWindow.addEventListener("scroll", position, true);
    ownerDocument.addEventListener("pointerdown", outside);
    return () => {
      ownerWindow.visualViewport?.removeEventListener("resize", position);
      ownerWindow.visualViewport?.removeEventListener("scroll", position);
      ownerWindow.removeEventListener("resize", position);
      ownerWindow.removeEventListener("scroll", position, true);
      ownerDocument.removeEventListener("pointerdown", outside);
    };
  }, [isOpen, anchorRef, popupRef, onClose, align, preferredWidth]);
  return style;
}
