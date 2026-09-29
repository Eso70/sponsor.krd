import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ErrorPage } from "@/components/error-pages/ErrorPage";
import {
  businessErrorTheme,
  SPONSOR_KRD_ERROR_THEME,
} from "@/components/error-pages/error-theme";
import { businessErrorPageCopy } from "@/features/business/i18n/error-copy";
import { BUSINESS_PUBLIC_LOCALE_COOKIE, publicBusinessLocale } from "@/features/business/i18n/public-locale";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import { RootNotFoundPage } from "@/features/public-site/RootErrorPage";
import { ROOT_PUBLIC_LOCALE_COOKIE, parseRootPublicLocale } from "@/features/public-site/root-public-locale";
import { rootErrorPageCopy } from "@/features/public-site/root-error-copy";
import {
  buildBusinessErrorMetadata,
  fetchBusinessSubdomainThemeFromHeaders,
  getBusinessSubdomainFromHeaders,
} from "@/lib/utils/business-error-theme.server";

export async function generateMetadata(): Promise<Metadata> {
  const subdomain = await getBusinessSubdomainFromHeaders();
  const cookieStore = await cookies();
  const title = subdomain
    ? businessErrorPageCopy(publicBusinessLocale(cookieStore.get(BUSINESS_PUBLIC_LOCALE_COOKIE)?.value), "notFound").title
    : rootErrorPageCopy(parseRootPublicLocale(cookieStore.get(ROOT_PUBLIC_LOCALE_COOKIE)?.value), "notFound").title;
  return buildBusinessErrorMetadata(title);
}

export default async function NotFound() {
  const subdomain = await getBusinessSubdomainFromHeaders();
  const theme = subdomain
    ? businessErrorTheme(await fetchBusinessSubdomainThemeFromHeaders())
    : SPONSOR_KRD_ERROR_THEME;

  const cookieStore = await cookies();
  if (!subdomain) {
    return <RootPublicLocaleProvider initialLocale={parseRootPublicLocale(cookieStore.get(ROOT_PUBLIC_LOCALE_COOKIE)?.value)}><RootNotFoundPage /></RootPublicLocaleProvider>;
  }
  const locale = publicBusinessLocale(cookieStore.get(BUSINESS_PUBLIC_LOCALE_COOKIE)?.value);
  return <ErrorPage {...businessErrorPageCopy(locale, "notFound")} theme={theme} homeHref="/" />;
}
