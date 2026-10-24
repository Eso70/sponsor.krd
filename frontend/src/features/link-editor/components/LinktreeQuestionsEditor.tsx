"use client";
import { Plus, MessageCircle } from "lucide-react";
import { useId } from "react";
import { ReorderHandle } from "@/components/shared/ReorderHandle";
import { reorderItems } from "@/lib/utils/reorder-items";
import { formEditorCopy } from "@/features/forms/form-editor-copy";
import type { WhatsAppQuestion } from "@/components/public/WhatsAppQuestionModal";
import { EditorField } from "@/components/shared/EditorField";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { EDITOR_FIELD_CLASS, EDITOR_INPUT_CLASS, EDITOR_CARD_CLASS } from "@/components/shared/editor-control-styles";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import type { EditorCopy } from "../editor-copy";
import { LinktreeQuestionCard } from "./LinktreeQuestionCard";
import { createRuntimeId } from "@/lib/utils/random-id";

export interface LinktreeQuestionsEditorProps {
  copy?: EditorCopy;
  whatsappModalEnabled: boolean;
  whatsappModalTitle: string;
  whatsappModalSubtitle: string;
  whatsappQuestions: WhatsAppQuestion[];
  onWhatsappModalTitleChange: (value: string) => void;
  onWhatsappModalSubtitleChange: (value: string) => void;
  onWhatsappQuestionsChange: (questions: WhatsAppQuestion[]) => void;
  questionErrors?: Record<string, { text?: string; message?: string; videoUrl?: string }>;
}
export function LinktreeQuestionsEditor({ copy, whatsappModalEnabled, whatsappModalTitle, whatsappModalSubtitle, whatsappQuestions, onWhatsappModalTitleChange, onWhatsappModalSubtitleChange, onWhatsappQuestionsChange, questionErrors = {} }: LinktreeQuestionsEditorProps) {
  const reorderGroup = useId();
  const reorderLabel = formEditorCopy(copy?.language === "en" ? "en" : copy ? "ar" : "ckb").reorder;
  const reorder = (source: string, target: string) => {
    const next = reorderItems(whatsappQuestions, source, target);
    if (next !== whatsappQuestions) onWhatsappQuestionsChange(next);
  };
  if (!whatsappModalEnabled) return null;
  const titleLabel = copy?.modalTitle ?? "سەردێڕ";
  const subtitleLabel = copy?.modalSubtitle ?? "ژێر سەردێڕ";
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <EditorField label={titleLabel} className={EDITOR_FIELD_CLASS}>
        <ModalTextInput value={whatsappModalTitle} onChange={(event) => onWhatsappModalTitleChange(event.target.value)} placeholder={titleLabel} dir="auto" className={EDITOR_INPUT_CLASS} />
      </EditorField>
      <EditorField label={subtitleLabel} className={EDITOR_FIELD_CLASS}>
        <ModalTextInput value={whatsappModalSubtitle} onChange={(event) => onWhatsappModalSubtitleChange(event.target.value)} placeholder={subtitleLabel} dir="auto" className={EDITOR_INPUT_CLASS} />
      </EditorField>
    </div>
    <div className="flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
        <MessageCircle aria-hidden className="size-4" />{copy?.questions ?? "پرسیارەکان"}
        <span className="text-xs font-normal text-slate-400">{whatsappQuestions.length}</span>
      </h3>
      <button type="button" className={`${SHARED_SOFT_BUTTON_CLASS} flex h-9 items-center gap-1.5 px-3 text-xs font-semibold`}
        onClick={() => onWhatsappQuestionsChange([...whatsappQuestions, { id: createRuntimeId("question_"), text: "", message: "" }])}>
        <Plus aria-hidden className="size-4" />{copy?.addQuestion ?? "زیادکردنی پرسیار"}
      </button>
    </div>
    {whatsappQuestions.length === 0 && <p className={`${EDITOR_CARD_CLASS} p-5 text-center text-xs leading-5 text-slate-500 dark:text-slate-400`}>{copy?.noQuestions ?? "هیچ پرسیارێک نییە."}</p>}
    <div className="space-y-3">
      {whatsappQuestions.map((question, index) => <LinktreeQuestionCard key={question.id} question={question} index={index} copy={copy}
        reorderGroup={reorderGroup}
        dragHandle={whatsappQuestions.length > 1 && <ReorderHandle id={question.id} group={reorderGroup}
          label={`${reorderLabel} ${copy?.question ?? "پرسیار"} ${index + 1}`} onReorder={reorder}
          onStep={(offset) => { const target = whatsappQuestions[index + offset]; if (target) reorder(question.id, target.id); }} />}
        errors={questionErrors[question.id]} canRemove={whatsappQuestions.length > 1}
        onRemove={() => onWhatsappQuestionsChange(whatsappQuestions.filter((item) => item.id !== question.id))}
        onChange={(field, value) => onWhatsappQuestionsChange(whatsappQuestions.map((item) => item.id === question.id ? { ...item, [field]: value } : item))} />)}
    </div>
  </div>;
}
