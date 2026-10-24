import { DashboardPageLoading } from "@/components/shared/DashboardPageLoading";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { DashboardLoadingShell } from "@/components/shared/DashboardLoadingShell";
import { requestBranding } from "@/lib/brand/request-branding.server";
import {
  BUSINESS_LOCALE_COOKIE,
  businessLocaleFromCookie,
} from "@/features/business/i18n/locale-cookie";

export default async function BusinessDashboardLoading() {
  const [cookieStore, requestHeaders, branding] = await Promise.all([cookies(), headers(), requestBranding()]);
  const locale = businessLocaleFromCookie(
    cookieStore.get(BUSINESS_LOCALE_COOKIE)?.value,
  );
  const pathname = requestHeaders.get("x-public-path") || "";
  return (
    <DashboardLoadingShell scope="business" accentColor={branding.accentColor}>
      <DashboardPageLoading pathname={pathname} scope="business" locale={locale} />
    </DashboardLoadingShell>
  );
}
