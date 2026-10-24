import { SHARED_INSET_CONTROL_CLASS, SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";

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
      className={`${SHARED_SOFT_BUTTON_CLASS} ${SHARED_INSET_CONTROL_CLASS} h-7 max-w-full shrink-0 cursor-pointer truncate px-2.5 text-[11px] font-semibold`}
    >
      {checked ? requiredLabel : optionalLabel}
    </button>
  );
}
