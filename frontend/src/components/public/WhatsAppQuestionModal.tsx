"use client";

import { memo, useId, useLayoutEffect, useRef, type CSSProperties } from "react";
import { useDocumentScrollLock } from "@/hooks/useDocumentScrollLock";
import { deriveTextColor } from "@/lib/utils/theme-colors";
import { readWhatsappQuestionColor } from "@linktree/types/whatsapp-question.cjs";
import { WhatsAppQuestionPanel } from "./WhatsAppQuestionPanel";
import surfaceStyles from "@/components/shared/picker-popup-surface.module.css";
import styles from "./WhatsAppQuestionModal.module.css";

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
  // A preview dialog belongs to its iframe, so it must never lock the dashboard.
  useDocumentScrollLock(isOpen, dialogRef);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    else if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  const color = readWhatsappQuestionColor(backgroundColor);
  const text = deriveTextColor(color, color, color);
  const appearance = text === "#ffffff" ? "dark" : "light";
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
    onCancel={(event) => { event.preventDefault(); event.stopPropagation(); onClose(); }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
      <WhatsAppQuestionPanel titleId={titleId} title={title} subtitle={subtitle} questions={questions} onClose={onClose}
        onSelectQuestion={(message, question) => { onSelectQuestion(message, question); onClose(); }} />
  </dialog>;
});
