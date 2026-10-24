"use client";

import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { EditorField } from "@/components/shared/EditorField";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { ModalTextArea } from "@/components/shared/ModalTextArea";
import { IconActionButton } from "@/components/shared/IconActionButton";
import { EDITOR_CARD_CLASS, EDITOR_FIELD_CLASS, EDITOR_INPUT_CLASS, EDITOR_TEXTAREA_CLASS } from "@/components/shared/editor-control-styles";
import type { WhatsAppQuestion } from "@/components/public/WhatsAppQuestionModal";
import type { EditorCopy } from "../editor-copy";
import { questionVideoCopy } from "../question-video-copy";
import { SHARED_INSET_CONTROL_CLASS } from "@/components/shared/shared-control-styles";

export function LinktreeQuestionCard({ question, index, copy, errors, canRemove, onChange, onRemove, reorderGroup, dragHandle }: {
  question: WhatsAppQuestion;
  index: number;
  copy?: EditorCopy;
  errors?: { text?: string; message?: string; videoUrl?: string };
  canRemove: boolean;
  onChange: (field: "text" | "message" | "videoUrl", value: string) => void;
  onRemove: () => void;
  reorderGroup?: string;
  dragHandle?: ReactNode;
}) {
  const textLabel = copy?.questionText ?? "دەقی پرسیار";
  const messageLabel = copy?.questionMessage ?? "پەیام";
  const videoCopy = questionVideoCopy(copy);
  return <section data-reorder-id={question.id} data-reorder-group={reorderGroup} className={`${EDITOR_CARD_CLASS} space-y-4 p-4`}>
    <div className="flex items-center justify-between gap-3">
      <h4 className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
        {dragHandle}
        <span className="flex size-7 items-center justify-center rounded-xl bg-[var(--shared-control-surface)] text-[var(--theme-primary)]">{index + 1}</span>
        {copy?.question ?? "پرسیار"}
      </h4>
      {canRemove && <IconActionButton label={copy?.deleteQuestion ?? "سڕینەوەی پرسیار"} tone="danger" onClick={onRemove}><Trash2 aria-hidden className="size-4" /></IconActionButton>}
    </div>
    <EditorField label={textLabel} className={EDITOR_FIELD_CLASS}>
      <ModalTextInput value={question.text} onChange={(event) => onChange("text", event.target.value)} dir="auto" placeholder={textLabel}
        error={errors?.text ? copy?.questionTextRequired ?? errors.text : undefined} className={EDITOR_INPUT_CLASS} />
    </EditorField>
    <EditorField interactive label={messageLabel} className={EDITOR_FIELD_CLASS} error={errors?.message ? copy?.questionMessageRequired ?? errors.message : undefined}>
      <div className="overflow-hidden rounded-2xl bg-[var(--shared-control-surface)] p-1">
      <div className="px-2 pb-1 pt-2">
        <ModalTextInput aria-label={videoCopy.label} type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={2048}
          value={question.videoUrl ?? ""} onChange={(event) => onChange("videoUrl", event.target.value)} dir="ltr" placeholder={videoCopy.label}
          error={errors?.videoUrl ? videoCopy.error : undefined} className={`${EDITOR_INPUT_CLASS} ${SHARED_INSET_CONTROL_CLASS}`} />
      </div>
      <ModalTextArea aria-label={messageLabel} value={question.message} onChange={(event) => onChange("message", event.target.value)} dir="auto" placeholder={messageLabel}
        aria-invalid={!!errors?.message} rows={2} className={EDITOR_TEXTAREA_CLASS} />
      </div>
    </EditorField>
  </section>;
}
