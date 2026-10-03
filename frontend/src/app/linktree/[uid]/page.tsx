import { notFound, permanentRedirect } from "next/navigation";
import { headers } from "next/headers";
import { LinktreePage } from "@/components/public/LinktreePage";
import { TikTokPixelBaseCode } from "@/components/analytics/TikTokPixelBaseCode";
import { BusinessServiceUnavailablePage } from "@/components/error-pages/BusinessServiceUnavailablePage";
import { BusinessGatewayTimeoutPage } from "@/components/error-pages/BusinessGatewayTimeoutPage";
import { businessErrorPageCopy } from "@/features/business/i18n/error-copy";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import { RootPublicLinktreeError } from "@/features/public-site/RootErrorPage";
import { fetchPublicLinktree, publicRequestContext } from "@/lib/public/public-page.server";
import { buildPageMetadata, canonicalPageUrl, automaticPageSeo } from "@/lib/public/page-seo";
import { PublicPageStructuredData } from "@/components/public/PublicPageStructuredData";

export const dynamic = "force-dynamic";
interface PageProps { params: Promise<{ uid: string }> }

export default async function LinktreePublicPage({ params }: PageProps) {
  const { uid } = await params;
  const result = await fetchPublicLinktree(uid);
  if (!result) notFound();
  if (typeof result === "string") {
    const context = await publicRequestContext();
    if (context.isPlatformRoot) {
      return <RootPublicLocaleProvider initialLocale="ckb"><RootPublicLinktreeError
        kind={result === "gateway-timeout" ? "gatewayTimeout" : "serviceUnavailable"}
      /></RootPublicLocaleProvider>;
    }
    return result === "gateway-timeout"
      ? <BusinessGatewayTimeoutPage pageCopy={businessErrorPageCopy("ckb", "gatewayTimeout")} />
      : <BusinessServiceUnavailablePage pageCopy={businessErrorPageCopy("ckb", "serviceUnavailable")} />;
  }
  if (uid !== (result.linktree.seo_name || result.linktree.uid)) {
    permanentRedirect(canonicalPageUrl(result.linktree, result.origin));
  }
  const nonce = (await headers()).get("x-nonce") || "";
  return <>
    <PublicPageStructuredData page={result.linktree} origin={result.origin} nonce={nonce} />
    <TikTokPixelBaseCode pixelIds={result.analytics.pixelIds} nonce={nonce} />
    <LinktreePage linktree={result.linktree} links={result.links} analytics={result.analytics}
      enableMarketingTracking initialLocale={automaticPageSeo(result.linktree).locale} />
  </>;
}

export async function generateMetadata({ params }: PageProps) {
  const { uid } = await params;
  const result = await fetchPublicLinktree(uid);
  if (!result) notFound();
  if (typeof result === "string") return {
    title: "Unavailable", robots: { index: false, follow: false },
  };
  return buildPageMetadata(result.linktree, result.origin);
}
