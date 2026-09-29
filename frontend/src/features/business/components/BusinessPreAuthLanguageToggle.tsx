"use client";

import type { BusinessLocale } from "../i18n/messages";

export function BusinessPreAuthLanguageToggle({ locale, onChange }: {
  locale: BusinessLocale;
  onChange: (locale: BusinessLocale) => void;
}) {
  const next = locale === "ckb" ? "ar" : locale === "ar" ? "en" : "ckb";
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      aria-label={next === "ar" ? "گۆڕینی زمان بۆ عەرەبی" : next === "en" ? "التبديل إلى الإنجليزية" : "Switch to Kurdish"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/85 text-xs font-bold text-slate-600 shadow-sm backdrop-blur transition hover:text-slate-900 dark:border-white/10 dark:bg-[#171a20]/90 dark:text-slate-300 dark:hover:text-white"
    >
      {next === "ckb" ? "KU" : next.toUpperCase()}
    </button>
  );
}
