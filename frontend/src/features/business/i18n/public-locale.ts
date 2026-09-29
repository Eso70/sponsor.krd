import type { BusinessLocale } from "./messages";

export const BUSINESS_PUBLIC_LOCALE_COOKIE = "business_public_locale";

export function publicBusinessLocale(value: string | undefined): BusinessLocale {
  return value === "ar" || value === "en" ? value : "ckb";
}

/** Visitor preference on this business host only; never used for authentication. */
export function rememberPublicBusinessLocale(locale: BusinessLocale): void {
  document.cookie = `${BUSINESS_PUBLIC_LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
