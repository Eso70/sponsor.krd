import { PlatformAdminErrorPage } from "@/features/platform-admin/components/PlatformAdminErrorPage";
import { cookies } from "next/headers";
import { PLATFORM_LOCALE_COOKIE, parsePlatformLocale } from "@/features/platform-admin/i18n/locale";

export default async function NotFound() {
  const cookieStore = await cookies();
  return <PlatformAdminErrorPage kind="notFound" locale={parsePlatformLocale(cookieStore.get(PLATFORM_LOCALE_COOKIE)?.value)} />;
}
