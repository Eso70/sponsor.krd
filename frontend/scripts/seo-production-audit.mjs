/** Read-only HTTPS crawler audit. Pass at least two public tenant page URLs. */
const pages = process.argv.slice(2);
if (pages.length < 2) throw new Error("Pass public HTTPS Linktree URLs from at least two tenants");
const origins = new Set(pages.map(value => new URL(value).origin));
if (origins.size < 2) throw new Error("Use two different tenant origins");
let failures = 0;
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1]?.replace(/&amp;/g, "&");
const meta = (html, property) => [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => match[0]).find(tag => attribute(tag, 'property') === property || attribute(tag, 'name') === property);
for (const value of pages) {
  const page = new URL(value);
  if (page.protocol !== "https:" || page.username || page.password || !/^\/linktree\/[a-z0-9-]+$/.test(page.pathname)) {
    throw new Error("Expected an HTTPS public Linktree URL without credentials");
  }
  const findings = [];
  for (const pathname of ["/robots.txt", "/sitemap.xml", page.pathname]) {
    try {
      const started = performance.now();
      const response = await fetch(new URL(pathname, page.origin), {
        headers: { "User-Agent": "Googlebot" }, signal: AbortSignal.timeout(15_000),
      });
      findings.push(`${pathname}: HTTP ${response.status}, response headers ${Math.round(performance.now() - started)}ms`);
      if (response.status !== 200) { failures++; continue; }
      const text = await response.text();
      findings.push(`${pathname}: ${Buffer.byteLength(text)} HTML/XML bytes, complete ${Math.round(performance.now() - started)}ms`);
      const canonicalTags = [...text.matchAll(/<link\b[^>]*>/gi)].map(match => match[0]).filter(tag => attribute(tag, 'rel') === 'canonical');
      const checks = pathname === "/robots.txt"
        ? [["host-aware sitemap declaration", text.includes(`${page.origin}/sitemap.xml`)]]
        : pathname === "/sitemap.xml"
          ? [["sitemap XML", /<urlset|<sitemapindex/.test(text)]]
          : [
            ["server-rendered H1", /<h1[\s>]/.test(text)],
            ["title", /<title>[^<]+<\/title>/.test(text)],
            ["description", /name="description"/.test(text)],
            ["canonical", canonicalTags.length === 1 && attribute(canonicalTags[0], 'href') === `${page.origin}${page.pathname}`],
            ["Open Graph", /property="og:title"/.test(text) && /property="og:image"/.test(text)],
            ["JSON-LD", /application\/ld\+json/.test(text)],
            ["crawlable anchors", /<a[^>]+href=/.test(text)],
          ];
      for (const [name, ok] of checks) {
        findings.push(`${name}: ${ok ? "PASS" : "FAIL"}`);
        if (!ok) failures++;
      }
      if (pathname === page.pathname) {
        const imageValue = attribute(meta(text, 'og:image') || '', 'content');
        const imageUrl = imageValue ? new URL(imageValue, page.origin) : null;
        if (!imageUrl || imageUrl.origin !== page.origin || imageUrl.username || imageUrl.password) {
          findings.push('owner-origin social image: FAIL'); failures++;
        } else {
          const imageStarted = performance.now();
          const image = await fetch(imageUrl, { headers: { 'User-Agent': 'Googlebot' }, signal: AbortSignal.timeout(15_000) });
          const bytes = Buffer.from(await image.arrayBuffer());
          findings.push(`social image: HTTP ${image.status}, ${image.headers.get('content-type')}, ${bytes.length} bytes, ${Math.round(performance.now() - imageStarted)}ms`);
          const generated = imageUrl.pathname.endsWith('/share-image');
          const png = bytes.length >= 24 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
          const valid = image.status === 200 && /^image\//i.test(image.headers.get('content-type') || '') && (!generated || (png && bytes.readUInt32BE(16) === 1200 && bytes.readUInt32BE(20) === 630));
          findings.push(`valid social image${generated ? ' PNG 1200x630' : ''}: ${valid ? 'PASS' : 'FAIL'}`);
          if (!valid) failures++;
        }
      }
    } catch (error) {
      findings.push(`${pathname}: request failed (${error instanceof Error ? error.name : "Error"})`); failures++;
    }
  }
  console.log(page.href, findings.join("; "));
}
process.exitCode = failures ? 1 : 0;
