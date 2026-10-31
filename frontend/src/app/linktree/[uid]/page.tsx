import { PublicLinktreeContent } from "@/components/public/PublicLinktreeContent";
import { notFound, permanentRedirect } from "next/navigation";
import { BusinessServiceUnavailablePage } from "@/components/error-pages/BusinessServiceUnavailablePage";
import { BusinessGatewayTimeoutPage } from "@/components/error-pages/BusinessGatewayTimeoutPage";
import { businessErrorPageCopy } from "@/features/business/i18n/error-copy";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import { RootPublicLinktreeError } from "@/features/public-site/RootErrorPage";
import {
  fetchPublicLinktree,
  publicRequestContext,
} from "@/lib/public/public-page.server";
import {
  buildPageMetadata,
  canonicalPageUrl,
} from "@/lib/public/page-seo";

export const dynamic = "force-dynamic";
interface PageProps {
  params: Promise<{ uid: string }>;
}

export default async function LinktreePublicPage({ params }: PageProps) {
  const { uid } = await params;
  const result = await fetchPublicLinktree(uid);
  if (!result) notFound();
  if (typeof result === "string") {
    const context = await publicRequestContext();
    if (context.isPlatformRoot) {
      return (
        <RootPublicLocaleProvider initialLocale="ckb">
          <RootPublicLinktreeError
            kind={
              result === "gateway-timeout"
                ? "gatewayTimeout"
                : "serviceUnavailable"
            }
          />
        </RootPublicLocaleProvider>
      );
    }
    return result === "gateway-timeout" ? (
      <BusinessGatewayTimeoutPage
        pageCopy={businessErrorPageCopy("ckb", "gatewayTimeout")}
      />
    ) : (
      <BusinessServiceUnavailablePage
        pageCopy={businessErrorPageCopy("ckb", "serviceUnavailable")}
      />
    );
  }
  if (uid !== (result.linktree.seo_name || result.linktree.uid)) {
    permanentRedirect(canonicalPageUrl(result.linktree, result.origin));
  }
  return <PublicLinktreeContent result={result} enableMarketingTracking />;
}

export async function generateMetadata({ params }: PageProps) {
  const { uid } = await params;
  const result = await fetchPublicLinktree(uid);
  if (!result) notFound();
  if (typeof result === "string")
    return {
      title: "Unavailable",
      robots: { index: false, follow: false },
    };
  return buildPageMetadata(result.linktree, result.origin);
}
