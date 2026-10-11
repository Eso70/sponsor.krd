import type { InputHTMLAttributes, ReactNode } from "react";
import { modalInputClass } from "@/components/shared/modal-input-styles";

export interface ModalTextInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  suffix?: ReactNode;
  /** Compact interactive control inside the trailing edge of a text field. */
  endAction?: ReactNode;
}

export function ModalTextInput({
  hasError = false,
  className = "",
  suffix,
  endAction,
  ...props
}: ModalTextInputProps) {
  const input = (
    <input
      {...props}
      className={modalInputClass(
        hasError,
        `${suffix ? "min-w-0 rounded-e-none! sm:rounded-e-none! border-e-0" : ""} ${className} ${endAction ? "!pe-32" : ""}`,
      )}
      aria-invalid={hasError || undefined}
    />
  );
  const field = endAction ? (
    <div dir={props.dir} className="relative min-w-0 w-full">
      {input}
      <span className="absolute inset-y-0 end-2 flex w-28 items-center justify-end">
        {endAction}
      </span>
    </div>
  ) : (
    input
  );
  if (!suffix) return field;
  return (
    <div dir={props.dir} className="flex w-full items-stretch">
      {field}
      <span
        className={`flex shrink-0 items-center rounded-e-lg border bg-slate-50 px-3 text-xs text-slate-400 dark:bg-white/5 sm:rounded-e-xl ${hasError ? "border-red-400" : "border-gray-300 dark:border-white/10"}`}
      >
        {suffix}
      </span>
    </div>
  );
}
