export type RootPublicLocale = "ckb" | "ar" | "en";

export const ROOT_PUBLIC_LOCALE_COOKIE = "sponsor_public_locale";

export function parseRootPublicLocale(value: string | undefined): RootPublicLocale {
  return value === "ar" || value === "en" ? value : "ckb";
}

/** Visitor preference on the root host; separate from administrator settings. */
export function rememberRootPublicLocale(locale: RootPublicLocale): void {
  document.cookie = `${ROOT_PUBLIC_LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
