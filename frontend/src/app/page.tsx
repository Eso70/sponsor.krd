import { notFound } from "next/navigation";
import { PublicLinktreeContent } from "@/components/public/PublicLinktreeContent";
import { buildPageMetadata } from "@/lib/public/page-seo";
import { brandIcons } from "@/lib/brand/tab-branding";
import { cookies, headers } from "next/headers";
import { HomeLanding } from "@/components/home/HomeLanding";
import { PlatformOrganizationStructuredData } from "@/components/public/PlatformOrganizationStructuredData";
import { fetchBusinessHomepage, publicRequestContext } from "@/lib/public/public-page.server";
import { BusinessLanding } from "@/components/business/BusinessLanding";
import { SPONSOR_KRD_ACCENT_COLOR } from "@/lib/sponsor-krd-theme";
import { BusinessServiceUnavailablePage } from "@/components/error-pages/BusinessServiceUnavailablePage";
import { BusinessGatewayTimeoutPage } from "@/components/error-pages/BusinessGatewayTimeoutPage";
import { businessTabTitle } from "@/lib/utils/tab-title";
import { businessPublicCopy } from "@/features/business/i18n/public-copy";
import {
  BUSINESS_PUBLIC_LOCALE_COOKIE,
  publicBusinessLocale,
} from "@/features/business/i18n/public-locale";
import { businessErrorPageCopy } from "@/features/business/i18n/error-copy";
import {
  ROOT_PUBLIC_LOCALE_COOKIE,
  parseRootPublicLocale,
} from "@/features/public-site/root-public-locale";
import { rootPublicCopy } from "@/features/public-site/root-public-copy";
import {
  SPONSOR_KRD_APP_ICON,
} from "@/lib/brand/brand-assets";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost")
  .split(":")[0]
  .toLowerCase();

const ROOT_HOSTS = new Set([
  "localhost",
  "lvh.me",
  "127.0.0.1",
  ROOT_DOMAIN,
  `www.${ROOT_DOMAIN}`,
]);

async function isRootRequest(): Promise<boolean> {
  const headerStore = await headers();
  const hostname = (headerStore.get("host") || "").split(":")[0].toLowerCase();
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || ROOT_HOSTS.has(hostname);
}

export default async function Home() {
  if (await isRootRequest()) {
    const locale = parseRootPublicLocale(
      (await cookies()).get(ROOT_PUBLIC_LOCALE_COOKIE)?.value,
    );
    return (
      <>
        <PlatformOrganizationStructuredData />
        <HomeLanding initialLocale={locale} />
      </>
    );
  }

  const initialLocale = publicBusinessLocale(
    (await cookies()).get(BUSINESS_PUBLIC_LOCALE_COOKIE)?.value,
  );
  const result = await fetchBusinessHomepage();
  if (!result) notFound();
  if (result === "gateway-timeout") {
    return <BusinessGatewayTimeoutPage pageCopy={businessErrorPageCopy(initialLocale, "gatewayTimeout")} />;
  }
  if (result === "service-unavailable") {
    return <BusinessServiceUnavailablePage pageCopy={businessErrorPageCopy(initialLocale, "serviceUnavailable")} />;
  }
  if (result.linktree) {
    return <PublicLinktreeContent result={result.linktree} enableMarketingTracking={false} />;
  }
  return <BusinessLanding business={result.business} initialLocale={initialLocale} />;
}

export async function generateMetadata() {
  if (!(await isRootRequest())) {
    const result = await fetchBusinessHomepage();
    if (!result) notFound();
    if (typeof result === "string") return { title: "Unavailable", robots: { index: false, follow: false } };
    if (result.linktree) return buildPageMetadata(result.linktree.linktree, result.linktree.origin);
    const locale = publicBusinessLocale((await cookies()).get(BUSINESS_PUBLIC_LOCALE_COOKIE)?.value);
    return {
      title: businessTabTitle(result.business.name, businessPublicCopy[locale].footer.home),
      description: businessPublicCopy[locale].hero.description,
      icons: brandIcons(result.business.favicon, result.business.logo),
      robots: { index: false, follow: true },
    };
  }

  // Root domain only — a business subdomain returned above with its own icons.
  const rootLocale = parseRootPublicLocale(
    (await cookies()).get(ROOT_PUBLIC_LOCALE_COOKIE)?.value,
  );
  const context = await publicRequestContext();
  // Declared explicitly rather than left to the implicit `/favicon.ico` pickup,
  // so SponsorKrd's own mark is stated in the same place a tenant's is.
  return {
    title: "Sponsor.krd",
    alternates: { canonical: `${context.origin}/` },
    openGraph: {
      type: "website",
      title: "Sponsor.krd",
      description: rootPublicCopy[rootLocale].metadataDescription,
      locale: { en: "en_US", ckb: "ckb_IQ", ar: "ar_IQ" }[rootLocale],
      url: `${context.origin}/`,
      images: [
        {
          url: SPONSOR_KRD_APP_ICON,
          width: 512,
          height: 512,
          alt: "Sponsor.krd",
        },
      ],
    },
    twitter: { card: "summary", title: "Sponsor.krd", description: rootPublicCopy[rootLocale].metadataDescription, images: [SPONSOR_KRD_APP_ICON] },
    description: rootPublicCopy[rootLocale].metadataDescription,

    themeColor: SPONSOR_KRD_ACCENT_COLOR,
  };
}
