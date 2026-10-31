# Browser titles and icons audit

Audited 2026-10-24. This is the route coverage and implementation contract.

## Titles

Private routes use **Section | Owner**, with the identifying section first.
`businessTabTitle` normalizes whitespace/control characters and bounds Unicode
labels to 60 characters without splitting surrogate pairs. Private route names
come from `privateSectionTitle`; dashboard language changes update the same rule.
No title template is applied to public content headings.

| Surface | Routes | Title source | Indexing |
| --- | --- | --- | --- |
| Platform home | `/` | Sponsor.krd public brand | Public canonical |
| Business landing | `/` on selected business host | Home + business | Noindex, follow links |
| Business workspace | `/business`, `/business/pages`, `/business/forms`, `/business/templates`, `/business/tiktok-config`, `/business/settings`, `/business/profile` | Localized section + business; sign-in label before session exists | Noindex |
| Business entry | `/business/workspace-entry`, `/business/auth/consume`, `/business/getting-started` | Owner + entry/sign-in label; getting-started redirects to workspace | Noindex |
| Platform console | configured private console base and `businesses`, `linktrees`, `forms`, `templates`, `campaigns`, `access-control`, `communication-center`, `settings`, `billing` | Localized section + configured platform brand | Noindex |
| Platform login | configured private console `/login` | Sign in + platform | Noindex |
| Public Linktree | `/linktree/[uid]` and selected root slug rewrites | Authored SEO title or visible headline, bounded to 70 Unicode characters | Existing content/plan/status policy |
| Public Form | `/form/[slug]` | Public headline; never internal management name | Existing content/status policy |
| Analytics sharing | `/analytics-share/[id]` including access-code state | Shared analytics + owner; report contents stay protected | Noindex/noarchive |
| Signup entry | `/join` | Localized entry title + Sponsor.krd | Public entry |
| Signup application | `/join/application` | Localized application title + Sponsor.krd | Noindex |
| Legal documents | `/legal/privacy`, `/legal/terms` | Localized document title + Sponsor.krd | Existing canonical policy |
| Errors | not-found boundaries, `__root-not-found`, `__public-not-found`, `/status/unavailable` | Localized error/unavailable title + resolved owner | Noindex |

Drawers, tabs without routes and loading boundaries inherit their owning route.
Public Form private names/answers and analytics report answers never enter metadata.

## Icon selection and generation

`brandIcons` owns server metadata and `applyTabIcon` owns client synchronization.
An explicit uploaded favicon wins. Absent or legacy placeholder favicons use the
owner's actual logo. JPG/PNG uploads are served as real multi-resolution ICO files
through `/api/public/brand-icon?asset=...`; originals and database values remain
unchanged. Existing explicit ICO uploads are preserved. Business identity is never
replaced by the platform's mark. If no business image exists, a neutral business
ICO is necessary. Platform stock artwork has a generated ICO too.

`/favicon.ico` handles the browser's implicit request, using the same verified host
branding. Relative redirects preserve subdomains/custom domains behind proxies.
The manifest is owner-aware. Apple touch artwork remains a separate candidate,
so browsers cannot select a large avatar instead of the requested tab icon.
Client synchronization updates all tab icon candidates in place and clears obsolete
size hints. It never removes or reparents Next/React-owned metadata nodes, so route
transitions and component teardown retain valid DOM ownership.
The public Linktree renderer no longer rewrites icons after server rendering.

`requestBranding` is memoized within each render, not globally across owners.
Customer domain mappings come from the existing verified backend resolver.
Only public presentation fields are exposed by the platform-branding endpoint.

ICO generation reads only already-public uploaded files through StorageService.
Remote URLs, arbitrary paths, traversal and SVG conversion are rejected. Input is
bounded to 10 MB and 16 megapixels. Transparent contain resizing retains aspect
ratio. ICO frames are 16, 32, 48 and 64px. A bounded 128-entry, five-minute cache,
ETags, request limits and conditional responses limit repeated work. Only this
public icon response may use public caching through the API proxy; authenticated
and error responses keep private/no-store caching.

## Deployment and verification

Deploy frontend and backend together. No migration or existing-data rewrite is
required. Missing/deleted/corrupt original files and unavailable services cannot
be guaranteed to display a custom icon; a neutral identity is preferable to the
wrong business/platform image. The implicit icon redirect is never cached, while
derivatives can take up to five minutes to refresh when source URLs are reused.

Tests cover binary ICO directories/PNG frames, malformed sources, path boundaries,
conditional requests, custom favicon precedence, cross-host/custom-domain branding,
route naming in three languages, public metadata privacy and API proxy isolation.
The SEO HTTP fixture checks real HTML has one title and one tab icon candidate,
implicit favicon redirects stay on the tenant, the stock ICO is a valid binary,
and existing SEO/crawler/host/marketing boundaries still hold.

Dashboard installation uses separate scope-specific manifest links supplied by the Business and Platform layouts; public branding keeps the public manifest. Both dashboard manifests reuse the same owner-aware manifest builder and Apple standalone metadata. See the dashboard installation section in frontend.md for launch and session behavior.
