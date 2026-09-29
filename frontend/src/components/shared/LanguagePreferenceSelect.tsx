"use client";

import { CustomSelect } from "@/components/shared/CustomSelect";

type LanguagePreference = "ckb" | "ar" | "en";

const languageOptions: { value: LanguagePreference; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ckb", label: "کوردی" },
  { value: "ar", label: "العربية" },
];

export function LanguagePreferenceSelect({ label, hint, value, onChange, disabled = false }: {
  label: string;
  hint?: string;
  value: LanguagePreference;
  onChange: (value: LanguagePreference) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5" role="group" aria-label={label}>
      <CustomSelect
        label={label}
        value={value}
        options={languageOptions}
        onChange={onChange}
        disabled={disabled}
      />
      {hint ? <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}
