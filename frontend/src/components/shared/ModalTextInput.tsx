import type { InputHTMLAttributes, ReactNode } from "react";
import { modalInputClass } from "@/components/shared/modal-input-styles";

export interface ModalTextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  suffix?: ReactNode;
}

export function ModalTextInput({
  hasError = false,
  className = "",
  suffix,
  ...props
}: ModalTextInputProps) {
  const input = (
    <input
      {...props}
      className={modalInputClass(
        hasError,
        `${suffix ? "min-w-0 rounded-e-none! sm:rounded-e-none! border-e-0" : ""} ${className}`,
      )}
      aria-invalid={hasError || undefined}
    />
  );
  if (!suffix) return input;
  return (
    <div dir={props.dir} className="flex w-full items-stretch">
      {input}
      <span
        className={`flex shrink-0 items-center rounded-e-lg border bg-slate-50 px-3 text-xs text-slate-400 dark:bg-white/5 sm:rounded-e-xl ${hasError ? "border-red-400" : "border-gray-300 dark:border-white/10"}`}
      >
        {suffix}
      </span>
    </div>
  );
}
