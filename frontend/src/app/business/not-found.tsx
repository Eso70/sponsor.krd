import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ErrorPage } from "@/components/error-pages/ErrorPage";
import { businessErrorTheme } from "@/components/error-pages/error-theme";
import { businessErrorPageCopy } from "@/features/business/i18n/error-copy";
import { BUSINESS_LOCALE_COOKIE, businessLocaleFromCookie } from "@/features/business/i18n/locale-cookie";
import {
  buildAuthenticatedBusinessErrorMetadata,
  fetchAuthenticatedBusinessTheme,
} from "@/lib/utils/business-error-theme.server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = businessLocaleFromCookie((await cookies()).get(BUSINESS_LOCALE_COOKIE)?.value);
  return buildAuthenticatedBusinessErrorMetadata(businessErrorPageCopy(locale, "notFound").title);
}

export default async function NotFound() {
  const theme = await fetchAuthenticatedBusinessTheme();
  const locale = businessLocaleFromCookie((await cookies()).get(BUSINESS_LOCALE_COOKIE)?.value);
  return (
    <ErrorPage
      {...businessErrorPageCopy(locale, "notFound")}
      theme={businessErrorTheme(theme)}
      homeHref="/"
    />
  );
}
