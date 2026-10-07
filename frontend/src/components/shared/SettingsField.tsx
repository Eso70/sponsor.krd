import type { ReactNode } from "react";

export function SettingsField({
  label,
  children,
  htmlFor,
}: {
  label: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
