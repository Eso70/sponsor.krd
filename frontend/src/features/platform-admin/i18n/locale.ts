export type PlatformLocale = "ckb" | "ar" | "en";
export const PLATFORM_LOCALE_COOKIE = "platform_dashboard_locale";

export function parsePlatformLocale(value: string | undefined): PlatformLocale {
  return value === "ar" || value === "en" ? value : "ckb";
}

export function platformIntlLocale(
  locale: PlatformLocale,
): "ckb-IQ" | "ar-IQ" | "en-IQ" {
  return locale === "ar" ? "ar-IQ" : locale === "en" ? "en-IQ" : "ckb-IQ";
}

/** Host-only preference, also available before authentication. */
export function rememberPlatformLocale(locale: PlatformLocale): void {
  document.cookie = `${PLATFORM_LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
