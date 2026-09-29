import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LEGAL_TERMS_VERSION } from "@linktree/types";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import { RootLegalDocument } from "@/features/public-site/RootLegalDocument";
import { ROOT_PUBLIC_LOCALE_COOKIE, parseRootPublicLocale } from "@/features/public-site/root-public-locale";
import { termsCopy } from "@/features/public-site/legal-copy";

export async function generateMetadata(): Promise<Metadata> {
  const locale = parseRootPublicLocale((await cookies()).get(ROOT_PUBLIC_LOCALE_COOKIE)?.value);
  return { title: `${termsCopy[locale].title} | Sponsor.krd`, description: termsCopy[locale].title };
}

export default async function TermsPage() {
  const locale = parseRootPublicLocale((await cookies()).get(ROOT_PUBLIC_LOCALE_COOKIE)?.value);
  return <RootPublicLocaleProvider initialLocale={locale}><RootLegalDocument kind="terms" version={LEGAL_TERMS_VERSION} /></RootPublicLocaleProvider>;
}
