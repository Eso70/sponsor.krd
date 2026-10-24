"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { modalInputClass } from "@/components/shared/modal-input-styles";
import { SHARED_CONTROL_CLASS, SHARED_CONTROL_ERROR_CLASS } from "./shared-control-styles";
import { FieldInputError } from "./FieldInputError";
import errorStyles from "./FieldInputError.module.css";

export interface ModalTextInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  error?: string;
  suffix?: ReactNode;
  /** Compact interactive control inside the trailing edge of a text field. */
  endAction?: ReactNode;
}

export function ModalTextInput({
  hasError = false,
  error,
  className = "",
  suffix,
  endAction,
  ...props
}: ModalTextInputProps) {
  const errorId = useId();
  const invalid = hasError || Boolean(error);
  const hasValue = String(props.value ?? props.defaultValue ?? "").trim().length > 0;
  const input = (
    <input
      {...props}
      className={modalInputClass(
        invalid,
        `${suffix ? "min-w-0 rounded-e-none! sm:rounded-e-none! border-e-0" : ""} ${className} ${endAction ? "!pe-32" : ""} ${error && hasValue ? errorStyles.withMessage : ""}`,
      )}
      placeholder={error && !hasValue ? error : props.placeholder}
      aria-invalid={invalid || props["aria-invalid"] || undefined}
      aria-describedby={[props["aria-describedby"], error ? errorId : undefined].filter(Boolean).join(" ") || undefined}
      aria-errormessage={error ? errorId : props["aria-errormessage"]}
    />
  );
  const field = endAction || error ? (
    <div dir={props.dir} className="relative min-w-0 w-full">
      {input}
      {endAction && <span className="absolute inset-y-0 end-2 flex w-28 items-center justify-end">
        {endAction}
      </span>}
      {error && <FieldInputError id={errorId} message={error} empty={!hasValue} />}
    </div>
  ) : (
    input
  );
  if (!suffix) return field;
  return (
    <div dir={props.dir} className="flex w-full items-stretch">
      {field}
      <span
        className={`${SHARED_CONTROL_CLASS} flex shrink-0 items-center rounded-e-lg !rounded-s-none px-3 text-xs ${invalid ? SHARED_CONTROL_ERROR_CLASS : ""}`}
      >
        {suffix}
      </span>
    </div>
  );
}
