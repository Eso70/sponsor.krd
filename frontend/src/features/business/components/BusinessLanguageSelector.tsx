"use client";

import { useTranslations } from "next-intl";
import { DashboardHeaderActionButton } from "@/components/shared/DashboardHeader";
import { Tooltip } from "@/components/shared/Tooltip";
import { LanguageFlag } from "@/components/shared/LanguageFlag";
import { useBusinessLocale } from "@/features/business/i18n/BusinessLocaleProvider";

export function BusinessLanguageSelector() {
  const t = useTranslations("Language");
  const { locale, saving, canChangeLocale, changeLocale } = useBusinessLocale();

  if (!canChangeLocale) return null;

  const nextLocale = locale === "ckb" ? "ar" : locale === "ar" ? "en" : "ckb";
  const switchLabel = nextLocale === "ar" ? t("switchToArabic") : nextLocale === "en" ? t("switchToEnglish") : t("switchToKurdish");

  return (
    <Tooltip content={switchLabel} side="bottom">
      <DashboardHeaderActionButton
        className="size-10 overflow-hidden !p-0 sm:size-11 md:size-12"
        aria-label={switchLabel}
        aria-busy={saving}
        disabled={saving}
        onClick={() => void changeLocale(nextLocale)}
      >
        <LanguageFlag locale={locale} />
      </DashboardHeaderActionButton>
    </Tooltip>
  );
}
