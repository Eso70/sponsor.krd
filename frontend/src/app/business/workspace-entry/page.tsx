"use client";

import { useEffect, useState } from "react";
import { AuthenticationCard } from "@/components/shared/AuthenticationCard";
import { AuthenticationMethods } from "@/components/shared/AuthenticationMethods";
import { AuthenticationShell } from "@/components/shared/AuthenticationShell";
import {
  applyBusinessTabBranding,
  loadBusinessSubdomainTheme,
  type BusinessSubdomainTheme,
} from "@/lib/utils/business-error-theme";
import { BUSINESS_LOGO_PLACEHOLDER } from "@/lib/brand/brand-assets";
import { businessPreAuthCopy } from "@/features/business/i18n/pre-auth-copy";
import { usePreAuthBusinessLocale } from "@/features/business/i18n/usePreAuthBusinessLocale";
import { BusinessPreAuthLanguageToggle } from "@/features/business/components/BusinessPreAuthLanguageToggle";

export default function BusinessWorkspaceEntryPage() {
  const [theme, setTheme] = useState<BusinessSubdomainTheme | null>(null);
  const { locale, changeLocale } = usePreAuthBusinessLocale();
  const copy = businessPreAuthCopy[locale];

  useEffect(() => {
    void loadBusinessSubdomainTheme().then((loadedTheme) => {
      setTheme(loadedTheme);
      applyBusinessTabBranding(loadedTheme.favicon, loadedTheme.name);
    });
  }, []);

  return (
    <AuthenticationShell
      brandDescription={copy.entryDescription}
      brandName={theme?.name || copy.business}
      // Explicit, never the shell's SponsorKrd default: a tenant page shows the
      // business logo or the neutral placeholder, never the platform's mark.
      brandLogo={theme?.logo ?? BUSINESS_LOGO_PLACEHOLDER}
      accentColor={theme?.websiteColor.raw}
      previewTitle={copy.preview}
      businessTenant
      language={locale}
      backLabel={copy.back}
      themeCopy={{ label: copy.theme, light: copy.lightTheme, dark: copy.darkTheme }}
      headerAction={<BusinessPreAuthLanguageToggle locale={locale} onChange={changeLocale} />}
    >
      <AuthenticationCard
        title={copy.entryTitle}
        description={copy.entryHint}
      >
        <AuthenticationMethods
          rememberDevice
          googleHref="/api/auth/google/start"
          requestEndpoint="/api/auth/email/request"
          verifyEndpoint="/api/auth/email/verify"
          emailPlaceholder={copy.emailPlaceholder}
          emailActionLabel={copy.emailAction}
          emailCodeTitle={copy.codeTitle}
          emailVerifyActionLabel={copy.verify}
          copy={copy}
        />
      </AuthenticationCard>
    </AuthenticationShell>
  );
}
