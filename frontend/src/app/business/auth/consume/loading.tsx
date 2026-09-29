import { SkeletonAuthenticationPage } from "@/components/shared/SkeletonAuthenticationPage";
import { fetchBusinessSubdomainThemeFromHeaders } from "@/lib/utils/business-error-theme.server";
import { BUSINESS_LOGO_PLACEHOLDER } from "@/lib/brand/brand-assets";
import { cookies } from "next/headers";
import { BUSINESS_LOCALE_COOKIE, businessLocaleFromCookie } from "@/features/business/i18n/locale-cookie";
import { businessPreAuthCopy } from "@/features/business/i18n/pre-auth-copy";

export default async function BusinessAuthConsumeLoading() {
  const theme = await fetchBusinessSubdomainThemeFromHeaders().catch(() => null);
  const locale = businessLocaleFromCookie((await cookies()).get(BUSINESS_LOCALE_COOKIE)?.value);
  const copy = businessPreAuthCopy[locale];

  return (
    <SkeletonAuthenticationPage
      content="operation"
      brandDescription={copy.consumeDescription}
      brandName={theme?.name || copy.business}
      brandLogo={theme?.logo ?? BUSINESS_LOGO_PLACEHOLDER}
      accentColor={theme?.websiteColor?.raw}
      previewTitle={copy.preview}
      businessTenant
      language={locale}
      loadingLabel={copy.loadingAuthentication}
      backLabel={copy.back}
      themeCopy={{ label: copy.theme, light: copy.lightTheme, dark: copy.darkTheme }}
    />
  );
}
