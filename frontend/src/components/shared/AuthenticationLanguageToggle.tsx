"use client";
import {
  LanguageToggle,
  nextLanguageLocale,
  type LanguageToggleLocale,
} from "./LanguageToggle";
import { rememberBusinessLocale } from "@/features/business/i18n/locale-cookie";
import { rememberRootPublicLocale } from "@/features/public-site/root-public-locale";
import { rememberPlatformLocale } from "@/features/platform-admin/i18n/locale";
import {
  authenticationHeaderCopy,
  type AuthenticationLocalePreference,
} from "./authentication-header-copy";

/** Server-localized loading/error screens retain a working locale control. */
export function AuthenticationLanguageToggle({
  locale,
  preference,
}: {
  locale: LanguageToggleLocale;
  preference: AuthenticationLocalePreference;
}) {
  return (
    <LanguageToggle
      locale={locale}
      label={authenticationHeaderCopy[locale].language}
      onClick={() => {
        const next = nextLanguageLocale(locale);
        if (preference === "business") rememberBusinessLocale(next);
        else if (preference === "platform") rememberPlatformLocale(next);
        else rememberRootPublicLocale(next);
        const url = new URL(window.location.href);
        if (url.pathname.startsWith("/analytics-share/")) {
          url.searchParams.set("lang", next);
          window.location.assign(url.href);
        } else window.location.reload();
      }}
    />
  );
}
