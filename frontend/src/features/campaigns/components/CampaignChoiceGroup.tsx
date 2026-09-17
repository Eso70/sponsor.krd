import { Check } from "lucide-react";

import { modalChoiceButtonClass } from "@/features/link-editor/modal-input-styles";

export interface CampaignChoiceOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export function CampaignChoiceGroup<T extends string>({
  value,
  options,
  onChange,
  columns = 2,
}: {
  value: T;
  options: ReadonlyArray<CampaignChoiceOption<T>>;
  onChange: (value: T) => void;
  columns?: 2 | 4;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-2.5 ${
        columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"
      }`}
      role="radiogroup"
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={modalChoiceButtonClass(
              false,
              "min-h-14 items-start text-start",
            )}
            style={
              selected
                ? {
                    borderColor: "var(--theme-primary)",
                    background:
                      "color-mix(in srgb, var(--theme-primary) 8%, transparent)",
                  }
                : undefined
            }
          >
            <span className="min-w-0">
              <span className="block font-bold text-slate-800 dark:text-slate-100">
                {option.label}
              </span>
              {option.description ? (
                <span className="mt-1 block text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  {option.description}
                </span>
              ) : null}
            </span>
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition ${
                selected
                  ? "theme-fill border-transparent text-[var(--theme-ink)]"
                  : "border-slate-300 text-transparent dark:border-white/20"
              }`}
            >
              <Check className="size-3" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
