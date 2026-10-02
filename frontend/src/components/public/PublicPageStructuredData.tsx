import type { PublicLinktree } from "@linktree/types";
import { buildPageJsonLd, serializeJsonLd } from "@/lib/public/page-seo";

export function PublicPageStructuredData({ page, origin, nonce }: {
  page: PublicLinktree; origin: string; nonce: string;
}) {
  return <script type="application/ld+json" nonce={nonce}
    dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildPageJsonLd(page, origin)) }} />;
}
