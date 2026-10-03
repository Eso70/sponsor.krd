"use client";

import { DashboardHeaderActionButton } from "@/components/shared/DashboardHeader";
import { Tooltip } from "@/components/shared/Tooltip";
import { LanguageFlag } from "@/components/shared/LanguageFlag";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { usePlatformCopy } from "@/features/platform-admin/i18n/copy";

export function PlatformLanguageSelector() {
  const { locale, saving, changeLocale } = usePlatformLocale();
  const copy = usePlatformCopy();
  const next = locale === "ckb" ? "ar" : locale === "ar" ? "en" : "ckb";
  return (
    <Tooltip content={copy.switchLanguage} side="bottom">
      <DashboardHeaderActionButton
        className="size-10 overflow-hidden !p-0 sm:size-11 md:size-12"
        disabled={saving}
        aria-busy={saving}
        aria-label={copy.switchLanguage}
        onClick={() => void changeLocale(next)}
      >
        <LanguageFlag locale={locale} />
      </DashboardHeaderActionButton>
    </Tooltip>
  );
}
