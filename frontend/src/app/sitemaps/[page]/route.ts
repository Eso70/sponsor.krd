import { publicRequestContext, fetchSitemapPages } from "@/lib/public/public-page.server";
import { sitemapXml } from "@/lib/public/sitemap";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!/^(0|[1-9]\d{0,5})\.xml$/.test(page)) notFound();
  const pageNumber = Number(page.slice(0, -4));
  const context = await publicRequestContext();
  const result = await fetchSitemapPages(pageNumber);
  return new Response(sitemapXml(context.origin, result.pages, context.isPlatformRoot && pageNumber === 0), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-store" },
  });
}
