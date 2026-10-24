"use client";

import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { MotionReveal } from "@/components/motion/MotionPrimitives";
import { Tooltip } from "./Tooltip";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import { useDocumentScrollLock } from "@/hooks/useDocumentScrollLock";
import { useIsMounted } from "@/hooks/useIsMounted";
import styles from "./soft-modal.module.css";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeholder: string;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  children?: React.ReactNode;
  wide?: boolean;
  businessTheme?: boolean;
  platformTheme?: boolean;
  onSearchSubmit?: () => void;
  showClear?: boolean;
  shortcutLabel?: string;
  clearLabel?: string;
  applyLabel?: string;
  clearAriaLabel?: string;
  applyAriaLabel?: string;
}

export function SearchModal({
  isOpen, onClose, placeholder, searchQuery, onSearchQueryChange, children,
  wide = false,
  platformTheme = false, onSearchSubmit, showClear = true, shortcutLabel = "Enter",
  clearLabel = "پاککردنەوەی گەڕان",
  applyLabel = "جێبەجێکردن و داخستن",
  clearAriaLabel = "Clear search",
  applyAriaLabel = "Apply and close",
}: SearchModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mounted = useIsMounted();
  useModalKeyboard({
    isOpen: isOpen && mounted,
    onEscape: onClose,
    dialogRef: modalRef,
    initialFocusRef: inputRef,
  });
  useDocumentScrollLock(isOpen && mounted);
  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className={`${styles.overlay} modal-ltr z-[100]`} dir="ltr"
      data-platform-admin-theme={platformTheme ? true : undefined}
      data-sponsor-krd-theme={platformTheme ? true : undefined}
      style={platformTheme ? { "--theme-primary": "var(--sponsor-krd-accent)", "--theme-css": "var(--sponsor-krd-accent-gradient)", "--theme-ink": "var(--sponsor-krd-accent-ink)" } as React.CSSProperties : undefined}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <MotionReveal ref={modalRef} role="dialog" aria-modal="true" aria-label={placeholder}
        tabIndex={-1} className={`${styles.panel} ${wide ? "max-w-2xl" : "max-w-lg"}`}>
        <div className={styles.header}>
          <div className={styles.searchField}>
            <Search aria-hidden className={`${styles.accent} size-4 shrink-0`} />
            <input ref={inputRef} type="search" aria-label={placeholder} placeholder={placeholder}
              value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (onSearchSubmit) onSearchSubmit(); else onClose(); } }}
              className="text-sm font-kurdish text-left" />
            {showClear && searchQuery && <Tooltip content={clearLabel} side="bottom">
              <button type="button" onClick={() => { onSearchQueryChange(""); inputRef.current?.focus(); }}
                className={`${styles.control} size-9`} aria-label={clearAriaLabel}>
                <X aria-hidden className="size-4" />
              </button>
            </Tooltip>}
          </div>
          <Tooltip content={applyLabel} side="bottom">
            <button type="button" onClick={onClose} className={`${styles.control} ${styles.primary} px-3`}
              aria-label={applyAriaLabel}><kbd className="font-sans text-[10px] font-semibold">{shortcutLabel}</kbd></button>
          </Tooltip>
        </div>
        {children && <div className={`${styles.results} custom-scrollbar theme-custom-scrollbar ${wide ? "max-h-[540px]" : "max-h-[320px]"}`}>{children}</div>}
      </MotionReveal>
    </div>, document.body,
  );
}
