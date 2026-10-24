import type { ButtonHTMLAttributes } from "react";
export const FORM_PREVIEW_ACTION_CLASS =
  "theme-fill relative flex min-h-9 w-full items-center justify-center rounded-2xl px-3 py-2 text-xs font-semibold text-[var(--theme-ink)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current motion-reduce:transition-none";
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
