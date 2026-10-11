"use client";
import { FormsManagementPage } from "@/features/forms/components/FormsManagementPage";
import { usePlatformLocale } from "../i18n/PlatformLocaleProvider";
import { PlatformLanguageSelector } from "./PlatformLanguageSelector";
import { DashboardAppearanceControls } from "@/components/shared/DashboardAppearanceControls";
import { usePlatformCopy } from "../i18n/copy";
import type { AppTheme } from "@/lib/app-theme";
export function PlatformFormsPage({
  theme,
  mounted,
  onToggleTheme,
}: {
  theme: AppTheme;
  mounted: boolean;
  onToggleTheme: () => void;
}) {
  const { locale } = usePlatformLocale();
  const copy = usePlatformCopy();
  return (
    <FormsManagementPage
      scope="platform"
      locale={locale}
      headerControls={
        <DashboardAppearanceControls
          compact
          languageControl={<PlatformLanguageSelector compact />}
          theme={theme}
          mounted={mounted}
          onToggleTheme={onToggleTheme}
          labels={{
            theme: copy.theme,
            darkTheme: copy.darkTheme,
            lightTheme: copy.lightTheme,
            themeLabel: copy.theme,
          }}
        />
      }
    />
  );
}
