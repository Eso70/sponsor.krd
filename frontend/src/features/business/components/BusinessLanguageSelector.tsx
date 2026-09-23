"use client";

import { useTranslations } from "next-intl";
import { DashboardHeaderActionButton } from "@/components/shared/DashboardHeader";
import { Tooltip } from "@/components/shared/Tooltip";
import { useBusinessLocale } from "@/features/business/i18n/BusinessLocaleProvider";

export function BusinessLanguageSelector() {
  const t = useTranslations("Language");
  const { locale, saving, canChangeLocale, changeLocale } = useBusinessLocale();

  if (!canChangeLocale) return null;

  const switchLabel =
    locale === "ckb" ? t("switchToArabic") : t("switchToKurdish");

  return (
    <Tooltip content={switchLabel} side="bottom">
      <DashboardHeaderActionButton
        aria-label={switchLabel}
        aria-busy={saving}
        disabled={saving}
        onClick={() => void changeLocale(locale === "ckb" ? "ar" : "ckb")}
      >
        <span aria-hidden="true" className="text-xs font-bold leading-5">
          {locale === "ckb" ? "AR" : "KU"}
        </span>
      </DashboardHeaderActionButton>
    </Tooltip>
  );
}
