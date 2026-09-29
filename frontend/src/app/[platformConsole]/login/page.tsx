import { cookies } from "next/headers";
import PlatformAdminLoginPage from "@/features/platform-admin/components/PlatformAdminLoginPage";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { PLATFORM_LOCALE_COOKIE, parsePlatformLocale } from "@/features/platform-admin/i18n/locale";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = parsePlatformLocale((await cookies()).get(PLATFORM_LOCALE_COOKIE)?.value);
  return {
    title: `${locale === "ar" ? "تسجيل دخول المدير" : locale === "en" ? "Administrator login" : "چوونەژوورەوەی بەڕێوەبەر"} | Sponsor.krd`,
    description: locale === "ar" ? "سجّل الدخول لإدارة المنصة" : locale === "en" ? "Log in to manage the platform" : "بڕۆ ژوورەوە بۆ بەڕێوەبردنی پلاتفۆڕم",
  };
}

export default async function LoginPage() {
  const cookieStore = await cookies();
  return (
    <PlatformLocaleProvider initialLocale={parsePlatformLocale(cookieStore.get(PLATFORM_LOCALE_COOKIE)?.value)}>
      <PlatformAdminLoginPage />
    </PlatformLocaleProvider>
  );
}
