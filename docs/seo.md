# Public-page SEO and crawler operations

## Architecture and indexing policy

Next.js serves public Linktrees with the existing shared templates and
server-fetched content. `lib/public/public-page.server.ts` deduplicates reads
within a request, never across owners. `PublicService` enforces owner, active
business, page state and archive boundaries; cache hits recheck live state.
A small public availability lookup runs before streaming, providing real 404
and 503 responses and permanent identifier redirects. It intentionally adds a
bounded database lookup to preserve HTTP correctness.

Only configured root and single-label tenant domains are accepted. External
forwarded-host/subdomain claims do not determine public ownership. Internal
subdomain headers require the existing proxy secret. Unknown/custom domains
fail closed until a verified-domain registry is implemented. Canonicals use
the configured root/app protocol and port, never an arbitrary incoming host.
`www` redirects to root and identifier aliases redirect to the page's slug.

`template_config.seo` stores bounded title, description, sharing-title,
sharing-description, indexing/following flags and an optional content locale.
Both dashboard surfaces use `PageSeoFields` and `PageSeoDiagnostics` through
the existing shared editor. No duplicate business fields or database migration
are required. Canonical overrides and arbitrary structured-data input are not
accepted. Empty metadata fields fall back to actual page information.

The default indexing policy requires a business name and a subtitle or
description beyond the standard contact prompt in Kurdish/Arabic/English.
An owner may explicitly choose index or noindex, including temporary campaign
pages. This is a conservative technical policy, not a search ranking score.
SEO descriptions alone do not make a thin public page useful: add real visible
business information. Content language is preserved; no fabricated hreflang
or translated business names are emitted.

Public pages output full metadata and safe WebPage JSON-LD describing visible
content. No local-business subtype, address, opening hours, rating or geographic
claim is invented. Sponsor.krd Organization data belongs only to root homepage.
JSON-LD escapes script terminators and uses the existing CSP nonce.

## Discovery and sharing

The internal sitemap API uses `chunk=0` for its first chunk. Ordinary `page`
queries remain one-based under the global request-boundary validator.

- `/robots.txt` declares the current host's sitemap. It blocks API crawling,
  but keeps noindex/authentication URLs crawlable so exclusion can be observed.
  Authentication/authorization remains the privacy boundary.
- `/sitemap.xml` is derived from active, nonarchived, indexable owner-scoped
  database rows. Root also includes its public homepage and legal documents. Tenant login/landing
  and dashboard routes are not included.
- Larger sites receive a sitemap index pointing to `/sitemaps/0.xml`, etc.
  Each deterministic chunk contains at most 1,000 pages. XML values are escaped
  and lastmod uses actual page/link and branding updates. Link mutations refresh
  the parent page timestamp, including deletions, and clear both business and
  platform public caches. Sitemap indexes fail closed above the protocol's
  50,000-entry limit. Responses are not globally cached.
- `/linktree/<slug>/share-image` produces a 1200×630 PNG from actual page name
  and subtitle. It performs no arbitrary remote image fetches and caches the
  returned image for five minutes by its full host/path URL.
- The generated `public/fonts/KurdishFont-share.ttf` retains Rabar glyphs,
  metadata, and shaping rules with extension lookups flattened for the image
  renderer. `scripts/prepare-share-font.py` reproduces it with FontTools;
  ordinary browser fonts are unchanged. Runtime servers need no Python.
- Template destination links and footer links are actual anchors. Normal
  clicks preserve tracking and WhatsApp dialogs; modifier clicks and navigation
  without JavaScript retain the destination. Images retain dimensions/alt text.

Next metadata is completed before streaming to preserve status codes and
share-crawler headers. This trades metadata latency for correct initial HTML;
request-scoped memoization prevents duplicate content reads.

## Tracking

The existing first-party ledger, visitor identity, attribution storage, shared
browser/server event IDs, consent rules, registered actions, owner-scoped Pixel
groups and retrying outbox remain authoritative. No second event engine or
global Pixel was introduced. Existing shared delivery diagnostics cover browser
silence, server attempts, successful/failed delivery, and retries. See
[tracking.md](tracking.md). TikTok placement is still restricted to eligible
published public Linktrees.

## Local verification

Run `node frontend/scripts/seo-smoke.mjs` from the repository root. It starts a
disposable fixture API and a separate Next dev preview on ports 4313/4312,
uses `.next/seo-smoke` output, and stops only its own processes. The owner's
normal development server and database are untouched.

The HTTP suite verifies two tenants with identical slugs, crawler/ordinary user
agents, raw HTML identity/H1/metadata/JSON-LD, real anchors, robots, sitemaps,
share images, explicit noindex, identifier/www redirects, hostile hosts,
unpublished/missing pages, and unavailable upstreams. Unit tests separately
cover backend SQL ownership/publication/indexing and cache safeguards.

## Deployment and production acceptance

1. Deploy frontend/backend together and rebuild. Include the share-image font.
2. Verify `ROOT_DOMAIN`, `NEXT_PUBLIC_ROOT_DOMAIN`, `APP_BASE_URL`, and
   `NEXT_PUBLIC_APP_URL` agree with public HTTPS/DNS. Keep the internal proxy
   secret synchronized and private. Caddy must retain Host and strip external
   tenant headers. Cache keys on any future CDN must include hostname and path.
3. Check representative permanent business pages and campaigns from at least
   two tenants. Run `node frontend/scripts/seo-production-audit.mjs <url-a>
   <url-b>` for a read-only Googlebot/raw-HTML audit. Inspect each relevant
   sitemap chunk when the root response is a sitemap index. Check share images
   visually and confirm actual business information is correct.
4. Inspect real Cloudflare/WAF/rate-limit configuration. Do not exempt callers
   based solely on a spoofable Googlebot user agent or disable protections.
5. In the owner's Search Console account, verify the appropriate domain
   property, submit sitemaps, inspect representative URLs/live HTML, request
   indexing where appropriate, and monitor crawl/indexing errors.

The initial HTML language matches the stored public-page language or public
site preference. Legal documents declare root-host canonicals; tenant copies
are noindex. Malformed public identifiers return 404 before streaming.
Direct Caddy API responses carry noindex headers as well as the Next proxy.

Local tests do not prove live DNS/CDN settings or Search Console acceptance.
Publishing and Search Console changes require deployment/account access.

See [the follow-up audit](seo-audit-2026-10-03.md) for fixes and the remaining
production acceptance boundaries.

## Official references

- [Next metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next robots](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Next sitemaps](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Google robots guidance](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
