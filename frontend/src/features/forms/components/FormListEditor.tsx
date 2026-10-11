"use client";
import { useId } from "react";
import { createRuntimeId } from "@/lib/utils/random-id";
import type { FormContentBlock } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { formListItems } from "../form-list-items";
import { FormEditorInput } from "./FormEditorInput";
import { FormEditorAddButton } from "./FormEditorAddButton";
import { FormListEditorRow } from "./FormListEditorRow";
export function FormListEditor({
  block,
  onChange,
  copy,
  labels,
}: {
  block: FormContentBlock;
  onChange: (patch: Partial<FormContentBlock>) => void;
  copy: FormsCopy;
  labels: FormEditorCopy;
}) {
  const faq = block.type === "faq";
  const group = useId();
  const steps = formListItems(block);
  const reorder = (source: string, target: string) => {
    const from = steps.findIndex((step) => step.id === source);
    const to = steps.findIndex((step) => step.id === target);
    if (from < 0 || to < 0 || from === to) return;
    const items = [...steps];
    const [step] = items.splice(from, 1);
    items.splice(to, 0, step);
    onChange({ items });
  };
  return (
    <div className="space-y-4">
      <FormEditorInput
        label={copy.headline}
        value={block.title}
        placeholder={faq ? labels.faq : labels.stepsHeadlineHint}
        maxLength={30}
        showCount
        onChange={(title) => onChange({ title })}
      />
      <div className="space-y-3">
        <h4 className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
          {faq ? labels.questionsAndAnswers : labels.steps}{" "}
          <span className="font-normal text-slate-400">({steps.length}/5)</span>
        </h4>
        {steps.map((step, index) => (
          <FormListEditorRow
            key={step.id}
            step={step}
            faq={faq}
            index={index}
            group={group}
            copy={copy}
            labels={labels}
            canRemove={steps.length > 1}
            onChange={(patch) =>
              onChange({
                items: steps.map((entry) =>
                  entry.id === step.id ? { ...entry, ...patch } : entry,
                ),
              })
            }
            onRemove={() =>
              onChange({ items: steps.filter((entry) => entry.id !== step.id) })
            }
            onReorder={reorder}
            onMove={(offset) => {
              const target = steps[index + offset];
              if (target) reorder(step.id, target.id);
            }}
          />
        ))}
        <FormEditorAddButton
          disabled={steps.length >= 5}
          onClick={() =>
            onChange({
              items: [...steps, { id: createRuntimeId(), title: "", text: "" }],
            })
          }
        >
          {faq ? labels.addFaq : labels.addStep}
        </FormEditorAddButton>
      </div>
    </div>
  );
}
