import { publicRequestContext, fetchSitemapPages } from "@/lib/public/public-page.server";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await publicRequestContext();
  await fetchSitemapPages(0);
  // Authentication/noindex pages remain crawlable so the exclusion is visible.
  return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${context.origin}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
