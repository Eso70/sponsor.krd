"use client";

import { useTranslations } from "next-intl";
import { DashboardHeaderActionButton } from "@/components/shared/DashboardHeader";
import { Tooltip } from "@/components/shared/Tooltip";
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
        aria-label={switchLabel}
        aria-busy={saving}
        disabled={saving}
        onClick={() => void changeLocale(nextLocale)}
      >
        <span aria-hidden="true" className="text-xs font-bold leading-5">
          {nextLocale === "ckb" ? "KU" : nextLocale.toUpperCase()}
        </span>
      </DashboardHeaderActionButton>
    </Tooltip>
  );
}
