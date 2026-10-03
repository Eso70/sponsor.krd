"use client";

import type { BusinessLocale } from "@/features/business/i18n/messages";
import { businessPublicCopy } from "@/features/business/i18n/public-copy";
import { rememberPublicBusinessLocale } from "@/features/business/i18n/public-locale";
import { PublicLanguageToggle } from "@/components/shared/PublicLanguageToggle";

export function PublicBusinessLanguageToggle({
  locale,
  onChange,
}: {
  locale: BusinessLocale;
  onChange: (locale: BusinessLocale) => void;
}) {
  const nextLocale = locale === "ckb" ? "ar" : locale === "ar" ? "en" : "ckb";
  return (
    <PublicLanguageToggle
      locale={locale}
      label={businessPublicCopy[locale].switchLanguage}
      onClick={() => {
        rememberPublicBusinessLocale(nextLocale);
        onChange(nextLocale);
      }}
    />
  );
}
