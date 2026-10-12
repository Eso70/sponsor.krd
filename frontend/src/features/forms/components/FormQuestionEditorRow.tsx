"use client";
import { FORM_QUESTION_INPUT_CLASS } from "../form-question-input-styles";
import { ChevronDown, Trash2, GitBranch, Type, List } from "lucide-react";
import { FormValidationNotice } from "./FormValidationNotice";
import { useFormValidation } from "./FormValidationContext";
import { useState } from "react";
import { ReorderHandle } from "@/components/shared/ReorderHandle";
import { FormQuestionRequirement } from "./FormQuestionRequirement";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { IconActionButton } from "@/components/shared/IconActionButton";
import type { FormDraft, FormQuestion } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormEditorInput } from "./FormEditorInput";
import { FormConditionalEditor } from "./FormConditionalEditor";
import { FormChoiceOptionsEditor } from "./FormChoiceOptionsEditor";
import { FormProductSelectionEditor } from "./FormProductSelectionEditor";
import { FormImagePicker } from "./FormImagePicker";

export function FormQuestionEditorRow({
  form,
  question,
  index,
  onChange,
  update,
  reorder,
  step,
  reorderGroup,
  copy,
  labels,
}: {
  form: FormDraft;
  question: FormQuestion;
  index: number;
  onChange: (patch: Partial<FormDraft>) => void;
  update: (id: string, patch: Partial<FormQuestion>) => void;
  reorder: (source: string, target: string) => void;
  step: (id: string, offset: number) => void;
  reorderGroup: string;
  copy: FormsCopy;
  labels: FormEditorCopy;
}) {
  const validation = useFormValidation();
  const [expanded, setExpanded] = useState(
    !question.category && !question.label.trim(),
  );
  return (
    <details
      data-reorder-id={question.id}
      data-reorder-group={reorderGroup}
      open={expanded || validation.selected?.questionId === question.id}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
      className="group overflow-hidden rounded-lg border border-slate-200/70 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <summary className="flex min-h-13 cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm">
        <ReorderHandle
          id={question.id}
          group={reorderGroup}
          label={`${labels.reorder} Q${index + 1}`}
          onReorder={reorder}
          onStep={(offset) => step(question.id, offset)}
        />
        <span className="text-[10px] text-slate-400">Q{index + 1}</span>
        <span
          title={question.category ? labels.personal : labels.custom}
          className="max-w-24 shrink-0 truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-white/5 dark:text-slate-400"
        >
          {question.category ? labels.personal : labels.custom}
        </span>
        {question.type === "short" && (
          <Type aria-hidden className="size-3.5 shrink-0 text-slate-400" />
        )}
        {question.type === "choice" && (
          <List aria-hidden className="size-3.5 shrink-0 text-slate-400" />
        )}
        {question.type === "conditional" && (
          <GitBranch aria-hidden className="size-3.5 shrink-0 text-slate-400" />
        )}
        <span className="min-w-0 flex-1 truncate font-semibold">
          {(question.type === "choice" || question.type === "conditional") &&
          expanded
            ? null
            : question.label || copy.questionLabel}
        </span>
        <ChevronDown className="size-3.5 shrink-0 transition group-open:rotate-180" />
        <IconActionButton
          label={`${copy.remove} Q${index + 1}`}
          tone="danger"
          onClick={() =>
            onChange({
              questions: form.questions
                .filter((item) => item.id !== question.id)
                .map((item) =>
                  item.condition?.questionId === question.id
                    ? { ...item, condition: undefined }
                    : item,
                ),
            })
          }
        >
          <Trash2 className="size-3.5" />
        </IconActionButton>
      </summary>
      <div className="space-y-4 border-t border-slate-200 p-4 dark:border-white/10">
        <FormValidationNotice
          fields={[
            `questions.${question.id}.conditional`,
            `questions.${question.id}.condition`,
            `questions.${question.id}.options`,
          ]}
        />
        {question.type === "conditional" ? (
          <FormConditionalEditor
            question={question}
            language={form.language}
            requirement={
              <FormQuestionRequirement
                checked={question.required}
                onChange={(required) => update(question.id, { required })}
                requiredLabel={copy.required}
                optionalLabel={labels.optional}
                questionNumber={index + 1}
              />
            }
            onChange={(patch) => update(question.id, patch)}
          />
        ) : (
          <>
            <FormEditorInput
              inputClassName={FORM_QUESTION_INPUT_CLASS}
              validationField={`questions.${question.id}.label`}
              label={copy.questionLabel}
              inputAction={
                <FormQuestionRequirement
                  checked={question.required}
                  onChange={(required) => update(question.id, { required })}
                  requiredLabel={copy.required}
                  optionalLabel={labels.optional}
                  questionNumber={index + 1}
                />
              }
              value={question.label}
              onChange={(label) =>
                update(question.id, { label, labelKey: undefined })
              }
              placeholder={labels.questionHint}
            />
            {(question.type === "short" ||
              question.type === "choice" ||
              question.type === "product") && (
              <FormEditorInput
                label={copy.descriptionLabel}
                hint={labels.optional}
                value={question.description ?? ""}
                placeholder={labels.questionDescriptionHint}
                onChange={(description) => update(question.id, { description })}
                maxLength={210}
              />
            )}
            {question.type === "product" && (
              <FormProductSelectionEditor
                question={question}
                language={form.language}
                copy={labels.productSelection}
                onChange={(patch) => update(question.id, patch)}
              />
            )}
            {question.type === "image" && (
              <FormImagePicker
                label={labels.imageQuestion}
                images={question.image ? [question.image] : []}
                onChange={(images) =>
                  update(question.id, { image: images[0] ?? "" })
                }
                hint={labels.imageHint}
                copy={copy}
              />
            )}
            {question.type === "choice" && (
              <FormChoiceOptionsEditor
                form={form}
                question={question}
                onChange={onChange}
                copy={copy}
                labels={labels}
              />
            )}
          </>
        )}
        {(question.condition ||
          form.questions
            .slice(0, index)
            .some(
              (item) =>
                item.type === "choice" &&
                item.options.some((option) => option.trim()),
            )) && (
          <div className="grid gap-2 sm:grid-cols-2">
            <CustomSelect
              label={labels.when}
              value={question.condition?.questionId ?? ""}
              options={[
                { value: "", label: labels.always },
                ...form.questions
                  .slice(0, index)
                  .filter(
                    (item) =>
                      item.type === "choice" &&
                      item.options.some((option) => option.trim()),
                  )
                  .map((item) => ({
                    value: item.id,
                    label: item.label || copy.questionLabel,
                  })),
              ]}
              onChange={(questionId) =>
                update(question.id, {
                  condition: questionId
                    ? {
                        questionId,
                        equals: form.questions
                          .find((item) => item.id === questionId)!
                          .options.find((option) => option.trim())!,
                      }
                    : undefined,
                })
              }
            />
            {question.condition && (
              <CustomSelect
                label={labels.answer}
                value={question.condition.equals}
                options={(
                  form.questions.find(
                    (item) => item.id === question.condition?.questionId,
                  )?.options ?? []
                )
                  .filter((option) => option.trim())
                  .map((option) => ({ value: option, label: option }))}
                onChange={(equals) =>
                  update(question.id, {
                    condition: { ...question.condition!, equals },
                  })
                }
              />
            )}
          </div>
        )}
      </div>
    </details>
  );
}
