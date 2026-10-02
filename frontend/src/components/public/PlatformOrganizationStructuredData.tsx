import { headers } from "next/headers";
import { publicRequestContext } from "@/lib/public/public-page.server";
import { serializeJsonLd } from "@/lib/public/page-seo";
import { SPONSOR_KRD_APP_ICON } from "@/lib/brand/brand-assets";

export async function PlatformOrganizationStructuredData() {
  const context = await publicRequestContext();
  if (!context.isPlatformRoot) return null;
  return <script type="application/ld+json" nonce={(await headers()).get("x-nonce") || ""}
    dangerouslySetInnerHTML={{ __html: serializeJsonLd({
      "@context": "https://schema.org", "@type": "Organization", name: "Sponsor.krd",
      url: `${context.origin}/`, logo: new URL(SPONSOR_KRD_APP_ICON, context.origin).href,
    }) }} />;
}
