# SEO and crawler implementation plan

## Discovery map

- Frontend: Next.js 16 App Router and React 19. Public pages use
  `src/app/linktree/[uid]/page.tsx`, with server fetching and shared client
  templates rendered on the server. `src/proxy.ts` gates private routes.
- Backend: `PublicService` owns public Linktree reads. Tenant pages resolve
  through business subdomains; root pages resolve through `root_public_slugs`
  and the internal platform workspace. PostgreSQL holds content and Redis
  caches it under tenant-specific keys.
- Existing SEO: page title, description, icons, and partial Open Graph exist.
  Canonicals, host-aware robots/sitemaps, and structured data need completing.
- Tracking: `page-tracking.ts`, `PublicPageAnalyticsService`, the internal
  ledger and TikTok outbox already implement owner-scoped configuration,
  shared event IDs, durable delivery, attribution, and diagnostics. Extend
  these seams; do not introduce a second event pipeline or broaden placement.
- Infrastructure: Caddy preserves Host, terminates wildcard TLS, and proxies
  API requests to Nest. Custom domains have no verified-domain model yet;
  unknown domains must fail closed instead of pretending to support them.

## Delivery phases

1. Validate host boundaries and live publication/owner state, including cache
   hits; prove isolation with two tenants and identical slugs.
2. Add bounded page SEO configuration inside existing `template_config`,
   avoiding duplicate business fields or a new database model. Share the
   editor controls and diagnostics across business/platform entry points.
3. Centralize request-scoped public reads, canonical URL construction,
   metadata, and safe JSON-LD. Keep meaningful content server-rendered.
4. Add host-aware robots and database-derived, paginated sitemap routes.
   Include only active, nonarchived, intentionally indexable public pages.
   Authentication routes remain crawlable so crawlers can observe noindex.
5. Make shared template navigation crawlable without JavaScript, preserving
   tracking, WhatsApp dialogs, keyboard and modifier-click behavior.
6. Generate business-specific share images, preserve real content/language,
   and verify public pages do not import dashboard bundles.
7. Verify the existing tracking pipeline and diagnostics, raw HTML, status,
   host canonicalization, unavailable/unpublished pages, and crawler agents.
8. Run lint/types/tests/builds, document deployment and Search Console steps,
   and run read-only production checks where live access permits.

## Acceptance boundaries

No Git mutations or production database writes. No invented business facts,
reviews, locations, alternate languages, custom-domain verification, or Pixel
destinations. SEO settings do not override the hostname-derived canonical.
Live deployment, Search Console property verification/submission, and private
infrastructure settings require the owner's deployment/account access;
report their verification separately from local implementation.

## Delivery record

- Local implementation includes the validated host/publication gates, shared
  SEO controls and content checks, canonical metadata/redirects, safe JSON-LD,
  host-aware paginated sitemap/robots routes, progressive anchors, and generated
  share images. Existing tracking and delivery diagnostics are reused.
- The isolated HTTP suite passed across two owners with identical slugs,
  including raw HTML, Kurdish share images at 1200×630, and 404/503/308 behavior.
  Broad application suites passed: 888 frontend tests and 626 backend tests.
  Follow-up focused checks passed after the final host/cache and navigation
  refinements. Type checks, lint, and both production builds passed.
- A read-only live audit of `ismail.sponsor.krd` and `wafaye.sponsor.krd`
  returned HTTP 200 but found no valid sitemap XML, no host-aware robots sitemap
  declaration, and missing canonical/JSON-LD/crawlable destination anchors.
  Those are observations of the currently deployed version, not evidence that
  the new local implementation has been deployed. Deploy and rerun the audit.
- Search Console submission/property inspection and live WAF/CDN configuration
  remain operational steps for the owner. No production writes were performed.
