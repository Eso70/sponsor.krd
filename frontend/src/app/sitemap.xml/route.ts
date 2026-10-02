import { publicRequestContext, fetchSitemapPages } from "@/lib/public/public-page.server";
import { sitemapXml, sitemapIndexXml } from "@/lib/public/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await publicRequestContext();
  const result = await fetchSitemapPages(0);
  const xml = result.totalPages > 1
    ? sitemapIndexXml(context.origin, result.totalPages)
    : sitemapXml(context.origin, result.pages, context.isPlatformRoot);
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-store" } });
}
