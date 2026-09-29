"use client";

import { TemplatesPage } from "@/features/templates/components/TemplatesPage";
import { arabicTemplatesPageCopy } from "@/features/templates/arabic-copy";
import { englishBusinessMessages } from "@/features/shared/i18n/english-messages";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";

export function PlatformTemplatesPage() {
  const { locale } = usePlatformLocale();
  return <TemplatesPage copy={locale === "ar" ? arabicTemplatesPageCopy : locale === "en" ? englishBusinessMessages.TemplatesPage : undefined} />;
}
