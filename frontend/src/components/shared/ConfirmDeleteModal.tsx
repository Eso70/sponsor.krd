"use client";

import { MotionSpinner } from "@/components/motion/MotionPrimitives";

import { memo, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChartNoAxesCombined, CheckCircle2, Loader2, Trash2, X } from "lucide-react";
import { Tooltip } from "@/components/shared/Tooltip";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import { useDocumentScrollLock } from "@/hooks/useDocumentScrollLock";
import { useIsMounted } from "@/hooks/useIsMounted";
import styles from "./soft-modal.module.css";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  loadingLabel?: string;
  cancelLabel?: string;
  closeLabel?: string;
  isDeleting?: boolean;
  zIndexClassName?: string;
  tone?: "danger" | "accent" | "warning";
}

export const ConfirmDeleteModal = memo(function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "\u0633\u0695\u06cc\u0646\u06d5\u0648\u06d5",
  loadingLabel = "\u062f\u06d5\u0633\u0695\u06ce\u062a\u06d5\u0648\u06d5...",
  cancelLabel = "\u067e\u0627\u0634\u06af\u06d5\u0632\u0628\u0648\u0648\u0646\u06d5\u0648\u06d5",
  closeLabel = "داخستن",
  isDeleting = false,
  zIndexClassName = "z-50",
  tone = "danger",
}: ConfirmDeleteModalProps) {
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirming = useRef(false);
  const mounted = useIsMounted();
  const [pending, setPending] = useState(false);
  const busy = isDeleting || pending;
  const handleConfirm = async () => {
    if (isDeleting || confirming.current) return;
    confirming.current = true;
    setPending(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      confirming.current = false;
      setPending(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !busy) onClose();
  };

  useModalKeyboard({
    isOpen: isOpen && mounted,
    onEscape: () => {
      if (!busy) onClose();
    },
    onEnter: handleConfirm,
    enterEnabled: !busy,
    escapeEnabled: !busy,
    dialogRef,
  });
  useDocumentScrollLock(isOpen && mounted);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className={`modal-ltr ${styles.overlay} ${zIndexClassName}`}
      onClick={handleBackdropClick}
      dir="ltr"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        aria-busy={busy}
        tabIndex={-1}
        className={`${styles.panel} max-w-md`}
      >
        <div className={styles.header}>
          <h3
            id={titleId}
            className="min-w-0 flex-1 text-base font-semibold text-slate-800 dark:text-gray-100 font-kurdish"
          >
            {title}
          </h3>
          <Tooltip content={closeLabel} side="bottom">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className={`${styles.control} size-9`}
              aria-label={closeLabel}
            >
              <X aria-hidden className="size-4" />
            </button>
          </Tooltip>
        </div>

        <div className="min-h-0 overflow-y-auto p-5 flex flex-col gap-4">
          <div id={messageId} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-left font-kurdish break-words">
            {message}
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className={`${styles.control} min-w-0 flex-1 px-4 py-2.5 text-sm text-center font-kurdish`}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy}
              className={`${styles.control} ${tone === "accent" ? styles.primary : tone === "warning" ? styles.warning : styles.danger} min-w-0 flex-1 gap-2 px-4 py-2.5 text-sm font-semibold font-kurdish`}
            >
              {busy ? (
                <>
                  <MotionSpinner>
                    <Loader2 className="h-5 w-5 " />
                  </MotionSpinner>
                  <span>{loadingLabel}</span>
                </>
              ) : (
                <>
                  {tone === "accent" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : tone === "warning" ? (
                    <ChartNoAxesCombined className="h-5 w-5" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                  <span>{confirmLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
});
