"use client";

import type { BusinessLocale } from "@/features/business/i18n/messages";
import { businessPublicCopy } from "@/features/business/i18n/public-copy";
import { rememberPublicBusinessLocale } from "@/features/business/i18n/public-locale";
import {
  LanguageToggle,
  nextLanguageLocale,
} from "@/components/shared/LanguageToggle";

export function PublicBusinessLanguageToggle({
  locale,
  onChange,
}: {
  locale: BusinessLocale;
  onChange: (locale: BusinessLocale) => void;
}) {
  const nextLocale = nextLanguageLocale(locale);
  return (
    <LanguageToggle
      size="compact"
      locale={locale}
      label={businessPublicCopy[locale].switchLanguage}
      onClick={() => {
        rememberPublicBusinessLocale(nextLocale);
        onChange(nextLocale);
      }}
    />
  );
}
