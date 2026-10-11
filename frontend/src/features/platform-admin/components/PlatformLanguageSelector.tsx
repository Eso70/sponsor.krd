"use client";

import {
  LanguageToggle,
  nextLanguageLocale,
} from "@/components/shared/LanguageToggle";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { usePlatformCopy } from "@/features/platform-admin/i18n/copy";

export function PlatformLanguageSelector({
  preAuth = false,
  compact = false,
}: {
  preAuth?: boolean;
  compact?: boolean;
}) {
  const { locale, saving, changeLocale, syncLocale } = usePlatformLocale();
  const copy = usePlatformCopy();
  const next = nextLanguageLocale(locale);
  return (
    <LanguageToggle
      size={compact ? "compact" : preAuth ? "standard" : "dashboard"}
      locale={locale}
      label={copy.switchLanguage}
      busy={!preAuth && saving}
      onClick={() => (preAuth ? syncLocale(next) : void changeLocale(next))}
    />
  );
}
