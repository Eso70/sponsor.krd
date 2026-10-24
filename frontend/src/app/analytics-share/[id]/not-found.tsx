import { headers } from "next/headers";
import { SharedAnalyticsUnavailable } from "@/features/analytics-sharing/components/SharedAnalyticsUnavailable";
import {
  fetchBusinessSubdomainThemeFromHeaders,
  getBusinessSubdomainFromHeaders,
} from "@/lib/utils/business-error-theme.server";

export default async function NotFound() {
  const language = (await headers()).get("x-share-locale");
  const locale = language === "ar" || language === "ckb" ? language : "en";
  const subdomain = await getBusinessSubdomainFromHeaders();
  const theme = subdomain
    ? await fetchBusinessSubdomainThemeFromHeaders()
    : null;
  return (
    <SharedAnalyticsUnavailable
      locale={locale}
      branding={
        theme
          ? {
              name: theme.name || subdomain,
              logo: theme.logo,
              favicon: theme.favicon,
              accentColor: theme.websiteColor.raw,
              businessTenant: true,
            }
          : undefined
      }
    />
  );
}
