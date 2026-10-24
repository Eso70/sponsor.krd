"use client";

import { ArrowUpRight, MessageCircle, X } from "lucide-react";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import { usePublicLinktreeCopy, usePublicLinktreeLocale } from "@/features/business/i18n/public-linktree";
import type { WhatsAppQuestion } from "./WhatsAppQuestionModal";
import { whatsappQuestionMessage } from "@linktree/types/whatsapp-question.cjs";

/** Visitor-facing content shared by published pages and editor previews. */
export function WhatsAppQuestionPanel({ titleId, title, subtitle, questions, onClose, onSelectQuestion }: {
  titleId: string;
  title?: string;
  subtitle?: string;
  questions?: readonly WhatsAppQuestion[];
  onClose: () => void;
  onSelectQuestion: (message: string, question?: WhatsAppQuestion) => void;
}) {
  const copy = usePublicLinktreeCopy();
  const locale = usePublicLinktreeLocale();
  return <div dir={locale === "en" ? "ltr" : "rtl"} className="flex min-h-0 flex-col">
    <header className="flex items-start gap-3 p-5 pb-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--shared-control-surface)] text-[var(--theme-primary)]">
        <MessageCircle aria-hidden className="size-5" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <h2 id={titleId} className="break-words text-lg font-semibold leading-6">{title || copy.modalTitle}</h2>
        <p className="mt-1 break-words text-sm leading-5 text-[var(--shared-control-muted)]">{subtitle || copy.modalSubtitle}</p>
      </div>
      <button type="button" onClick={onClose} aria-label={copy.close} className={`${SHARED_SOFT_BUTTON_CLASS} flex size-8 shrink-0 items-center justify-center`}><X aria-hidden className="size-4" /></button>
    </header>
    <div className="custom-scrollbar min-h-0 overflow-y-auto overscroll-contain space-y-2 px-5 pb-5">
      {(questions ?? copy.questions).map((question) => <button key={question.id} type="button" onClick={() => onSelectQuestion(whatsappQuestionMessage(question), question)}
        className={`${SHARED_SOFT_BUTTON_CLASS} flex min-h-14 w-full items-center gap-3 px-4 py-3 text-start text-sm font-medium`}>
        <span className="min-w-0 flex-1 break-words">{question.text}</span>
        <ArrowUpRight aria-hidden className="size-4 shrink-0 opacity-60 rtl:-scale-x-100" />
      </button>)}
    </div>
  </div>;
}
