"use client";
import { useId, useState } from "react";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { createQuestion, reorderFormQuestions } from "../forms-model";
import type {
  FormDraft,
  FormQuestion,
  QuestionType,
  FormTextKey,
} from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormEditorInput } from "./FormEditorInput";
import { FormQuestionEditorRow } from "./FormQuestionEditorRow";

export function FormQuestionsEditor({
  form,
  onChange,
  copy,
  labels,
}: {
  form: FormDraft;
  onChange: (patch: Partial<FormDraft>) => void;
  copy: FormsCopy;
  labels: FormEditorCopy;
}) {
  const groupId = useId();
  const [reorderMessage, setReorderMessage] = useState("");
  const update = (id: string, patch: Partial<FormQuestion>) =>
    onChange({
      questions: form.questions.map((question) =>
        question.id === id ? { ...question, ...patch } : question,
      ),
    });
  const add = (
    type: QuestionType,
    label: string,
    category?: string,
    labelKey?: FormTextKey,
  ) => {
    if (form.questions.length >= 50) return;
    onChange({
      questions: [
        ...form.questions,
        { ...createQuestion(type), label, category, labelKey },
      ],
    });
  };
  const reorder = (source: string, target: string) => {
    const questions = reorderFormQuestions(form.questions, source, target);
    if (questions === form.questions) {
      setReorderMessage(labels.reorderBlocked);
      return;
    }
    setReorderMessage("");
    onChange({ questions });
  };
  const step = (id: string, offset: number) => {
    const position = form.questions.findIndex((question) => question.id === id);
    if (position < 0) return;
    const target = form.questions[position + offset];
    if (target) reorder(id, target.id);
  };
  const categories: {
    id: string;
    title: string;
    fields: { type: QuestionType; label: string; key: FormTextKey }[];
  }[] = [
    {
      id: "contact",
      title: labels.contact,
      fields: [
        { type: "phone", label: copy.phone, key: "phone" },
        { type: "email", label: copy.email, key: "email" },
        { type: "short", label: labels.address, key: "address" },
        { type: "short", label: labels.country, key: "country" },
        { type: "short", label: labels.city, key: "city" },
        { type: "short", label: labels.province, key: "province" },
        { type: "short", label: labels.zipCode, key: "zipCode" },
      ],
    },
    {
      id: "user",
      title: labels.user,
      fields: [
        { type: "short", label: labels.firstName, key: "firstName" },
        { type: "short", label: labels.lastName, key: "lastName" },
        { type: "short", label: labels.personName, key: "personName" },
        { type: "date", label: labels.birth, key: "birth" },
        { type: "short", label: labels.age, key: "age" },
      ],
    },
    {
      id: "work",
      title: labels.work,
      fields: [
        { type: "short", label: labels.company, key: "company" },
        { type: "short", label: labels.job, key: "job" },
        { type: "email", label: labels.workEmail, key: "workEmail" },
        { type: "phone", label: labels.workPhone, key: "workPhone" },
      ],
    },
  ];
  const rows = form.questions.map((question, index) => (
    <FormQuestionEditorRow
      key={question.id}
      form={form}
      question={question}
      index={index}
      onChange={onChange}
      update={update}
      reorder={reorder}
      step={step}
      reorderGroup={groupId}
      copy={copy}
      labels={labels}
    />
  ));
  return (
    <div className="space-y-4">
      <p
        role="status"
        className={
          reorderMessage
            ? "text-xs text-amber-700 dark:text-amber-400"
            : "sr-only"
        }
      >
        {reorderMessage}
      </p>
      {form.layout !== "card" && (
        <FormEditorInput
          label={copy.purpose}
          value={form.purpose}
          onChange={(purpose) => onChange({ purpose })}
          placeholder={labels.purposeHint}
          maxLength={500}
        />
      )}
      <div className="space-y-3" aria-label={copy.questions}>
        {rows}
      </div>
      <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
            {labels.custom}
          </span>
        </div>
        <div className="w-fit min-w-36">
          <CustomSelect
            label={labels.custom}
            placement="top"
            maxMenuHeight={480}
            minMenuWidth={240}
            hideLabel
            allowEmptySelection
            triggerLabel={`+ ${copy.addQuestion}`}
            value=""
            options={[
              { value: "short", label: copy.short },
              { value: "choice", label: copy.choice },
              { value: "conditional", label: labels.conditional },
            ]}
            onChange={(type) => {
              if (!type) return;
              if (type === "conditional") {
                if (form.questions.length >= 50) return;
                onChange({
                  questions: [...form.questions, createQuestion("conditional")],
                });
                return;
              }
              add(type as QuestionType, "");
            }}
            disabled={form.questions.length >= 50}
            triggerClassName="!h-10 !py-2 !text-[13px]"
          />
        </div>
      </div>
      <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
        <h4 className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
          {labels.personal}
        </h4>
        {form.layout === "card" && (
          <>
            <FormEditorInput
              label={copy.questionLabel}
              value={form.personalCardTitle ?? ""}
              placeholder={labels.personalCardHint}
              maxLength={70}
              showCount
              onChange={(personalCardTitle) => onChange({ personalCardTitle })}
            />
            <FormEditorInput
              label={copy.descriptionLabel}
              value={form.personalCardDescription ?? ""}
              placeholder={labels.descriptionHint}
              multiline
              maxLength={210}
              hint={labels.optional}
              onChange={(personalCardDescription) =>
                onChange({ personalCardDescription })
              }
            />
          </>
        )}
        <div className="w-fit min-w-36">
          <CustomSelect
            label={labels.personal}
            hideLabel
            allowEmptySelection
            triggerLabel={`+ ${copy.addQuestion}`}
            value=""
            placement="top"
            maxMenuHeight={480}
            minMenuWidth={240}
            options={categories.flatMap((category) =>
              category.fields.map((field) => ({
                value: field.key,
                label: field.label,
                group: category.title,
              })),
            )}
            disabled={form.questions.length >= 50}
            triggerClassName="!h-10 !py-2 !text-[13px]"
            onChange={(key) => {
              const category = categories.find((category) =>
                category.fields.some((field) => field.key === key),
              );
              const field = category?.fields.find((field) => field.key === key);
              if (category && field)
                add(field.type, field.label, category.id, field.key);
            }}
          />
        </div>
      </div>
    </div>
  );
}
