"use client";

import { memo, useId, useLayoutEffect, useRef, type CSSProperties } from "react";
import { useDocumentScrollLock } from "@/hooks/useDocumentScrollLock";
import { deriveTextColor } from "@/lib/utils/theme-colors";
import { readWhatsappQuestionColor } from "@linktree/types/whatsapp-question.cjs";
import { WhatsAppQuestionPanel } from "./WhatsAppQuestionPanel";
import surfaceStyles from "@/components/shared/picker-popup-surface.module.css";
import styles from "./WhatsAppQuestionModal.module.css";

function outsideDialog(dialog: HTMLDialogElement, x: number, y: number) {
  const bounds = dialog.getBoundingClientRect();
  return x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom;
}

export interface WhatsAppQuestion { id: string; text: string; message: string; videoUrl?: string; }
export interface WhatsAppQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (message: string, question?: WhatsAppQuestion) => void;
  whatsappUrl: string;
  title?: string;
  subtitle?: string;
  questions?: WhatsAppQuestion[];
  backgroundColor?: string;
  /** Stay inside the phone viewport without locking the dashboard document. */
  embedded?: boolean;
}

export const WhatsAppQuestionModal = memo(function WhatsAppQuestionModal({ isOpen, onClose, onSelectQuestion, title, subtitle, questions, backgroundColor, embedded = false }: WhatsAppQuestionModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropTouch = useRef<{ id: number; x: number; y: number } | null>(null);
  // A preview dialog belongs to its iframe, so it must never lock the dashboard.
  useDocumentScrollLock(isOpen, dialogRef);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      // Native dialogs otherwise focus the first button (Close), which can
      // draw a keyboard outline immediately after a touch/click opening.
      dialog.focus({ preventScroll: true });
    }
    else if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  const color = readWhatsappQuestionColor(backgroundColor);
  const text = deriveTextColor(color, color, color);
  const appearance = text === "#ffffff" ? "dark" : "light";
  const dismiss = () => {
    // Release the native top layer before parent state/tracking work runs.
    if (dialogRef.current?.open) dialogRef.current.close();
    onClose();
  };
  return <dialog ref={dialogRef} aria-labelledby={titleId} tabIndex={-1}
    className={`${appearance} ${surfaceStyles.surface} ${styles.dialog}`}
    data-picker-surface data-appearance={appearance} data-embedded={embedded}
    style={{
      "--picker-surface": color,
      "--theme-primary": text,
      "--shared-control-text": text,
      "--shared-control-muted": `color-mix(in srgb, ${text} 70%, ${color})`,
      "--shared-control-surface": `color-mix(in srgb, ${text} 6%, ${color})`,
      "--shared-control-hover": `color-mix(in srgb, ${text} 10%, ${color})`,
    } as CSSProperties}
    onCancel={(event) => { event.preventDefault(); event.stopPropagation(); dismiss(); }}
    onTouchStart={(event) => {
      const touch = event.touches[0];
      backdropTouch.current = event.target === event.currentTarget && event.touches.length === 1 && outsideDialog(event.currentTarget, touch.clientX, touch.clientY)
        ? { id: touch.identifier, x: touch.clientX, y: touch.clientY } : null;
    }}
    onTouchMove={(event) => {
      const start = backdropTouch.current;
      const touch = event.touches[0];
      if (start && (event.touches.length !== 1 || Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 12)) backdropTouch.current = null;
    }}
    onTouchCancel={() => { backdropTouch.current = null; }}
    onTouchEnd={(event) => {
      const start = backdropTouch.current;
      backdropTouch.current = null;
      const touch = Array.from(event.changedTouches).find(item => item.identifier === start?.id);
      if (!start || !touch || event.touches.length || Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 12 || !outsideDialog(event.currentTarget, touch.clientX, touch.clientY)) return;
      // touchend is cancelable on iOS: suppress its delayed compatibility click
      // so the same tap cannot activate a page link after the dialog disappears.
      event.preventDefault();
      event.stopPropagation();
      dismiss();
    }}
    onClick={(event) => {
      if (!event.currentTarget.open || event.target !== event.currentTarget) return;
      if (outsideDialog(event.currentTarget, event.clientX, event.clientY)) dismiss();
    }}>
      <WhatsAppQuestionPanel titleId={titleId} title={title} subtitle={subtitle} questions={questions} onClose={dismiss}
        onSelectQuestion={(message, question) => { onSelectQuestion(message, question); dismiss(); }} />
  </dialog>;
});
