# Public form SEO and performance audit

Research and implementation review: 11 October 2026.
Scope: public `/form/<slug>` pages, shared Form/Card renderers, server metadata,
public media, tenant sitemap, availability and submission paths.

## Recommended strategy

Make useful business forms discoverable, with a clear purpose before requesting
personal information. A form titled “Book a consultation in Erbil” with a real
business introduction is more useful than a title such as “Form” or “Contact”.
Explain what the visitor receives, who handles the request, and what happens
next. Describe actual services and locations only. Keep the form short and put
the most important information on the initial screen, especially for Card layout.
This recommendation follows Google's emphasis on helpful, original content and
clear headings; technical SEO alone cannot compensate for an empty page.
[Google: helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

Use one stable URL per published form. Campaign links may append attribution
parameters, but the canonical and sitemap must use the clean URL. Each tenant
keeps its own canonical host; identical slugs across businesses are separate
pages. Google describes canonical annotations and sitemap inclusion as signals,
not guarantees of which URL it chooses.
[Google: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

Keep title and description specific to the introduction. Titles should be clear
and concise; descriptions should summarize the benefit naturally. No keyword
stuffing, invented reviews, locations or translated pages. Open Graph and Twitter
metadata help link previews, but do not guarantee a richer Google result.
[Google: title links](https://developers.google.com/search/docs/appearance/title-link).

## Findings and implemented changes

| Finding | Change | Practical effect |
| --- | --- | --- |
| All forms used `noindex, nofollow` | Content-based index eligibility and follow links | Useful active forms can be crawled/indexed; empty/starter forms stay excluded |
| Sitemap listed only Linktrees | Mixed owner-scoped projection before counting/pagination | Forms are discoverable without breaking tenant isolation or chunk limits |
| Sharing metadata was missing | Open Graph and Twitter title, description, canonical and enabled image | Shared links describe the actual form |
| Document language defaulted to English | Use saved form language through request memoization | Root HTML matches English, Arabic or Kurdish form content |
| First-screen images were lazy | Public banner/backdrop loads eagerly with high priority | Browser can request visible media earlier |
| Saved images bypassed resizing | Responsive Next Image variants with sizes | Smaller devices can receive smaller images |
| Viewer shipped in initial bundle | Dynamic import when opened | Less initial viewer code to download/execute |

Eligibility is a minimum technical policy: a nonempty headline plus description
that is not a known starter prompt. It does not evaluate whether the owner's
claims are accurate, whether a description is detailed enough to rank, or whether
Google will index the form. Archive is organizational and leaves an active form
public; pausing removes it from public access and sitemap. Forms intended to be
private require authentication/access controls. Noindex is not a privacy boundary.
[Google: getting started](https://developers.google.com/search/docs/fundamentals/get-started).

Metadata and sitemap never contain responses, phone numbers or visitor data.
Search robots see server-rendered introduction content. Card pages reveal later
questions through interaction, so the welcome description must make the purpose
clear by itself. No fake language alternates or unsupported rich-result claims
were added.

## Speed targets and measurement

“Zero delay” cannot be promised: network distance, mobile hardware, image cache
misses and the live database read all take time. Use these real-user targets at
the 75th percentile, measured separately for mobile and desktop:

| Metric | Good target | What it protects |
| --- | --- | --- |
| Largest Contentful Paint | At most 2.5 seconds | Main content appears promptly |
| Interaction to Next Paint | At most 200 milliseconds | Taps and input feel responsive |
| Cumulative Layout Shift | At most 0.1 | Controls do not move unexpectedly |

These are Google's published Core Web Vitals thresholds. Passing them does not
guarantee ranking. Development-server timings are not production measurements.
[Google: Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals),
[web.dev: measurement](https://web.dev/articles/vitals).

The public banner is a likely LCP candidate, so it must not be lazy-loaded.
Avoid preloading every carousel image: compete only for the first visible image.
Images retain width/height and existing reserved layout space. Lazy-load later
content and load expensive optional tools when needed. Next supports eager
loading/fetch priority and conditional dynamic client imports.
[web.dev: optimize LCP](https://web.dev/articles/optimize-lcp),
[Next: Image](https://nextjs.org/docs/app/api-reference/components/image),
[Next: lazy loading](https://nextjs.org/docs/app/guides/lazy-loading).

## Recommended deployment and next optimization priorities

1. Deploy frontend and backend together over HTTPS. Verify form page, banner,
   logo, dropdowns, image viewer and successful submission on a real phone.
   Check an active form, a paused form and two tenants with the same slug.
2. Verify Sponsor.krd ownership in Google Search Console, submit the existing
   sitemap, inspect an eligible form, and monitor indexing/coverage reports.
   Sitemaps help discovery; they do not guarantee crawling or indexing.
   [Google: sitemap overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview).
3. Run PageSpeed Insights against deployed Form and Card URLs on mobile and
   desktop. Compare cold and warm image-cache runs, then investigate the LCP
   element, server response time, long tasks, transfer size and layout shifts.
   Record representative URLs without personal submission data.
4. Consider first-party sampled Web Vitals measurement through the existing
   analytics architecture if field data is insufficient. Record aggregate
   timings, layout, device class and form revision; exclude field values,
   answers and sensitive query parameters. This instrumentation is a future
   recommendation, not implemented in this change.
5. If measured server time is the bottleneck, profile the public owner/form
   and action queries. Keep the live availability gate. Any future Redis cache
   must be owner-and-revision scoped and invalidate on edits/status changes;
   do not globally cache tenant HTML or successful submissions for speed.
6. Verify CDN/reverse-proxy compression and immutable caching for hashed JS,
   CSS, fonts and UUID media. Do not cache submission POSTs. Image optimization
   needs a persistent writable cache and capacity planning for cold encoding.
   The existing local media route already uses immutable caching.
7. If images still dominate transfer size, benchmark upload-time WebP variants
   against photographs and logos before changing storage. Existing uploads
   normalize to PNG at up to 2048 pixels; responsive delivery now improves
   transfer without rewriting existing assets. Preserve transparency and
   full-image viewing quality.
8. If fonts dominate, measure Rabar transfer and fallback layout shifts before
   introducing WOFF2 or language subsets. Font display already uses swap;
   blindly preloading every language font would compete with the banner.
9. If interaction timings fail, profile input updates and dropdown rendering
   with the maximum supported question count on a low-end phone. Split optional
   features only when they reduce the measured critical path. Do not turn the
   public renderer into a client-only shell to reduce server work.

## Verification and remaining limits

The change includes metadata/policy parity tests, both public layout submission
regressions, owner-scoped sitemap tests, real PostgreSQL sitemap filtering and
production HTTP checks for root/two tenants, canonical URLs, languages,
sharing metadata, noindex starter forms and missing-page 404s.

Live local verification confirms responsive image URLs load and the deferred
viewer opens/closes. Production field LCP/INP/CLS, slow-device benchmarks, Google
indexing and third-party share-preview cache refreshes are not measured here.
No production deployment, Search Console submission or external publication
was performed. Rankings and speed improvements must be assessed after deploy.

Verification completed: 63 targeted unit/component/database tests, production
SEO HTTP smoke checks, frontend/backend TypeScript production builds and full
frontend/backend lint all passed. The additional preview audit waits for the
viewer to load asynchronously, matching its new on-demand behavior.
