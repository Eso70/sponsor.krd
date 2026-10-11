"use client";
import { useId } from "react";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { conditionalCopy } from "../conditional-copy";
import { conditionalSelection } from "../form-preview-answers";
import { conditionalOptions } from "../conditional-csv";
import type { FormLanguage, FormQuestion } from "../types";

export function FormConditionalPreview({
  question,
  language,
  value,
  onChange,
  showErrors = false,
}: {
  question: FormQuestion;
  language: FormLanguage;
  value: string;
  onChange: (value: string) => void;
  showErrors?: boolean;
}) {
  const id = useId();
  const labels = conditionalCopy(language);
  const data = question.conditional;
  if (!data)
    return (
      <p role="status" className="text-xs opacity-60">
        {labels.empty}
      </p>
    );
  const selected = conditionalSelection(data, value);
  return (
    <div className="space-y-3">
      {data.columns.map((column, index) => {
        const options = conditionalOptions(data, index, selected);
        const missing =
          question.required && !selected[index] && options.length > 0;
        const errorId = `${id}-${index}-error`;
        return (
          <div
            key={index}
            className="space-y-1.5"
            data-conditional-missing={missing || undefined}
          >
            <CustomSelect
              ariaInvalid={showErrors && missing}
              ariaDescribedBy={showErrors && missing ? errorId : undefined}
              label={column}
              ariaLabel={column}
              labelClassName="!text-xs !normal-case !tracking-normal !text-[var(--preview-text)]"
              triggerClassName="modal-standard-input !h-9 !rounded-lg !text-xs"
              inheritAppearance
              emptyLabel={labels.select}
              value={selected[index]}
              disabled={!options.length}
              options={[
                { value: "", label: labels.select },
                ...options.map((option) => ({ value: option, label: option })),
              ]}
              onChange={(answer) =>
                onChange(JSON.stringify([...selected.slice(0, index), answer]))
              }
            />
            {showErrors && missing && (
              <p
                id={errorId}
                role="alert"
                className="text-xs text-red-600 dark:text-red-400"
              >
                {labels.select}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
