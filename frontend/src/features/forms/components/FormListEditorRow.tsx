import { Trash2 } from "lucide-react";
import { ReorderHandle } from "@/components/shared/ReorderHandle";
import { IconActionButton } from "@/components/shared/IconActionButton";
import type { FormContentBlock } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormEditorInput } from "./FormEditorInput";
type Step = NonNullable<FormContentBlock["items"]>[number];
export function FormListEditorRow({
  step,
  index,
  group,
  copy,
  labels,
  onChange,
  onRemove,
  onReorder,
  onMove,
  canRemove,
  faq = false,
}: {
  step: Step;
  index: number;
  group: string;
  copy: FormsCopy;
  labels: FormEditorCopy;
  onChange: (patch: Partial<Step>) => void;
  onRemove: () => void;
  onReorder: (source: string, target: string) => void;
  onMove: (offset: number) => void;
  canRemove: boolean;
  faq?: boolean;
}) {
  const itemLabel = faq ? labels.faqQuestion : labels.step;
  return (
    <div
      data-reorder-id={step.id}
      data-reorder-group={group}
      className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10"
    >
      <div className="flex items-center gap-2 bg-slate-50/70 px-2 py-1 dark:bg-white/[0.03]">
        <ReorderHandle
          id={step.id}
          group={group}
          label={`${labels.reorder}: ${itemLabel} ${index + 1}`}
          onReorder={onReorder}
          onStep={onMove}
        />
        <span className="flex-1 text-[13px] font-bold text-slate-700 dark:text-slate-200">
          {itemLabel} {index + 1}
        </span>
        <IconActionButton
          label={`${copy.remove} ${itemLabel} ${index + 1}`}
          tone="danger"
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Trash2 aria-hidden className="size-4" />
        </IconActionButton>
      </div>
      <div className="space-y-3 p-3">
        <FormEditorInput
          label={`${faq ? labels.faqQuestion : labels.stepTitle} ${index + 1}`}
          value={step.title}
          placeholder={`${faq ? labels.faqQuestionHint : labels.stepTitleHint} ${index + 1}`}
          maxLength={70}
          showCount
          onChange={(title) => onChange({ title })}
        />
        <FormEditorInput
          label={`${faq ? labels.faqAnswer : labels.stepDescription} ${index + 1}`}
          value={step.text}
          placeholder={`${faq ? labels.faqAnswerHint : labels.stepDescriptionHint} ${index + 1}`}
          maxLength={1000}
          multiline
          onChange={(text) => onChange({ text })}
        />
      </div>
    </div>
  );
}
