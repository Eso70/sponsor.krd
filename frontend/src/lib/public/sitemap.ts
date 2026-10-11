import type { PublicSitemapPage } from "@linktree/types";

export function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function sitemapXml(origin: string, pages: PublicSitemapPage[], includeHome: boolean): string {
  const home = includeHome ? ["/", "/legal/privacy", "/legal/terms"].map(path =>
    `<url><loc>${escapeXml(`${origin}${path}`)}</loc></url>`).join("") : "";
  const entries = pages.map(page => {
    const date = new Date(page.updatedAt);
    const lastmod = Number.isNaN(date.getTime()) ? "" : `<lastmod>${date.toISOString()}</lastmod>`;
    return `<url><loc>${escapeXml(`${origin}/${page.pageType === "form" ? "form" : "linktree"}/${encodeURIComponent(page.slug)}`)}</loc>${lastmod}</url>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${home}${entries}</urlset>`;
}

export function sitemapIndexXml(origin: string, totalPages: number): string {
  if (!Number.isSafeInteger(totalPages) || totalPages < 1 || totalPages > 50_000) {
    throw new RangeError("Sitemap index exceeds the supported protocol limit");
  }
  const entries = Array.from({ length: totalPages }, (_, page) =>
    `<sitemap><loc>${escapeXml(`${origin}/sitemaps/${page}.xml`)}</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}
