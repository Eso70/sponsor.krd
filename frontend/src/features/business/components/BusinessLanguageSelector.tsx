"use client";

import { useTranslations } from "next-intl";
import {
  LanguageToggle,
  nextLanguageLocale,
} from "@/components/shared/LanguageToggle";
import { useBusinessLocale } from "@/features/business/i18n/BusinessLocaleProvider";

export function BusinessLanguageSelector({
  compact = false,
}: {
  compact?: boolean;
}) {
  const t = useTranslations("Language");
  const { locale, saving, canChangeLocale, changeLocale } = useBusinessLocale();

  if (!canChangeLocale) return null;

  const nextLocale = nextLanguageLocale(locale);
  const switchLabel =
    nextLocale === "ar"
      ? t("switchToArabic")
      : nextLocale === "en"
        ? t("switchToEnglish")
        : t("switchToKurdish");

  return (
    <LanguageToggle
      locale={locale}
      label={switchLabel}
      size={compact ? "compact" : "dashboard"}
      busy={saving}
      onClick={() => void changeLocale(nextLocale)}
    />
  );
}
