"use client";

import { LanguageFlag } from "./LanguageFlag";

export function PublicLanguageToggle({ locale, label, onClick }: {
  locale: "ckb" | "ar" | "en";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="relative flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-lg text-xs font-bold text-slate-600 transition-colors hover:bg-black/6 hover:text-slate-950 dark:text-white/75 dark:hover:bg-white/8 dark:hover:text-white"
      aria-label={label}
      onClick={onClick}
    >
      <LanguageFlag locale={locale} />
    </button>
  );
}
