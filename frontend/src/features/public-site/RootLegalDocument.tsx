"use client";

import { LegalDocumentPage } from "@/components/shared/LegalDocumentPage";
import { RootPublicLanguageToggle, useRootPublicLocale } from "./RootPublicLocaleProvider";
import { termsCopy, privacyCopy } from "./legal-copy";
import { rootPublicCopy } from "./root-public-copy";

export function RootLegalDocument({ kind, version }: { kind: "terms" | "privacy"; version: string }) {
  const { locale } = useRootPublicLocale();
  const copy = kind === "terms" ? termsCopy[locale] : privacyCopy[locale];
  return <LegalDocumentPage
    title={copy.title}
    version={version}
    versionLabel={locale === "ar" ? "الإصدار" : locale === "en" ? "Version" : "وەشان"}
    sections={copy.sections}
    locale={locale}
    navbarCopy={rootPublicCopy[locale].navbar}
    languageControl={<RootPublicLanguageToggle compact />}
  />;
}
