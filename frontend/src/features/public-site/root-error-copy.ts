import { businessErrorPageCopy } from "@/features/business/i18n/error-copy";
import type { RootPublicLocale } from "./root-public-locale";
import { rootPublicCopy } from "./root-public-copy";

type RootErrorKind = Parameters<typeof businessErrorPageCopy>[1];

/** Reuse shared error wording; root navigation and footer remain root-owned. */
export function rootErrorPageCopy(locale: RootPublicLocale, kind: RootErrorKind) {
  const base = businessErrorPageCopy(locale, kind);
  return { ...base, copy: { ...base.copy, navbar: rootPublicCopy[locale].navbar } };
}
