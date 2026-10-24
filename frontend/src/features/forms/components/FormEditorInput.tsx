"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useFormValidation } from "./FormValidationContext";
import { EDITOR_FIELD_CLASS, EDITOR_INPUT_CLASS, EDITOR_TEXTAREA_CLASS } from "@/components/shared/editor-control-styles";
import { EditorField } from "@/components/shared/EditorField";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { ModalTextArea } from "@/components/shared/ModalTextArea";

export function FormEditorInput({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
  maxLength = 300,
  hint,
  description,
  inputAction,
  showCount = false,
  validationField,
  inputClassName,
}: {
  validationField?: string;
  inputClassName?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
  maxLength?: number;
  hint?: string;
  description?: string;
  inputAction?: React.ReactNode;
  showCount?: boolean;
}) {
  const validation = useFormValidation();
  const errorId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const [touched, setTouched] = useState(false);
  const error =
    validation.attempted || touched
      ? validation.issues.find((issue) => issue.field === validationField)
          ?.message
      : undefined;
  const selected =
    validation.selected?.field === validationField && !!validationField;
  useEffect(() => {
    if (!selected) return;
    const input = wrapper.current?.querySelector<
      HTMLInputElement | HTMLTextAreaElement
    >("input, textarea");
    input?.focus({ preventScroll: true });
    input?.scrollIntoView?.({ block: "nearest", behavior: "auto" });
  }, [selected, validation.selected]);
  const props = {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    onBlur: () => setTouched(true),
    "aria-label": label,
    value,
    placeholder: label,
    maxLength,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(event.target.value),
  };
  return (
    <div ref={wrapper}>
      <EditorField
        label={label}
        error={error}
        errorId={errorId}
        required={required}
        hint={hint}
        interactive={!!inputAction}
        className={EDITOR_FIELD_CLASS}
      >
        {description && (
          <span className="mb-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </span>
        )}
        {multiline ? (
          <ModalTextArea
            {...props}
            rows={2}
            className={EDITOR_TEXTAREA_CLASS}
          />
        ) : (
          <ModalTextInput
            {...props}
            hasError={!!error}
            endAction={inputAction}
            className={
              inputClassName ?? EDITOR_INPUT_CLASS
            }
          />
        )}
        {showCount && (
          <span
            className="mt-1 block text-end text-[11px] font-normal text-slate-400"
            aria-live="off"
          >
            {value.length} / {maxLength}
          </span>
        )}
      </EditorField>
    </div>
  );
}
