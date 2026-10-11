"use client";

import type { BusinessLocale } from "../i18n/messages";
import {
  LanguageToggle,
  nextLanguageLocale,
} from "@/components/shared/LanguageToggle";

export function BusinessPreAuthLanguageToggle({
  locale,
  onChange,
}: {
  locale: BusinessLocale;
  onChange: (locale: BusinessLocale) => void;
}) {
  const next = nextLanguageLocale(locale);
  return (
    <LanguageToggle
      locale={locale}
      onClick={() => onChange(next)}
      label={
        next === "ar"
          ? "گۆڕینی زمان بۆ عەرەبی"
          : next === "en"
            ? "التبديل إلى الإنجليزية"
            : "Switch to Kurdish"
      }
    />
  );
}
