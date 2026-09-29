export type PlatformLocale = "ckb" | "ar" | "en";
export const PLATFORM_LOCALE_COOKIE = "platform_dashboard_locale";

export function parsePlatformLocale(value: string | undefined): PlatformLocale {
  return value === "ar" || value === "en" ? value : "ckb";
}

export function platformIntlLocale(locale: PlatformLocale): "ckb-IQ" | "ar-IQ" | "en-IQ" {
  return locale === "ar" ? "ar-IQ" : locale === "en" ? "en-IQ" : "ckb-IQ";
}
