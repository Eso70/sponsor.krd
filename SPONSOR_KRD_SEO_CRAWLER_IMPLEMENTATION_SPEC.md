# Sponsor.krd --- SEO, Crawling, Indexing, Performance & Tracking Implementation Specification

## Purpose

This document is an implementation specification for an AI coding
agent/developer working on Sponsor.krd.

The goal is to turn Sponsor.krd from a visually useful multi-tenant
link-in-bio platform into a technically strong, crawlable, indexable,
fast, shareable, and measurement-ready platform.

The implementation must preserve the existing product behavior and
tenant isolation.

**Important:** This specification is written for the architecture
already established for Sponsor.krd:

-   `sponsor.krd` = platform/admin
-   `<tenant>.sponsor.krd` = business/agency tenant
-   Each tenant manages its own advertising clients.
-   Each client can have one or more public pages.
-   Example public page:
    `https://ismail.sponsor.krd/linktree/kabab-qasab`
-   Tenant data must never leak into another tenant.
-   Tracking configuration must resolve from the current
    tenant/client/page.
-   Sponsor.krd uses Next.js + Nest.js.
-   The exact repository structure must be inspected before editing. Do
    not assume App Router or Pages Router without checking the
    repository.

------------------------------------------------------------------------

# 1. Core Engineering Rules

## 1.1 Do not redesign the product unnecessarily

Do not replace the current architecture just to implement SEO.

The desired result is:

> existing Sponsor.krd application + proper platform-level SEO/crawler
> architecture + reliable event architecture + performance improvements.

Do not rebuild the application from scratch.

Do not change the visual design unless a change is necessary for:

-   semantic HTML
-   accessibility
-   crawlability
-   performance
-   correct business information
-   conversion tracking

## 1.2 Preserve tenant isolation

Every request to a public page must resolve:

``` text
request hostname
        ↓
tenant
        ↓
client
        ↓
page
        ↓
SEO configuration
        ↓
tracking configuration
        ↓
rendered page
```

Never resolve a page using only a global slug.

Bad:

``` text
/linktree/kabab-qasab
→ find first page with slug = kabab-qasab
```

Correct:

``` text
ismail.sponsor.krd
+
/linktree/kabab-qasab
→ tenant = ismail
→ page = kabab-qasab belonging to ismail
```

The database query must enforce tenant ownership.

Example conceptual query:

``` ts
findPage({
  tenantId,
  slug,
  status: 'PUBLISHED',
})
```

Never trust `tenantId` supplied by the browser when the tenant can be
derived from the hostname.

## 1.3 Public pages and dashboard pages are different

The platform has two very different SEO classes.

### Public business pages

Examples:

``` text
https://ismail.sponsor.krd/linktree/kabab-qasab
https://wafaye.sponsor.krd/linktree/some-business
```

These may be indexed if the page is sufficiently useful and
intentionally public.

### Private application pages

Examples:

``` text
/dashboard
/settings
/login
/admin
/api/*
```

These should not be exposed as search content.

Use authentication and/or appropriate `noindex` behavior.

Do not rely on `robots.txt` alone to protect private information.
Authentication/authorization is the security boundary.

------------------------------------------------------------------------

# 2. First Task: Inspect the Repository Before Editing

The AI agent MUST first inspect:

1.  `package.json`
2.  Next.js version
3.  React version
4.  whether the application uses App Router or Pages Router
5.  `src/app`
6.  `app`
7.  `pages`
8.  `src/pages`
9.  middleware
10. API routes
11. Nest.js backend
12. database schema/entities
13. tenant resolution logic
14. client/page models
15. existing SEO/metadata code
16. existing `robots.txt`
17. existing sitemap
18. existing canonical logic
19. existing JSON-LD
20. image handling
21. tracking/pixel implementation
22. existing analytics/event tables
23. public page rendering strategy
24. current deployment/reverse-proxy/CDN configuration

Before changing code, create an internal map similar to:

``` text
Frontend:
- router:
- public page route:
- dashboard routes:
- middleware:
- metadata implementation:
- image system:

Backend:
- tenant resolver:
- page resolver:
- SEO fields:
- tracking fields:
- event endpoint:
- database:

Infrastructure:
- domain routing:
- CDN/proxy:
- caching:
- robots:
- sitemap:
```

Do not invent paths.

------------------------------------------------------------------------

# 3. Public Page SEO Data Model

SEO must be data-driven.

The public page should be able to store enough information to generate
unique metadata.

Recommended fields:

``` ts
type PageSeo = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;

  robotsIndex?: boolean;
  robotsFollow?: boolean;

  keywords?: string[];

  locale?: string;
};
```

Business/client data should preferably contain:

``` ts
type BusinessProfile = {
  name: string;
  description?: string;

  category?: string;

  phone?: string;
  whatsapp?: string;
  telegram?: string;
  website?: string;

  address?: {
    street?: string;
    city?: string;
    region?: string;
    country?: string;
    postalCode?: string;
  };

  geo?: {
    latitude?: number;
    longitude?: number;
  };

  openingHours?: string[];

  logoUrl?: string;
  coverImageUrl?: string;

  socialLinks?: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    telegram?: string;
  };
};
```

Do not add fields that duplicate existing database fields. Reuse the
existing schema where possible.

------------------------------------------------------------------------

# 4. Dynamic `<title>`

Every indexable public business page needs a meaningful, unique title.

Bad:

``` text
Sponsor.krd
```

for every client.

Bad:

``` text
Linktree
```

for every client.

Better:

``` text
Kabab Qasab | Restaurant in Erbil
```

or, where location/category is known:

``` text
Kabab Qasab | Kurdish Restaurant in Erbil
```

The title must be generated from real database data.

Do not keyword-stuff.

Do not invent a business category or location.

If data is incomplete, use a conservative fallback.

Example:

``` ts
const title =
  seo.title?.trim() ||
  [business.name, business.category, business.city]
    .filter(Boolean)
    .join(' | ');
```

If only the business name exists:

``` text
Kabab Qasab
```

is preferable to invented information.

------------------------------------------------------------------------

# 5. Dynamic Meta Description

Generate a unique description from actual business information.

Example:

``` text
Visit Kabab Qasab in Erbil. Find contact options, location, opening information, and official links.
```

Do not generate fake claims.

Do not use the same description for every page.

Do not make the description an enormous keyword list.

Recommended implementation:

``` ts
const description =
  seo.description?.trim() ||
  buildBusinessDescription({
    name: business.name,
    category: business.category,
    city: business.city,
  });
```

The description should describe the actual page.

------------------------------------------------------------------------

# 6. Canonical URL

Every indexable public page must have one canonical URL.

Example:

``` text
https://ismail.sponsor.krd/linktree/kabab-qasab
```

The canonical URL must be generated from the actual request host and
public route.

Do not generate:

``` text
https://sponsor.krd/linktree/kabab-qasab
```

if the actual public page belongs to:

``` text
https://ismail.sponsor.krd/linktree/kabab-qasab
```

Do not use the incoming `Host` header blindly without validating it
against the platform's known tenant/domain configuration.

Prefer:

``` text
tenant configured primary public domain
+
canonical public path
```

If a tenant has a custom domain in the future, the canonical should use
the verified primary public domain for that page.

------------------------------------------------------------------------

# 7. Prevent Duplicate Host/URL Indexing

Multi-tenant systems can accidentally expose the same content through
multiple hosts.

For every public page, decide which host is canonical.

Example:

``` text
ismail.sponsor.krd/linktree/kabab-qasab
```

is canonical.

If the same content can also be reached through:

``` text
sponsor.krd/linktree/kabab-qasab
```

do not let both become independent indexable copies.

Preferred behavior:

1.  redirect non-canonical host → canonical host, OR
2.  serve the canonical URL and use a correct canonical tag, while
    ensuring alternate host behavior is intentional.

A 301/308 redirect is preferable when the alternate host should never be
considered a separate public URL.

Do not create redirect loops.

------------------------------------------------------------------------

# 8. Next.js Metadata Implementation

If the repository uses the App Router, use the Next.js Metadata API.

For dynamic routes, use `generateMetadata`.

Conceptual structure:

``` ts
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const page = await getPublicPageFromTenantAndSlug(params);

  if (!page) {
    return {
      title: 'Page not found',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalUrl = buildCanonicalUrl(page);

  return {
    metadataBase: new URL(canonicalUrl).origin,

    title: page.seo.title || buildTitle(page),

    description:
      page.seo.description || buildDescription(page),

    alternates: {
      canonical: canonicalUrl,
    },

    robots: {
      index: page.seo.robotsIndex ?? true,
      follow: page.seo.robotsFollow ?? true,
    },

    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: page.seo.ogTitle || buildTitle(page),
      description:
        page.seo.ogDescription || buildDescription(page),
      images: [
        {
          url: page.seo.ogImageUrl || buildOgImage(page),
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: page.seo.ogTitle || buildTitle(page),
      description:
        page.seo.ogDescription || buildDescription(page),
      images: [
        page.seo.ogImageUrl || buildOgImage(page),
      ],
    },
  };
}
```

Adapt this to the actual repository.

If the project uses Pages Router, use the correct Pages Router
metadata/head implementation instead.

Do not mix App Router and Pages Router patterns.

------------------------------------------------------------------------

# 9. Robots Policy

The platform needs two levels:

1.  HTTP/metadata robots directives
2.  `/robots.txt`

These serve different purposes.

## Public pages

If intentionally indexable:

``` text
index, follow
```

If intentionally not indexable:

``` text
noindex, follow
```

Use `noindex` for:

-   temporary campaign-only pages
-   private pages
-   thin pages that should not enter search
-   test pages
-   unpublished pages
-   duplicate pages

Do not automatically mark every Sponsor.krd page `noindex`.

## Important rule

If a page might need to be removed from search using `noindex`, do not
block the same URL from crawling in `robots.txt`.

Search engines need to be able to crawl the page to see the `noindex`
directive.

------------------------------------------------------------------------

# 10. Dynamic Robots.txt for a Multi-Tenant Platform

Every host may request:

``` text
/robots.txt
```

The response must be appropriate for that host.

At minimum:

``` text
User-agent: *
Allow: /

Sitemap: https://CURRENT-CANONICAL-HOST/sitemap.xml
```

For the main platform host, do not expose dashboard/API routes to search
crawlers unnecessarily.

Example concept:

``` text
User-agent: *
Disallow: /dashboard
Disallow: /admin
Disallow: /api
Disallow: /login
Disallow: /settings
Allow: /

Sitemap: https://sponsor.krd/sitemap.xml
```

For a tenant:

``` text
User-agent: *
Disallow: /dashboard
Disallow: /admin
Disallow: /api
Allow: /

Sitemap: https://ismail.sponsor.krd/sitemap.xml
```

Do not copy a single hardcoded sitemap URL to every tenant host.

The sitemap URL must match the current public host/canonical domain.

------------------------------------------------------------------------

# 11. Sitemap Architecture

Every indexable public page should be discoverable through a sitemap.

The sitemap must be generated from the database.

Do not manually maintain thousands of URLs.

For a tenant host:

``` text
https://ismail.sponsor.krd/sitemap.xml
```

should contain only URLs belonging to that tenant.

Example:

``` xml
<url>
  <loc>https://ismail.sponsor.krd/linktree/kabab-qasab</loc>
  <lastmod>...</lastmod>
</url>
```

Do not include:

-   unpublished pages
-   deleted pages
-   private pages
-   `noindex` pages
-   invalid pages
-   pages belonging to another tenant
-   redirect URLs
-   duplicate canonical URLs

If the database contains a page status:

``` text
DRAFT
PUBLISHED
ARCHIVED
DELETED
```

normally only `PUBLISHED` pages intended for indexing belong in the
sitemap.

If a page has explicit SEO settings:

``` text
robotsIndex = false
```

do not include it in the indexable sitemap.

------------------------------------------------------------------------

# 12. Sitemap Scalability

If the platform eventually has many pages, implement sitemap indexing.

Concept:

``` text
/sitemap.xml
      ↓
sitemap index
      ↓
/sitemaps/pages-1.xml
/sitemaps/pages-2.xml
...
```

Do not generate one enormous response if the platform becomes large.

Use the repository's current Next.js capabilities and the database's
pagination.

The sitemap generation must be deterministic and tenant-safe.

------------------------------------------------------------------------

# 13. Host-Aware Sitemap Resolution

The application should resolve:

``` text
hostname
→ tenant
→ public indexable pages
→ canonical URLs
```

Pseudo-code:

``` ts
const host = getValidatedHost(request);

const tenant = await tenantService.findByHost(host);

if (!tenant) {
  return notFoundOrPlatformResponse();
}

const pages = await pageRepository.findIndexablePages({
  tenantId: tenant.id,
});

return pages.map(page => ({
  loc: buildCanonicalUrl(tenant, page),
  lastmod: page.updatedAt,
}));
```

Never query:

``` ts
findAllIndexablePages()
```

for a tenant sitemap.

------------------------------------------------------------------------

# 14. Make Business Content Crawlable

A common mistake in link-in-bio applications is rendering only a logo,
an image, and buttons.

Search engines need meaningful text and semantic structure.

Every indexable business page should have server-rendered HTML
containing real business information.

Recommended structure:

``` html
<main>
  <header>
    <img ... />
    <h1>Kabab Qasab</h1>
    <p>...</p>
  </header>

  <section>
    <h2>Contact</h2>
    <a href="https://wa.me/...">WhatsApp</a>
    <a href="tel:...">Call</a>
    <a href="https://t.me/...">Telegram</a>
  </section>

  <section>
    <h2>Business information</h2>
    ...
  </section>
</main>
```

The exact design can remain minimal.

The important part is that meaningful information exists in the initial
HTML.

------------------------------------------------------------------------

# 15. Use Real Crawlable Links

Important destinations must be real HTML anchors.

Correct:

``` tsx
<a href={whatsappUrl}>
  WhatsApp
</a>
```

Also acceptable:

``` tsx
<a
  href={whatsappUrl}
  onClick={trackClick}
>
  WhatsApp
</a>
```

Avoid:

``` tsx
<div onClick={() => window.location.href = whatsappUrl}>
```

for important navigation.

Tracking should enhance normal links, not replace them.

The user should still be able to navigate if JavaScript fails.

------------------------------------------------------------------------

# 16. Server Rendering / Initial HTML

For public business pages, important SEO content must be available
without requiring a client-side API request after page load.

Bad architecture:

``` text
HTML shell
↓
JavaScript loads
↓
API request
↓
business data appears
```

Preferred:

``` text
request
↓
server resolves tenant + page
↓
server renders business information
↓
crawler receives meaningful HTML
```

Client-side JavaScript may still power:

-   click tracking
-   animations
-   UI interactions
-   analytics
-   dynamic widgets

but the main business identity/content should already be present.

------------------------------------------------------------------------

# 17. HTTP Status Codes Matter

Public valid page:

``` text
200
```

Unknown page:

``` text
404
```

Deleted page:

``` text
404
```

Moved page:

``` text
301 or 308
```

Do not return:

``` text
200
```

with a "page not found" message.

Do not return:

``` text
200
```

for every unknown slug.

That creates soft-404 problems.

For an unpublished page, use the application's intended access behavior
and ensure it is not accidentally indexable.

------------------------------------------------------------------------

# 18. JSON-LD / Structured Data

Use structured data only when the information is actually present on the
page.

Do not invent business information.

For an appropriate local business, generate a `LocalBusiness` subtype
where justified.

Examples:

``` text
Restaurant
BeautySalon
DaySpa
HealthClub
Store
LocalBusiness
```

Use the most specific valid type available.

Conceptual JSON-LD:

``` json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Kabab Qasab",
  "url": "https://ismail.sponsor.krd/linktree/kabab-qasab",
  "telephone": "+964...",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Erbil",
    "addressCountry": "IQ"
  }
}
```

Only output fields that are known and valid.

Do not fabricate:

-   reviews
-   ratings
-   prices
-   opening hours
-   addresses
-   coordinates

Do not create fake review schema.

------------------------------------------------------------------------

# 19. Organization Structured Data for Sponsor.krd

The main Sponsor.krd platform can have Organization structured data if
appropriate.

This is separate from each client business.

Do not put Sponsor.krd organization data on a client page as if
Sponsor.krd were the client business.

The client page should represent the client.

------------------------------------------------------------------------

# 20. Open Graph

Every public page should have client-specific Open Graph metadata.

Recommended:

``` text
og:title
og:description
og:url
og:image
og:type
```

The OG image should be generated or selected from the business's actual
assets.

Avoid using one generic Sponsor.krd image for every business page.

Ideal future behavior:

``` text
business logo
+
business name
+
business category/location
+
Sponsor.krd subtle branding
```

Do not make the OG image misleading.

------------------------------------------------------------------------

# 21. Dynamic OG Image Generation

If the application supports Next.js dynamic image generation, implement
an automatic OG image endpoint.

Concept:

``` text
/linktree/kabab-qasab
        ↓
/opengraph-image
        ↓
generated image
```

The image can contain:

``` text
Kabab Qasab
Restaurant
Erbil
```

Only use data actually stored for the business.

Cache generated OG images when practical.

Do not make every page generate a heavy image on every request.

------------------------------------------------------------------------

# 22. Favicon and Icons

The public business page should have an appropriate favicon/icon.

If a client has a logo and the platform intentionally supports
per-client icons, use it carefully.

Do not create broken icon URLs.

Ensure icon URLs work on the tenant host.

------------------------------------------------------------------------

# 23. Language and Locale

Sponsor.krd may contain Kurdish, Arabic, and other language content.

Do not automatically translate business names.

Preserve the business's actual language.

If the platform has genuine localized versions of the same page, use
correct alternate-language architecture.

Do not add fake `hreflang` entries.

If there is only one version of a page, do not invent multiple language
URLs.

------------------------------------------------------------------------

# 24. Image SEO and Performance

Every important image should have:

-   meaningful `alt`
-   known dimensions/aspect ratio
-   optimized file format
-   appropriate loading behavior

Examples:

Business logo:

``` tsx
alt={`${business.name} logo`}
```

Decorative image:

``` tsx
alt=""
```

Do not write keyword-stuffed alt text.

Avoid:

``` text
Kabab Qasab Erbil Restaurant Kurdish Food Best Restaurant Iraq
```

Use:

``` text
Kabab Qasab logo
```

------------------------------------------------------------------------

# 25. Performance

TikTok traffic is often mobile traffic.

Public pages should be extremely lightweight.

Priorities:

1.  server-render initial business content
2.  optimize images
3.  avoid oversized JavaScript bundles
4.  avoid unnecessary client components
5.  lazy-load noncritical assets
6.  use modern image formats where supported
7.  cache public page data safely
8.  optimize fonts
9.  avoid blocking third-party scripts
10. keep tracking code lightweight
11. avoid unnecessary animations
12. avoid loading dashboard code on public pages

Do not sacrifice tracking correctness for superficial performance gains.

------------------------------------------------------------------------

# 26. Cache Strategy

Public pages can often be cached, but tenant/client changes must
invalidate or revalidate the correct page.

Never cache one tenant's response and accidentally serve it to another
tenant.

Cache key must include the canonical host/tenant and path.

Concept:

``` text
cache key =
hostname + pathname
```

not only:

``` text
pathname
```

This is critical for:

``` text
ismail.sponsor.krd/linktree/kabab-qasab
```

versus:

``` text
wafaye.sponsor.krd/linktree/kabab-qasab
```

------------------------------------------------------------------------

# 27. Tracking Architecture --- Sponsor.krd Event Engine

SEO is only one part of the platform.

Sponsor.krd should have one internal event architecture that can support
both browser and server-side tracking.

Every meaningful event should have an internal record such as:

``` ts
{
  tenantId,
  clientId,
  pageId,
  visitorId,
  eventId,
  eventName,
  eventTime,
  url,
  referrer,
  ttclid,
  ttp,
  utmSource,
  utmMedium,
  utmCampaign,
  metadata
}
```

The exact database types should match the current project.

------------------------------------------------------------------------

# 28. Internal Events vs TikTok Events

Do not send every internal event as a TikTok standard event.

Recommended internal events:

``` text
page_view
profile_view
cta_view
whatsapp_click
telegram_click
phone_click
website_click
map_click
form_start
form_submit
lead_created
purchase
```

Possible TikTok mappings:

``` text
page_view       → PageView
profile_view    → ViewContent
meaningful CTA  → Contact
form submission → Lead / SubmitForm where appropriate
purchase        → CompletePayment
```

The mapping should be configurable.

Do not label every button click as `Lead`.

A click is not automatically a lead.

------------------------------------------------------------------------

# 29. Pixel + Events API Deduplication

If the same event is sent through:

``` text
browser Pixel
+
TikTok Events API
```

the same logical event must use the same `event_id`.

Concept:

``` ts
const eventId = crypto.randomUUID();
```

Browser:

``` text
event_id = abc-123
```

Server:

``` text
event_id = abc-123
```

This lets TikTok identify overlapping event copies for deduplication.

Do not generate one ID in the browser and a different ID on the server
for the same event.

------------------------------------------------------------------------

# 30. Preserve TikTok Attribution

When a visitor arrives from a TikTok campaign, preserve attribution
information where available.

Important values may include:

``` text
ttclid
_ttp
UTM parameters
```

Store them against the visitor/session/event as appropriate.

Do not overwrite attribution unnecessarily.

Do not store sensitive personal information unless there is a legitimate
reason and appropriate privacy handling.

------------------------------------------------------------------------

# 31. Visitor ID

Create a first-party anonymous visitor identifier.

Example:

``` text
visitor_id
```

This is not the same thing as a customer's identity.

It allows Sponsor.krd to understand anonymous behavior such as:

``` text
visitor A
→ page view
→ WhatsApp click
→ returns later
→ phone click
```

It does not automatically tell Sponsor.krd:

``` text
visitor A = customer
```

unless the system receives real identifying/outcome data.

------------------------------------------------------------------------

# 32. Advanced Matching / PII

If a page contains a form collecting:

-   email
-   phone
-   name

the platform can consider TikTok Advanced Matching / server-side
matching where appropriate.

Do not implement PII collection just for SEO.

Do not send arbitrary personal data to advertising systems.

Hash/handle data according to the advertising platform's current
requirements and applicable privacy obligations.

------------------------------------------------------------------------

# 33. Tenant Tracking Configuration

Tracking must be configuration-driven.

Concept:

``` text
Tenant
  ↓
TikTokConnection
  ↓
Client
  ↓
Page
  ↓
TrackingConfiguration
```

Example:

``` ts
type TrackingConfiguration = {
  pixelId?: string;
  eventsApiConnectionId?: string;
  enabledEvents: string[];
};
```

Do not hardcode one global Pixel ID into every public page.

Do not allow tenant A to accidentally send events using tenant B's
Pixel.

------------------------------------------------------------------------

# 34. Event Routing

At runtime:

``` text
request
↓
resolve tenant
↓
resolve client
↓
resolve page
↓
load tracking configuration
↓
generate event_id
↓
store Sponsor.krd event
↓
send browser event if applicable
↓
send server event if configured
```

The event record should exist even if the external API fails.

Use retry logic for server-side delivery where appropriate.

Do not lose the internal event simply because TikTok is temporarily
unavailable.

------------------------------------------------------------------------

# 35. Tracking Diagnostics Dashboard

Add a tenant/client/page diagnostics view.

Useful fields:

``` text
Pixel status
Events API status
Last browser event
Last server event
Last event timestamp
Events today
Events this week
Deduplication status
Missing event_id warnings
Missing attribution warnings
Invalid Pixel ID
```

This will be much more useful than manually debugging every client page.

------------------------------------------------------------------------

# 36. SEO Diagnostics Dashboard

Add automated checks for each public page.

Suggested checks:

``` text
[ ] Page returns HTTP 200
[ ] Canonical exists
[ ] Canonical is valid
[ ] Canonical matches expected host
[ ] Title exists
[ ] Description exists
[ ] H1 exists
[ ] Business name exists
[ ] Meaningful description exists
[ ] OG title exists
[ ] OG description exists
[ ] OG image exists
[ ] Robots directive is correct
[ ] Page appears in correct sitemap
[ ] Sitemap URL returns 200
[ ] Robots URL returns 200
[ ] JSON-LD valid
[ ] Main links are <a>
[ ] Images have alt
[ ] No broken internal links
[ ] No cross-tenant data
```

------------------------------------------------------------------------

# 37. Search Console Strategy

For the main domain and tenant domains, establish an intentional Google
Search Console strategy.

The exact verification setup depends on how domains are controlled.

After deployment:

1.  verify the appropriate domain/property
2.  submit the sitemap
3.  inspect representative public pages
4.  inspect tenant robots.txt
5.  inspect tenant sitemap.xml
6.  inspect canonical
7.  request indexing for important pages when appropriate
8.  monitor indexing and crawl errors

Do not expect indexing immediately.

------------------------------------------------------------------------

# 38. Crawler Requirements

A crawler must be able to do this:

``` text
GET https://ismail.sponsor.krd/robots.txt
        ↓
200
        ↓
Sitemap URL is visible
        ↓
GET https://ismail.sponsor.krd/sitemap.xml
        ↓
200
        ↓
Find:
https://ismail.sponsor.krd/linktree/kabab-qasab
        ↓
GET public page
        ↓
200
        ↓
HTML contains:
- business name
- description
- links
- canonical
- metadata
- structured data
        ↓
crawler can follow links
```

If any step fails, fix that layer.

------------------------------------------------------------------------

# 39. Do Not Block Crawlers at Infrastructure Level

Inspect:

-   Cloudflare
-   reverse proxy
-   WAF
-   CDN
-   rate limiting
-   bot protection
-   authentication middleware
-   hostname validation
-   geo blocking
-   IP blocking

Make sure legitimate crawlers are not receiving:

``` text
403
429
5xx
```

for public pages.

The web crawler must receive normal HTTP responses.

Do not disable all security protections.

Instead, configure them so legitimate search crawling is possible.

------------------------------------------------------------------------

# 40. Hostname Handling

The server must correctly recognize:

``` text
sponsor.krd
www.sponsor.krd
ismail.sponsor.krd
wafaye.sponsor.krd
```

and any approved custom domain.

Normalize the host:

-   lowercase
-   remove trailing dot if applicable
-   correctly parse port in development
-   validate against configured domains

Do not trust arbitrary hostnames for database lookup.

Prevent host-header attacks.

------------------------------------------------------------------------

# 41. Development vs Production

Do not test production SEO only through:

``` text
localhost
```

Use a public HTTPS environment.

For development, tools such as:

``` text
lvh.me
```

can be useful for hostname testing, but production crawler tests must
use real public HTTPS domains.

------------------------------------------------------------------------

# 42. Important Rule About robots.txt

`robots.txt` does NOT make a page indexed.

It only gives crawling instructions.

Likewise:

``` text
Allow: /
```

does not guarantee indexing.

Indexing depends on:

-   crawl accessibility
-   HTTP status
-   content quality
-   canonicalization
-   duplicate handling
-   internal/external discovery
-   search engine systems

Therefore the platform needs both:

``` text
crawlability
+
indexability
```

------------------------------------------------------------------------

# 43. Crawler Testing Checklist

For a representative tenant:

``` bash
curl -I https://ismail.sponsor.krd/robots.txt
curl -I https://ismail.sponsor.krd/sitemap.xml
curl -I https://ismail.sponsor.krd/linktree/kabab-qasab
```

Expected:

``` text
robots.txt → 200
sitemap.xml → 200
public page → 200
```

Then:

``` bash
curl -A "Googlebot" -I https://ismail.sponsor.krd/linktree/kabab-qasab
```

The server should not return a special error simply because the
User-Agent is a crawler.

Also test:

``` bash
curl -A "Googlebot" https://ismail.sponsor.krd/linktree/kabab-qasab
```

Inspect the HTML.

The initial HTML should contain:

``` text
business name
description
canonical
title
```

and important links.

------------------------------------------------------------------------

# 44. Browser vs Raw HTML Test

Do not rely only on Chrome DevTools after JavaScript executes.

Test the raw response.

Example:

``` bash
curl https://ismail.sponsor.krd/linktree/kabab-qasab
```

Then search the returned HTML for:

``` text
Kabab Qasab
<title>
description
canonical
og:title
application/ld+json
WhatsApp
```

If the business name only appears after JavaScript executes, investigate
SSR/server rendering.

------------------------------------------------------------------------

# 45. Google-Friendly Page Requirements

A good indexable client page should approximately satisfy:

``` text
HTTP 200
+
unique URL
+
unique canonical
+
unique title
+
useful description
+
real H1
+
real business information
+
crawlable links
+
appropriate structured data
+
sitemap discovery
+
robots allows crawling
+
no accidental noindex
+
fast mobile experience
```

------------------------------------------------------------------------

# 46. Thin Content Strategy

Do not mass-index thousands of pages that contain only:

``` text
logo
business name
WhatsApp
Instagram
TikTok
phone
```

For pages intended to rank organically, encourage meaningful business
content such as:

-   business description
-   category
-   city/area
-   address where appropriate
-   opening hours where appropriate
-   services
-   menu/product information where appropriate
-   official contact details
-   official website/social links
-   useful location information

Only publish information provided by the business.

------------------------------------------------------------------------

# 47. Campaign Pages vs SEO Pages

Sponsor.krd may have pages created primarily for paid advertising.

Not every paid landing page needs to be an SEO landing page.

Provide a page-level choice:

``` text
SEO indexing:
- Index
- Noindex
```

Default behavior should be intentionally chosen based on the product.

For a temporary paid campaign page, `noindex, follow` can be
appropriate.

For a permanent business profile intended for organic discovery,
`index, follow` can be appropriate.

Do not automatically index every temporary page.

------------------------------------------------------------------------

# 48. Internal Linking

If public pages are indexable, give crawlers paths into them.

The platform can have:

``` text
tenant homepage
→ public business pages
```

when this is appropriate for the product.

However, do not create a giant directory solely for SEO if it harms the
user experience.

The sitemap is a discovery mechanism, while crawlable links are another
discovery mechanism.

------------------------------------------------------------------------

# 49. Error Handling

Create clear behavior for:

### Unknown tenant

Return the correct not-found response.

### Unknown page

Return:

``` text
404
```

### Disabled tenant

Do not accidentally return the old page as indexable.

### Deleted page

Return 404 or a deliberate redirect if there is a genuine replacement.

### Unpublished page

Prevent public indexing.

### Invalid domain

Do not resolve arbitrary tenants from arbitrary hostnames.

------------------------------------------------------------------------

# 50. Security Requirements

Do not allow SEO work to weaken tenant security.

Specifically test:

``` text
Tenant A cannot access Tenant B page data
Tenant A cannot see Tenant B SEO data
Tenant A cannot use Tenant B Pixel
Tenant A cannot modify Tenant B sitemap
Tenant A cannot inject Tenant B structured data
```

Also sanitize:

-   title
-   description
-   JSON-LD
-   OG data
-   URLs
-   business text

Do not create XSS vulnerabilities while rendering dynamic metadata.

------------------------------------------------------------------------

# 51. Validation / Acceptance Tests

The implementation is not complete until these tests pass.

## Tenant isolation

``` text
ismail.sponsor.krd/linktree/client-a
```

must never return client B.

## Metadata

For an indexable page:

``` text
<title> exists
description exists
canonical exists
og:title exists
og:description exists
og:image exists
robots is correct
```

## Sitemap

``` text
GET /sitemap.xml → 200
```

Only valid indexable URLs appear.

## Robots

``` text
GET /robots.txt → 200
```

Correct sitemap URL appears.

## HTTP status

Valid page:

``` text
200
```

Unknown page:

``` text
404
```

## HTML

Raw HTML contains:

``` text
business name
H1
description/content
canonical
```

## Links

Important buttons are real:

``` html
<a href="...">
```

## Structured data

Valid JSON-LD is generated only when appropriate.

## Host canonicalization

Non-canonical hosts do not create duplicate indexable copies.

## Performance

No unnecessary dashboard JavaScript is shipped to public pages.

## Tracking

Browser/server duplicate events use the same event ID.

## Attribution

TikTok attribution parameters are preserved where available.

------------------------------------------------------------------------

# 52. Recommended Implementation Order

Do the work in this order.

## Phase 1 --- Repository discovery

Inspect the existing architecture.

Do not modify anything yet.

## Phase 2 --- Host + tenant resolution

Make hostname → tenant → client/page resolution reliable.

## Phase 3 --- Public page rendering

Ensure public business content is available in initial HTML.

## Phase 4 --- Metadata

Implement:

``` text
title
description
canonical
robots
Open Graph
Twitter
icons
```

## Phase 5 --- Robots

Implement host-aware `/robots.txt`.

## Phase 6 --- Sitemap

Implement host-aware dynamic sitemap.

## Phase 7 --- Structured data

Implement appropriate JSON-LD.

## Phase 8 --- Crawlable links

Replace navigation-only JavaScript interactions where necessary with
real anchors.

## Phase 9 --- HTTP correctness

Fix:

``` text
200
404
301/308
```

behavior.

## Phase 10 --- Performance

Optimize public page rendering and assets.

## Phase 11 --- Tracking architecture

Centralize:

``` text
event_id
visitor_id
tenant_id
client_id
page_id
ttclid
ttp
UTM
```

and browser/server event routing.

## Phase 12 --- Diagnostics

Build automated SEO/tracking health checks.

## Phase 13 --- Production crawler testing

Test real HTTPS tenant domains.

## Phase 14 --- Search Console

Submit sitemaps and inspect representative URLs.

------------------------------------------------------------------------

# 53. AI Coding Agent Behavior

The AI implementing this specification must follow these rules.

### Rule A --- Inspect first

Never assume file names or framework router.

### Rule B --- Reuse existing architecture

Do not create duplicate services when an existing tenant/page service
can be extended.

### Rule C --- Do not duplicate database data

Reuse existing business/client/page fields.

### Rule D --- Do not break tracking

Existing Pixel functionality must continue working.

### Rule E --- Do not break tenant isolation

Every database query must remain tenant-scoped.

### Rule F --- Do not invent business information

SEO data must come from real stored information.

### Rule G --- Do not invent SEO URLs

Canonical/sitemap URLs must come from validated domains.

### Rule H --- Do not create fake structured data

Only describe information actually shown/known.

### Rule I --- Test raw HTML

Do not conclude that SEO works merely because the browser displays the
content.

### Rule J --- Test multiple tenants

At minimum test:

``` text
tenant A
tenant B
```

with similar slugs to prove isolation.

### Rule K --- Test unpublished and missing pages

Verify 404/noindex behavior.

### Rule L --- Test crawler User-Agent

Verify legitimate crawler requests receive normal responses.

------------------------------------------------------------------------

# 54. Suggested Internal Utility Functions

Where appropriate, centralize platform logic.

Possible utilities:

``` ts
resolveTenantFromHost(host)
resolvePublicPage(tenantId, slug)
buildCanonicalUrl(tenant, page)
buildPageTitle(page)
buildPageDescription(page)
buildOgMetadata(page)
buildRobotsMetadata(page)
buildBusinessJsonLd(page)
getIndexablePages(tenantId)
buildTenantSitemap(tenant)
```

Do not duplicate these rules across multiple route files.

------------------------------------------------------------------------

# 55. Suggested SEO Service

A central service can make the system easier to maintain:

``` ts
class PublicPageSeoService {
  buildMetadata(page, context) {}
  buildCanonicalUrl(page, context) {}
  buildRobots(page, context) {}
  buildStructuredData(page, context) {}
  buildOgData(page, context) {}
}
```

The actual implementation should follow the repository's conventions.

------------------------------------------------------------------------

# 56. Suggested Tracking Service

Similarly:

``` ts
class EventTrackingService {
  createEvent(input) {}
  sendBrowserEvent(input) {}
  sendServerEvent(input) {}
  deduplicate(input) {}
  preserveAttribution(input) {}
}
```

The browser and server integrations should share the same event model.

------------------------------------------------------------------------

# 57. Database Event Ledger

A persistent internal event table is strongly recommended.

Conceptual schema:

``` text
Event
-----
id
tenantId
clientId
pageId
visitorId
eventId
eventName
occurredAt
url
referrer
ttclid
ttp
utmSource
utmMedium
utmCampaign
payload
browserSentAt
serverSentAt
serverDeliveryStatus
createdAt
```

The exact schema must match the existing database/ORM.

Do not store unlimited arbitrary payloads without retention limits.

------------------------------------------------------------------------

# 58. Observability

Log enough information to debug failures without logging sensitive data
unnecessarily.

Useful identifiers:

``` text
tenantId
pageId
eventId
eventName
externalConnectionId
status
```

Do not log:

-   passwords
-   access tokens
-   secret API keys
-   unnecessary raw PII

------------------------------------------------------------------------

# 59. Final Definition of Done

Sponsor.krd SEO/platform work is complete only when:

### Architecture

-   tenant isolation remains intact
-   host resolution is validated
-   client/page resolution is tenant-scoped

### SEO

-   dynamic titles
-   dynamic descriptions
-   canonical
-   robots
-   OG
-   Twitter metadata
-   icons
-   structured data where appropriate

### Crawling

-   `/robots.txt` works
-   `/sitemap.xml` works
-   sitemap is tenant-aware
-   crawler can reach public pages
-   no accidental 403/429/5xx
-   no accidental crawler blocking

### Indexing

-   indexable pages use `index, follow`
-   non-indexable pages use deliberate `noindex`
-   sitemap contains only intended indexable URLs
-   canonical URLs are correct

### Content

-   meaningful business content is server-rendered
-   H1/business name exists
-   important links are crawlable anchors

### HTTP

-   real pages return 200
-   missing pages return 404
-   real moved pages use 301/308

### Performance

-   public pages are lightweight
-   images are optimized
-   unnecessary JavaScript is avoided
-   mobile rendering is fast

### Tracking

-   internal events are stored
-   event IDs are consistent
-   Pixel + server events can be deduplicated
-   TikTok attribution is preserved
-   tenant tracking configurations remain isolated

### Diagnostics

-   SEO health checks exist
-   tracking health checks exist
-   errors can be diagnosed per tenant/page

### Production verification

At least one real tenant and one additional tenant are tested through:

``` text
robots.txt
sitemap.xml
public page
raw HTML
Googlebot User-Agent
canonical
structured data
Search Console URL Inspection
```

------------------------------------------------------------------------

# 60. Official Reference Material

The implementation should follow current official documentation rather
than old SEO tutorials.

Relevant references:

-   Next.js Metadata API
-   Next.js robots.txt support
-   Next.js sitemap support
-   Next.js crawling/indexing guidance
-   Google Search Central crawling/indexing documentation
-   Google Search Central structured data documentation
-   Google Search Central LocalBusiness structured data documentation
-   Google Search Console documentation

The implementation must verify current framework APIs against the
installed Next.js version before coding.

------------------------------------------------------------------------

# 61. Short Executive Goal

The final Sponsor.krd public-page pipeline should be:

``` text
Visitor / Crawler
        ↓
HTTPS request
        ↓
Validated hostname
        ↓
Tenant resolution
        ↓
Client/page resolution
        ↓
Server-rendered business content
        ↓
Dynamic SEO metadata
        ↓
Canonical URL
        ↓
Structured data
        ↓
Crawlable links
        ↓
Tracking initialization
        ↓
Browser + server event pipeline
        ↓
Internal event ledger
        ↓
TikTok / analytics systems
```

For search crawlers specifically:

``` text
Crawler
  ↓
robots.txt
  ↓
sitemap.xml
  ↓
public URL
  ↓
HTTP 200
  ↓
server-rendered HTML
  ↓
title + description + canonical
  ↓
business content
  ↓
crawlable links
  ↓
structured data
  ↓
indexing evaluation
```

The objective is not to "force Google to rank" a page. The objective is
to make every intentionally public Sponsor.krd page technically
understandable, discoverable, crawlable, indexable when appropriate,
fast, and semantically accurate.
