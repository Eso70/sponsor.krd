import type { ButtonHTMLAttributes } from "react";
export const FORM_PREVIEW_ACTION_CLASS =
  "theme-fill relative flex min-h-9 w-full items-center justify-center rounded-lg px-3 py-2 text-xs font-bold text-[var(--theme-ink)]";
export function FormPreviewButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`${FORM_PREVIEW_ACTION_CLASS} disabled:opacity-40 ${className}`}
    />
  );
}
