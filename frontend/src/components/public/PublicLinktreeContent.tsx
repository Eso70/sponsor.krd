import { headers } from "next/headers";
import type { PublicLinktreePayload } from "@linktree/types";
import { LinktreePage } from "./LinktreePage";
import { PublicPageStructuredData } from "./PublicPageStructuredData";
import { TikTokPixelBaseCode } from "@/components/analytics/TikTokPixelBaseCode";
import { PublicImageDimensionsProvider } from "@/components/shared/PublicImageDimensionsProvider";
import { automaticPageSeo } from "@/lib/public/page-seo";

/** Both URLs render the same page; only allowlisted Linktree routes load ads tracking. */
export async function PublicLinktreeContent({
  result,
  enableMarketingTracking,
}: {
  result: PublicLinktreePayload & { origin: string };
  enableMarketingTracking: boolean;
}) {
  const nonce = (await headers()).get("x-nonce") || "";
  return (
    <>
      <PublicPageStructuredData page={result.linktree} origin={result.origin} nonce={nonce} links={result.links} />
      {enableMarketingTracking && <TikTokPixelBaseCode pixelIds={result.analytics.pixelIds} nonce={nonce} />}
      <PublicImageDimensionsProvider dimensions={result.imageDimensions}>
        <LinktreePage
          linktree={result.linktree}
          links={result.links}
          analytics={enableMarketingTracking ? result.analytics : { pixelIds: [], actions: {} }}
          enableMarketingTracking={enableMarketingTracking}
          initialLocale={automaticPageSeo(result.linktree).locale}
        />
      </PublicImageDimensionsProvider>
    </>
  );
}
