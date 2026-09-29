"use client";

import { useTranslations } from "next-intl";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { useBusinessLocale } from "@/features/business/i18n/BusinessLocaleProvider";
import type { BusinessLocale } from "@/features/business/i18n/messages";

const languageOptions: { value: BusinessLocale; label: string }[] = [
  { value: "ckb", label: "کوردی" },
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
];

/** Edits the same member preference as the dashboard header. */
export function BusinessLanguageDropdown() {
  const t = useTranslations("Language");
  const { locale, saving, canChangeLocale, changeLocale } = useBusinessLocale();

  if (!canChangeLocale) return null;

  return (
    <div className="space-y-1.5">
      <CustomSelect
        label={t("defaultDashboardLanguage")}
        value={locale}
        options={languageOptions}
        onChange={(value) => void changeLocale(value)}
        disabled={saving}
      />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t("savedForYourAccount")}
      </p>
    </div>
  );
}
