"use client";

import { Plus, Trash2 } from "lucide-react";
import { IconActionButton } from "@/components/shared/IconActionButton";
import type { FormDraft, FormQuestion } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormEditorInput } from "./FormEditorInput";
import { FormImagePicker } from "./FormImagePicker";

/** Image-first answer cards, shared by the form and card layout editors. */
export function FormChoiceOptionsEditor({
  form,
  question,
  onChange,
  copy,
  labels,
}: {
  form: FormDraft;
  question: FormQuestion;
  onChange: (patch: Partial<FormDraft>) => void;
  copy: FormsCopy;
  labels: FormEditorCopy;
}) {
  const update = (patch: Partial<FormQuestion>) =>
    onChange({
      questions: form.questions.map((item) =>
        item.id === question.id ? { ...item, ...patch } : item,
      ),
    });
  const rename = (index: number, value: string) => {
    const previous = question.options[index];
    onChange({
      questions: form.questions.map((item) =>
        item.id === question.id
          ? {
              ...item,
              options: question.options.map((option, position) =>
                position === index ? value : option,
              ),
            }
          : item.condition?.questionId === question.id &&
              item.condition.equals === previous
            ? { ...item, condition: { ...item.condition, equals: value } }
            : item,
      ),
    });
  };
  const remove = (index: number) => {
    if (question.options.length <= 2) return;
    onChange({
      questions: form.questions.map((item) =>
        item.id === question.id
          ? {
              ...item,
              options: question.options.filter(
                (_, position) => position !== index,
              ),
              optionImages: question.options.flatMap((_, position) =>
                position === index
                  ? []
                  : [question.optionImages?.[position] ?? ""],
              ),
            }
          : item.condition?.questionId === question.id &&
              item.condition.equals === question.options[index]
            ? { ...item, condition: undefined }
            : item,
      ),
    });
  };
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="mb-2 flex w-full items-center justify-between text-[13px] font-bold text-slate-600 dark:text-slate-300">
        {copy.options}
        <span className="text-xs font-normal text-slate-400">
          {question.options.length} / 20
        </span>
      </legend>
      {question.options.map((option, index) => (
        <div
          key={index}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-200/70 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02]"
        >
          <FormImagePicker
            key={`${question.id}-${index}-${question.options.length}`}
            variant="option"
            labels={labels}
            label={`${labels.image} ${copy.options} ${index + 1}`}
            images={
              question.optionImages?.[index]
                ? [question.optionImages[index]]
                : []
            }
            onChange={(images) =>
              update({
                optionImages: question.options.map((_, position) =>
                  position === index
                    ? (images[0] ?? "")
                    : (question.optionImages?.[position] ?? ""),
                ),
              })
            }
            hint=""
            copy={copy}
          />
          <FormEditorInput
            validationField={`questions.${question.id}.options.${index}`}
            label={`${copy.options} ${index + 1}`}
            value={option}
            placeholder={labels.optionHint}
            onChange={(value) => rename(index, value)}
          />
          <IconActionButton
            label={`${copy.remove} ${copy.options} ${index + 1}`}
            tone="danger"
            disabled={question.options.length <= 2}
            onClick={() => remove(index)}
          >
            <Trash2 className="size-3.5" />
          </IconActionButton>
        </div>
      ))}
      <button
        type="button"
        disabled={question.options.length >= 20}
        className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
        onClick={() => {
          if (question.options.length >= 20) return;
          update({
            options: [...question.options, ""],
            optionImages: [
              ...question.options.map(
                (_, index) => question.optionImages?.[index] ?? "",
              ),
              "",
            ],
          });
        }}
      >
        <Plus aria-hidden className="size-4" />
        {copy.addOption}
      </button>
    </fieldset>
  );
}
