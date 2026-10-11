"use client";

import { useBusinessLocale } from "@/features/business/i18n/BusinessLocaleProvider";
import { FormsManagementPage } from "@/features/forms/components/FormsManagementPage";
import { useTranslations } from "next-intl";
import { DashboardAppearanceControls } from "@/components/shared/DashboardAppearanceControls";
import { BusinessLanguageSelector } from "./BusinessLanguageSelector";
import type { AppTheme } from "@/lib/app-theme";

export function BusinessFormsPage({
  capabilities,
  accentColor,
  theme,
  mounted,
  onToggleTheme,
}: {
  capabilities?: { create: boolean; update: boolean; remove: boolean };
  accentColor?: string | null;
  theme: AppTheme;
  mounted: boolean;
  onToggleTheme: () => void;
}) {
  const { locale } = useBusinessLocale();
  const t = useTranslations("Header");
  return (
    <FormsManagementPage
      locale={locale}
      capabilities={capabilities}
      accentColor={accentColor}
      headerControls={
        <DashboardAppearanceControls
          compact
          languageControl={<BusinessLanguageSelector compact />}
          theme={theme}
          mounted={mounted}
          onToggleTheme={onToggleTheme}
          labels={{
            theme: t("theme"),
            darkTheme: t("darkTheme"),
            lightTheme: t("lightTheme"),
            themeLabel: t("themeLabel"),
          }}
        />
      }
    />
  );
}
