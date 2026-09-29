"use client";

import { DashboardHeaderActionButton } from "@/components/shared/DashboardHeader";
import { Tooltip } from "@/components/shared/Tooltip";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { usePlatformCopy } from "@/features/platform-admin/i18n/copy";

export function PlatformLanguageSelector() {
  const { locale, saving, changeLocale } = usePlatformLocale();
  const copy = usePlatformCopy();
  const next = locale === "ckb" ? "ar" : locale === "ar" ? "en" : "ckb";
  return (
    <Tooltip content={copy.switchLanguage} side="bottom">
      <DashboardHeaderActionButton
        disabled={saving}
        aria-busy={saving}
        aria-label={copy.switchLanguage}
        onClick={() => void changeLocale(next)}
      >
        <span aria-hidden="true" className="text-xs font-bold leading-5">
          {next === "ar" ? "AR" : next === "en" ? "EN" : "KU"}
        </span>
      </DashboardHeaderActionButton>
    </Tooltip>
  );
}
