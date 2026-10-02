/** Read-only HTTPS crawler audit. Pass at least two public tenant page URLs. */
const pages = process.argv.slice(2);
if (pages.length < 2) throw new Error("Pass public HTTPS Linktree URLs from at least two tenants");
const origins = new Set(pages.map(value => new URL(value).origin));
if (origins.size < 2) throw new Error("Use two different tenant origins");
let failures = 0;
for (const value of pages) {
  const page = new URL(value);
  if (page.protocol !== "https:" || page.username || page.password || !/^\/linktree\/[a-z0-9-]+$/.test(page.pathname)) {
    throw new Error("Expected an HTTPS public Linktree URL without credentials");
  }
  const findings = [];
  for (const pathname of ["/robots.txt", "/sitemap.xml", page.pathname]) {
    try {
      const response = await fetch(new URL(pathname, page.origin), {
        headers: { "User-Agent": "Googlebot" }, signal: AbortSignal.timeout(15_000),
      });
      findings.push(`${pathname}: HTTP ${response.status}`);
      if (response.status !== 200) { failures++; continue; }
      const text = await response.text();
      const checks = pathname === "/robots.txt"
        ? [["host-aware sitemap declaration", text.includes(`${page.origin}/sitemap.xml`)]]
        : pathname === "/sitemap.xml"
          ? [["sitemap XML", /<urlset|<sitemapindex/.test(text)]]
          : [
            ["server-rendered H1", /<h1[\s>]/.test(text)],
            ["title", /<title>[^<]+<\/title>/.test(text)],
            ["description", /name="description"/.test(text)],
            ["canonical", /rel="canonical"/.test(text) && text.includes(`${page.origin}${page.pathname}`)],
            ["Open Graph", /property="og:title"/.test(text) && /property="og:image"/.test(text)],
            ["JSON-LD", /application\/ld\+json/.test(text)],
            ["crawlable anchors", /<a[^>]+href=/.test(text)],
          ];
      for (const [name, ok] of checks) {
        findings.push(`${name}: ${ok ? "PASS" : "FAIL"}`);
        if (!ok) failures++;
      }
    } catch (error) {
      findings.push(`${pathname}: request failed (${error instanceof Error ? error.name : "Error"})`); failures++;
    }
  }
  console.log(page.href, findings.join("; "));
}
process.exitCode = failures ? 1 : 0;
