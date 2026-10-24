"use client";

import { memo, useId, useRef, type CSSProperties } from "react";
import { useDocumentScrollLock } from "@/hooks/useDocumentScrollLock";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import { parseWebsiteColor } from "@/lib/utils/parse-website-color";
import { WhatsAppQuestionPanel } from "./WhatsAppQuestionPanel";
import surfaceStyles from "@/components/shared/picker-popup-surface.module.css";

export interface WhatsAppQuestion { id: string; text: string; message: string; videoUrl?: string; }
export interface WhatsAppQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (message: string, question?: WhatsAppQuestion) => void;
  whatsappUrl: string;
  title?: string;
  subtitle?: string;
  questions?: WhatsAppQuestion[];
  appearance?: "light" | "dark";
  accentColor?: string;
  /** Stay inside the phone viewport without locking the dashboard document. */
  embedded?: boolean;
}

export const WhatsAppQuestionModal = memo(function WhatsAppQuestionModal({ isOpen, onClose, onSelectQuestion, title, subtitle, questions, appearance = "light", accentColor, embedded = false }: WhatsAppQuestionModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalKeyboard({ isOpen: isOpen && !embedded, onEscape: onClose, dialogRef });
  useDocumentScrollLock(isOpen && !embedded);
  if (!isOpen) return null;
  const accent = parseWebsiteColor(accentColor);
  return <div className={`${appearance} fixed inset-0 z-[100] flex items-end justify-center bg-black/35 p-3 backdrop-blur-sm sm:items-center sm:p-5`}
    style={{ "--theme-primary": accent.primary } as CSSProperties}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialogRef} role="dialog" aria-modal={!embedded} aria-labelledby={titleId} tabIndex={-1}
      onKeyDown={embedded ? (event) => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } } : undefined}
      data-picker-surface data-appearance={appearance}
      className={`${surfaceStyles.surface} flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden !rounded-3xl border outline-none`}>
      <WhatsAppQuestionPanel titleId={titleId} title={title} subtitle={subtitle} questions={questions} onClose={onClose}
        onSelectQuestion={(message, question) => { onSelectQuestion(message, question); onClose(); }} />
    </div>
  </div>;
});
