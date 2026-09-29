import { PlatformAdminDashboard } from "@/features/platform-admin/components/PlatformAdminDashboard";
import { isPlatformPage } from "@/features/platform-admin/platform-pages";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { PLATFORM_LOCALE_COOKIE, parsePlatformLocale } from "@/features/platform-admin/i18n/locale";

export default async function PlatformConsolePage({
  params,
}: {
  params: Promise<{ consolePath?: string[] }>;
}) {
  const { consolePath = [] } = await params;
  if (
    consolePath.length > 1 ||
    (consolePath[0] !== undefined && !isPlatformPage(consolePath[0]))
  ) {
    notFound();
  }

  const cookieStore = await cookies();
  return <PlatformLocaleProvider initialLocale={parsePlatformLocale(cookieStore.get(PLATFORM_LOCALE_COOKIE)?.value)}><PlatformAdminDashboard /></PlatformLocaleProvider>;
}
