"use client";
import { FORM_QUESTION_INPUT_CLASS } from "../form-question-input-styles";
import { useState, type Dispatch, type SetStateAction } from "react";
import { PhoneNumberInput } from "@/components/shared/PhoneNumberInput";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { formText } from "../forms-localization";
import type { FormDraft, FormLanguage, FormQuestion } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormProductSelectionPreview } from "./FormProductSelectionPreview";
import { FormConditionalPreview } from "./FormConditionalPreview";
import { FormMediaPreview } from "./FormMediaPreview";
import { isFormImage } from "../form-media";
import {
  canPreviewQuestions,
  canSubmitQuestions,
  conditionalSelection,
} from "../form-preview-answers";

export function FormQuestionsPreview({
  form,
  copy,
  labels,
  id,
  language,
  placeholders,
  visibleQuestions,
  questions,
  answers,
  setAnswers,
  phoneCountryCodes,
  setPhoneCountryCodes,
  onAdvance,
}: {
  onAdvance: () => void;
  form: FormDraft;
  copy: FormsCopy;
  labels: FormEditorCopy;
  id: string;
  language: FormLanguage;
  placeholders: boolean;
  visibleQuestions: FormQuestion[];
  questions: FormQuestion[];
  phoneCountryCodes: Record<string, string>;
  setPhoneCountryCodes: Dispatch<SetStateAction<Record<string, string>>>;
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  const questionGroup = questions.map((question) => question.id).join(",");
  const [invalidGroup, setInvalidGroup] = useState<string | null>(null);
  return (
    <>
      {form.purpose && (
        <p className="whitespace-pre-wrap break-words text-xs opacity-75">
          {form.purpose}
        </p>
      )}
      {!visibleQuestions.length ? (
        <p className="py-8 text-center text-xs opacity-60">
          {copy.previewEmpty}
        </p>
      ) : (
        <form
          data-form-questions
          id={id}
          onSubmit={(event) => {
            event.preventDefault();
            if (
              !event.currentTarget.reportValidity() ||
              !canPreviewQuestions(questions)
            )
              return;
            if (
              questions.some(
                (question) =>
                  question.required &&
                  question.type === "conditional" &&
                  (!question.conditional ||
                    conditionalSelection(
                      question.conditional,
                      answers[question.id] ?? "",
                    ).some((value) => !value)),
              )
            ) {
              setInvalidGroup(questionGroup);
              event.currentTarget
                .querySelector<HTMLButtonElement>(
                  "[data-conditional-missing] button",
                )
                ?.focus();
              return;
            }
            if (!canSubmitQuestions(questions, answers, phoneCountryCodes))
              return;
            onAdvance();
          }}
          className="space-y-3"
        >
          {questions.map((question) => (
            <fieldset key={question.id} className="min-w-0 space-y-1.5">
              {question.type !== "conditional" && (
                <legend className="mb-1 break-words text-xs font-semibold">
                  {formText(question.label, question.labelKey, language) ||
                    copy.questionLabel}
                </legend>
              )}
              {question.description && (
                <p
                  id={`${id}-${question.id}-description`}
                  className="whitespace-pre-wrap break-words text-xs leading-5 opacity-75"
                >
                  {question.description}
                </p>
              )}
              {question.type === "image" && (
                <FormMediaPreview
                  images={question.image ? [question.image] : []}
                  placeholder={placeholders}
                  copy={copy}
                />
              )}
              {question.type === "product" ? (
                <FormProductSelectionPreview
                  question={question}
                  language={language}
                  value={answers[question.id] ?? ""}
                  onChange={(value) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: value,
                    }))
                  }
                />
              ) : question.type === "conditional" ? (
                <FormConditionalPreview
                  question={question}
                  showErrors={invalidGroup === questionGroup}
                  language={language}
                  value={answers[question.id] || ""}
                  onChange={(value) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: value,
                    }))
                  }
                />
              ) : question.type === "choice" ? (
                question.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-400/30 px-3 py-2 text-xs"
                  >
                    {isFormImage(question.optionImages?.[index] ?? "") && (
                      <FormMediaPreview
                        option
                        imageTitle={option || `${copy.options} ${index + 1}`}
                        images={[question.optionImages![index]]}
                        copy={copy}
                      />
                    )}
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name={`${id}-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        required={question.required}
                        aria-describedby={
                          question.description
                            ? `${id}-${question.id}-description`
                            : undefined
                        }
                        onChange={(event) =>
                          setAnswers((current) => ({
                            ...current,
                            [question.id]: event.target.value,
                          }))
                        }
                      />
                      {option || `${copy.options} ${index + 1}`}
                    </label>
                  </div>
                ))
              ) : question.type === "phone" ? (
                <PhoneNumberInput
                  language={language}
                  inputClassName={FORM_QUESTION_INPUT_CLASS}
                  selectorClassName="!h-10 !rounded-lg !px-2 !py-0 !text-base sm:!text-sm"
                  label={
                    formText(question.label, question.labelKey, language) ||
                    copy.questionLabel
                  }
                  countryLabel={labels.callingCode}
                  value={answers[question.id] || ""}
                  onChange={(value) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: value,
                    }))
                  }
                  countryCode={phoneCountryCodes[question.id] || "964"}
                  onCountryCodeChange={(code) =>
                    setPhoneCountryCodes((current) => ({
                      ...current,
                      [question.id]: code,
                    }))
                  }
                  placeholder={copy.phone}
                  required={question.required}
                  descriptionId={
                    question.description
                      ? `${id}-${question.id}-description`
                      : undefined
                  }
                />
              ) : (
                <ModalTextInput
                  aria-describedby={
                    question.description
                      ? `${id}-${question.id}-description`
                      : undefined
                  }
                  className={FORM_QUESTION_INPUT_CLASS}
                  aria-label={
                    formText(question.label, question.labelKey, language) ||
                    copy.questionLabel
                  }
                  type={
                    question.type === "email"
                      ? "email"
                      : question.type === "date"
                        ? "date"
                        : question.labelKey === "age"
                          ? "number"
                          : "text"
                  }
                  min={question.labelKey === "age" ? 0 : undefined}
                  step={question.labelKey === "age" ? 1 : undefined}
                  inputMode={
                    question.labelKey === "age" ? "numeric" : undefined
                  }
                  pattern={
                    question.type === "short" &&
                    question.required &&
                    question.labelKey !== "age"
                      ? ".*\\S.*"
                      : undefined
                  }
                  maxLength={1000}
                  placeholder={
                    question.type === "email" ? copy.email : labels.enterAnswer
                  }
                  required={question.required}
                  value={answers[question.id] || ""}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: event.target.value,
                    }))
                  }
                />
              )}
            </fieldset>
          ))}
        </form>
      )}
    </>
  );
}
