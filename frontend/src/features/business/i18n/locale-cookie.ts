import type { BusinessLocale } from "./messages";

export const BUSINESS_LOCALE_COOKIE = "business_dashboard_locale";

export function businessLocaleFromCookie(value: string | undefined): BusinessLocale {
  return value === "ar" || value === "en" ? value : "ckb";
}

export function readBusinessLocaleCookie(cookieHeader: string): BusinessLocale {
  const entry = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${BUSINESS_LOCALE_COOKIE}=`));
  return businessLocaleFromCookie(entry?.slice(BUSINESS_LOCALE_COOKIE.length + 1));
}

/** Host-only UI hint for sign-in and error pages before a member session exists. */
export function rememberBusinessLocale(locale: BusinessLocale): void {
  document.cookie = `${BUSINESS_LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
