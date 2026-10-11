import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LEGAL_PRIVACY_VERSION } from "@linktree/types";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import { RootLegalDocument } from "@/features/public-site/RootLegalDocument";
import {
  ROOT_PUBLIC_LOCALE_COOKIE,
  resolveRootLegalLocale,
} from "@/features/public-site/root-public-locale";
import { privacyCopy } from "@/features/public-site/legal-copy";
import { publicRequestContext } from "@/lib/public/public-page.server";
import { getAppBaseUrl } from "@/lib/utils/app-url";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const locale = resolveRootLegalLocale(
    (await searchParams).lang,
    (await cookies()).get(ROOT_PUBLIC_LOCALE_COOKIE)?.value,
  );
  const context = await publicRequestContext();
  return {
    title: `${privacyCopy[locale].title} | Sponsor.krd`,
    description: privacyCopy[locale].title,
    alternates: { canonical: new URL("/legal/privacy", getAppBaseUrl()).href },
    robots: { index: context.isPlatformRoot, follow: true },
  };
}

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const locale = resolveRootLegalLocale(
    (await searchParams).lang,
    (await cookies()).get(ROOT_PUBLIC_LOCALE_COOKIE)?.value,
  );
  return (
    <RootPublicLocaleProvider initialLocale={locale}>
      <RootLegalDocument kind="privacy" version={LEGAL_PRIVACY_VERSION} />
    </RootPublicLocaleProvider>
  );
}
