import { DashboardPageLoading } from "@/components/shared/DashboardPageLoading";
import { headers } from "next/headers";
import { DashboardLoadingShell } from "@/components/shared/DashboardLoadingShell";
import { requestBranding } from "@/lib/brand/request-branding.server";
import { cookies } from "next/headers";
import {
  PLATFORM_LOCALE_COOKIE,
  parsePlatformLocale,
} from "@/features/platform-admin/i18n/locale";

export default async function PlatformDashboardLoading() {
  const [cookieStore, requestHeaders, branding] = await Promise.all([cookies(), headers(), requestBranding()]);
  const locale = parsePlatformLocale(
    cookieStore.get(PLATFORM_LOCALE_COOKIE)?.value,
  );
  const pathname = requestHeaders.get("x-public-path") || "";
  return (
    <DashboardLoadingShell scope="platform" accentColor={branding.accentColor}>
      <DashboardPageLoading pathname={pathname} scope="platform" locale={locale} />
    </DashboardLoadingShell>
  );
}
