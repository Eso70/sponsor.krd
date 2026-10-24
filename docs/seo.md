# Public-page SEO and crawler operations

## Architecture and indexing policy

Next.js serves public Linktrees with the existing shared templates and
server-fetched content. `lib/public/public-page.server.ts` deduplicates reads
within a request, never across owners. `PublicService` enforces owner, active
business, page state and archive boundaries; cache hits recheck live state.
A small public availability lookup runs before streaming, providing real 404
and 503 responses and permanent identifier redirects. It intentionally adds a
bounded database lookup to preserve HTTP correctness.

Public cache keys are shared by page edits, destination edits and approved page
mutations. Approved updates/deletions purge old/current identifiers only after
the database transaction commits. Both business and root-page namespaces are
cleared, including owners without a subdomain. Failures are logged.

Only configured root and single-label tenant domains are accepted. External
forwarded-host/subdomain claims do not determine public ownership. Internal
subdomain headers require the existing proxy secret. Verified custom domains use
the existing registry and selected-host policy; unknown domains fail closed.
The unselected business hostname returns 404 rather than duplicate content. Canonicals use
the configured root/app protocol and port, never an arbitrary incoming host.
`www` redirects to root and identifier aliases redirect to the page's slug.

Search and sharing default to automatic behavior. Both dashboards reuse the
Linktree drawer's optional Search & page details section. `automaticPageSeo`
uses explicit versioned SEO settings first, then bounded titles from the page name and
descriptions from distinct, meaningful subtitle/description text. It normalizes
whitespace, excludes generic contact prompts, and shortens long text at word
boundaries where possible. Sharing previews and generated images use the same
content resolver. No external AI service or fabricated business information is
used.

Indexing requires a page name plus a meaningful subtitle/description or a
recognized, visible category other than Other. An explicit versioned noindex
choice vetoes eligibility, without changing public availability.
Starter prompts alone never qualify, including when used as a subtitle. The
same rule governs public robots metadata and backend sitemap SQL; publication,
archive, and tenant ownership checks still gate public access. Public pages
allow following links automatically. This is a technical eligibility policy,
not a ranking score or an indexing guarantee.

Retired unversioned `template_config.seo` overrides remain ignored and removed
by backend normalization. New settings use `{version: 1}` and are sanitized by
`packages/types/linktree-seo.cjs` on reads, validated on protected writes, and
stored inside the existing JSONB configuration. No database rewrite or migration
is required. Deploy frontend and backend together. Existing pages are not
automatically assigned categories or business facts.

The shared catalog has 16 stable category IDs and optional compatible business
types, with English, Kurdish and Arabic labels. Category selection appears after
Headline. Optional details use the existing editor controls; menu, booking,
website and contact destinations remain ordinary existing Links. One opening
hours schedule may cover multiple selected weekdays; split schedules are not
represented. Social preview images use the existing upload/crop pipeline and
must belong to the page's business, including approval-executed edits. Canonical
hostnames are never editable SEO fields.
Authored business details remain editable after changing/clearing a category;
changing classification does not silently erase content or hide an incomplete
schedule. Time values must be actual HH:mm strings, never coerced arrays/numbers.

HTML, Open Graph, structured data, and renderer language use the same content
preference when explicitly selected, otherwise content inference: dominant Latin text is English, Arabic-script text containing Sorani
markers is Kurdish, and other Arabic-script text is Arabic. Text without a
recognized writing system defaults to Kurdish. This is a deterministic
heuristic; very short, ambiguous or mixed-language content may be classified
imperfectly. Saved content is preserved; no translated names or fabricated
hreflang alternates are emitted.

Public pages output full metadata and safe WebPage JSON-LD describing visible
content. Categorized pages add Organization/Person mainEntity; personal profiles
use ProfilePage. Other/custom categories stay WebPage without an assumed entity.
LocalBusiness subtypes require both supplied street and city.
Optional address, opening hours, cuisine, telephone and social URLs are emitted
only from actual supplied data. Category/details render visibly in every template.
No rating or geographic claim is invented. Sponsor.krd Organization data belongs only to root homepage.
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
  returned image for five minutes by its full host/path URL. Generated image
  metadata includes a page revision query to refresh previews after edits.
  Long titles use a smaller font. Rendering completes before response headers;
  font/renderer failures are logged and return a noncached 503 instead of an
  interrupted image stream. Failed font loads can retry. Custom social images
  retain their real dimensions rather than declaring generated PNG dimensions.
- The generated `public/fonts/KurdishFont-share.ttf` retains Rabar glyphs,
  metadata, and shaping rules with extension lookups flattened for the image
  renderer. `scripts/prepare-share-font.py` reproduces it with FontTools;
  ordinary browser fonts are unchanged. Runtime servers need no Python.
  ShareImageText keeps Latin runs intact and lays out Arabic words in reading
  order for the bundled renderer. This artwork workaround is not a full Unicode
  bidi implementation; explicit page language and browser direction remain native.
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
For an isolated production build use `SEO_VERIFY=1` with the frontend build;
output goes to `.next/seo-verify`. Backend verification uses
`tsc -p tsconfig.build.json --outDir dist-seo-verify --incremental false`.
`tsconfig.seo-verify.json` checks frontend sources without mutable dev-generated
route files. These directories are disposable verification output, not deployment artifacts.

The HTTP suite verifies two tenants with identical slugs, crawler/ordinary user
agents, raw HTML identity/H1/metadata/JSON-LD, real anchors, robots, sitemaps,
share images, automatic noindex for starter content, ignored legacy overrides,
identifier/www redirects, hostile hosts,
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

The initial HTML language matches the inferred public-page language or public
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

## Public forms

Public `/form/<slug>` pages now permit indexing when the live form has an
introduction headline and a meaningful description. Empty descriptions and the
shared starter prompts are excluded. This is the same content normalization
used by Linktrees, not a guarantee of search quality or indexing. Paused forms
and inactive owners return 404 through the existing availability gate. Archive
is a dashboard collection flag: an archived active form remains public and can
remain indexable, matching its existing availability semantics.

The existing owner-scoped sitemap now unions Linktrees and forms before counting
and paginating. An optional `pageType` field identifies form URLs; older entries
without it remain Linktrees. Root forms are scoped to the internal platform
workspace; tenant forms are scoped to the resolved active business. Submissions,
answers and tracking identifiers never enter sitemap or metadata projections.
Canonical URLs exclude campaign parameters and derive from the configured,
validated public origin. Metadata uses the visible introduction, saved language,
and enabled banner/logo for Open Graph and Twitter sharing. Document language
uses the same request-memoized form fetch as page content and metadata.

Saved raster images use Next's responsive image optimization; temporary data-URL
editor images remain unoptimized. Public introduction banners and card backdrops
load eagerly with high fetch priority. Other media stays lazy. The fullscreen
image viewer loads on demand in a separate client bundle. Live form content
remains uncached across requests to preserve immediate availability/revision
checks; static immutable assets retain their existing cache policy.

Deploy frontend and backend together; no database migration is needed. The SEO
HTTP smoke includes both form layouts, root and two tenant hosts, noindex starter
forms, canonical URLs, document language, sharing metadata and real 404s.
See [public form research and performance plan](public-form-seo-performance.md).

New forms default to Kurdish, dark appearance and red (`#ef4444`); saved
form appearance remains unchanged. Shared Form/Card privacy checkboxes start
checked and can be unchecked; required consent still blocks submission when
unchecked. Privacy help is rendered in a viewport-positioned portal so scrolling
containers cannot clip the explanation or policy links. Browser tab titles use
the form name; tab icons use the uploaded introduction logo, then the current
owner's public business logo, then the shared placeholder. Shared list dropdowns
use compact neutral selection/hover states with reduced-motion support.

## Max plan and basic SEO

Linktree Search & page details, classification, custom metadata, social images,
manual language and business details are Max-only. The Business drawer reads
its live subscription manifest; the internal Platform workspace retains advanced
controls. Protected create/update operations check the active subscription window
server-side before accepting changed versioned SEO, including execution of previously approved field changes. An unchanged or omitted SEO
object does not prevent ordinary page edits or erase saved settings.

All plans retain automatic titles/descriptions, canonical URLs, ordinary sharing
images, content-derived language, basic WebPage metadata and content-based sitemap
eligibility. Public business reads apply live plan access after reading the cached
source body, so expiry/downgrade disables customizations immediately and upgrading
restores them. Stored advanced data is never deleted on plan changes. A saved
noindex exclusion remains respected on every plan. Sitemap category-based
eligibility requires live Max access and matches the effective public metadata.
No schema migration or destructive data rewrite is required.

Sitemap eligibility SQL uses the current persisted Linktree headline/slogan columns, while API projections keep their existing name/subtitle compatibility aliases.

The profile header shows the business category and location as compact icon facts.
Extended business facts (services, cuisine, service area and opening hours) are
available in a native Business details disclosure below the primary contact links.
It is collapsed initially to prioritize destinations, with ordinary details/summary
interaction and the same factual content available to users and crawlers.

Browser tab/title and favicon routing follow the complete [tab branding audit](tab-branding.md). Public titles stay content-led, private routes use localized section-first owner titles, and icon generation never fetches arbitrary remote images.
