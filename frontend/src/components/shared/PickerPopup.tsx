"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useAnchoredPopup } from "@/hooks/useAnchoredPopup";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import { pickerAppearance } from "@/lib/utils/picker-appearance";
import { PickerPopupHeader } from "./PickerPopupHeader";
import surfaceStyles from "./picker-popup-surface.module.css";

/** Shared appearance, placement, keyboard behavior and shell for visual pickers. */
export function PickerPopup({ isOpen, onClose, anchorRef, title, closeLabel, onEnter, children, width = 400, align = "end", keepAnchorFocus = false, hideHeader = false }: {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: RefObject<HTMLElement | null>;
  title: string;
  closeLabel: string;
  onEnter?: () => void;
  children: ReactNode;
  width?: number;
  align?: "start" | "end";
  /** Editable anchored fields keep focus and manual entry outside the popup. */
  keepAnchorFocus?: boolean;
  hideHeader?: boolean;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [appearance, setAppearance] = useState<"light" | "dark" | null>(null);
  const [portalDocument, setPortalDocument] = useState<Document | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      const anchor = anchorRef?.current;
      setPortalDocument(anchor?.ownerDocument ?? document);
      setAppearance(pickerAppearance(anchor ?? document.documentElement));
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, anchorRef]);
  const ready = isOpen && appearance !== null && portalDocument !== null;
  const style = useAnchoredPopup({ isOpen: ready, anchorRef, popupRef: dialogRef, onClose, align, preferredWidth: width });
  useModalKeyboard({ isOpen: ready, dialogRef: keepAnchorFocus && anchorRef ? undefined : dialogRef, initialFocusRef: keepAnchorFocus ? anchorRef : undefined, onEscape: onClose, onEnter, enterEnabled: Boolean(onEnter) });
  if (!ready) return null;
  return createPortal(
    <div className={appearance}>
      {!anchorRef && <div className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden />}
      <div ref={dialogRef} role="dialog" aria-modal={!anchorRef} aria-labelledby={hideHeader ? undefined : titleId} aria-label={hideHeader ? title : undefined} tabIndex={-1}
        data-picker-surface data-appearance={appearance} style={anchorRef ? style : undefined}
        className={`${surfaceStyles.surface} modal-ltr fixed z-[201] flex flex-col overflow-hidden border ${anchorRef ? "" : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[85svh] w-[95vw] max-w-xl"}`} dir="ltr">
        {!hideHeader && <PickerPopupHeader title={title} titleId={titleId} closeLabel={closeLabel} onClose={onClose} />}
        <div className={`custom-scrollbar theme-custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 ${hideHeader ? "" : "pt-1"}`}>
          {children}
        </div>
      </div>
    </div>, portalDocument!.body,
  );
}
