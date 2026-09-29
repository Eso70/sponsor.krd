"use client";

import { useTranslations } from "next-intl";
import { LanguagePreferenceSelect } from "@/components/shared/LanguagePreferenceSelect";
import { useBusinessLocale } from "@/features/business/i18n/BusinessLocaleProvider";

/** Edits the same member preference as the dashboard header. */
export function BusinessLanguageDropdown() {
  const t = useTranslations("Language");
  const { locale, saving, canChangeLocale, changeLocale } = useBusinessLocale();

  if (!canChangeLocale) return null;

  return <LanguagePreferenceSelect
    label={t("defaultDashboardLanguage")}
    hint={t("savedForYourAccount")}
    value={locale}
    onChange={(value) => void changeLocale(value)}
    disabled={saving}
  />;
}
