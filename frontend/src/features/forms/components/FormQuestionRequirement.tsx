/** Compact two-state badge inside question inputs, shared by all types. */
export function FormQuestionRequirement({
  checked,
  onChange,
  requiredLabel,
  optionalLabel,
  questionNumber,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  requiredLabel: string;
  optionalLabel: string;
  questionNumber: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={`${requiredLabel} Q${questionNumber}`}
      title={checked ? requiredLabel : optionalLabel}
      onClick={() => onChange(!checked)}
      className={`h-7 max-w-full cursor-pointer truncate rounded-md border px-2.5 text-[11px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-primary)] ${checked ? "theme-fill border-transparent text-[var(--theme-ink,#fff)] shadow-sm hover:brightness-95" : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"}`}
    >
      {checked ? requiredLabel : optionalLabel}
    </button>
  );
}
