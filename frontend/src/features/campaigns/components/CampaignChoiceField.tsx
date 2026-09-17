import type { ReactNode } from "react";

import { RequiredMark } from "@/components/shared/RequiredMark";

export function CampaignChoiceField({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 flex w-full items-center justify-between gap-3 text-[11px] font-black text-slate-600 dark:text-slate-300">
        <span>
          {label}
          {required ? <RequiredMark /> : null}
        </span>
        {hint ? (
          <span className="font-normal text-slate-400">{hint}</span>
        ) : null}
      </legend>
      {children}
    </fieldset>
  );
}
