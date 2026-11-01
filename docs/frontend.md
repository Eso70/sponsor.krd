# Frontend

Business settings track Profile and Defaults independently. Saving one section
merges only that section's response, preserves other tabs and newer in-flight
edits, and updates server-managed identity/cooldown fields separately. Branding
uploads require both upload permission and the profile permission needed to
persist their URLs. Changed fields are never silently stripped from a save.

BusinessDashboard and PlatformLinktreesPage use `useLinktreeEditorWorkflow` for
edit loading/cancellation, create/close, save, approvals, status and archives.
Typed adapters provide list updates, localized messages and session handling;
there are no separate owner implementations of those lifecycles. Platform
General settings sends one validated transactional request for profile/branding.

Public Linktree business details show selected weekdays in Saturday–Friday
order, shared with both dashboard editors, regardless of the saved selection
order. Location summaries show country, city, then street/area, omitting missing
parts. Stored details and structured address fields are unchanged.

`/linktree` and `/form` are public directories, rendered by the shared
`PublicDirectoryRoute` and `PublicDirectory` components. Each host lists only its
own active, non-archived pages; the root domain lists the platform workspace,
not all businesses. Empty collections retain navigation and an explanatory empty
state. Cards open their canonical page in the same browser context, with no
prefetch that would record page views before a visitor opens a page. Pagination
uses 24 items and the shared TablePagination. Kurdish, Arabic and English use the
existing public language preferences and navigation/footer shell. Directories
are noindex/follow and contain no marketing tags. Bounded UTM parameters and
ttclid survive directory navigation and opening the destination.

Public directory grid cards reuse ManagementCard, PageListCardMedia,
PageListCardHeader, the saved collection banners, PageListDescription and
GridCardActionButton from the dashboards. Only public identity/media and the
same-tab destination links are rendered. Cards also show public link/question
counts, the default Linktree badge, a copyable URL and a decorative cover when
no banner is published. The content shows only the centered card grid (or its
empty state), with pagination when needed. There is no visible heading panel,
collection tabs, search box or summary counters; an accessible heading remains.
Tab titles are simply localized "Links" / "Forms". Directories hide the visible
business name in the hero and navigation; the logo retains its accessible label.
The footer and other public pages retain their existing branding.
Public cards opt into a 24rem maximum width, larger identity/description text,
larger logos and 44px minimum open actions through shared component size props.
Both collection types use content-driven card heights, purple open actions,
and bottom-aligned URL/action areas. Public descriptions wrap fully without line
clamping; cards in each row stretch to match its tallest content, and card widths
shrink to fit smaller viewports. No fixed or minimum card height is imposed.
Linktree cards preview up to five distinct published channels; forms show their
published language and required-question count. These are public content details,
not customer activity or response statistics. Each Linktree card includes a short
localized contact instruction above its URL, alongside any authored description.
Form cards retain their authored description or existing fallback copy.
Dashboard sizes remain the default.
ManagementGridLayout's opt-in centered layout
wraps bounded-width cards and centers incomplete rows; dashboard layouts keep
their joined grid. The directory content has a minimum height of 100svh, so even
one card or an empty collection keeps the footer below the first viewport.

Business Settings → Defaults includes **Use default Linktree as homepage**.
The switch uses the normal Save action and defaults to off. When enabled, the
business `/` renders the same `PublicLinktreeContent` as its current active,
non-archived default Linktree; the canonical `/linktree/<slug>` URL still works,
and the root address does not redirect. Missing or inaccessible defaults fall
back to BusinessLanding. Upstream failures retain an unavailable state.
Metadata keeps the Linktree canonical URL and the root document uses that page's
language/direction. Request-scoped loading shares data between layout, metadata
and body, including verified custom domains; the platform root is unchanged.
The switch is a business-only preference, separate from new-page appearance.
Marketing tracking remains disabled at `/` (see `tracking.md`).

The shared Form/Card editor has a required title above its tabs, independent of
the optional Introduction headline. The same field and live owner-scoped URL
availability feedback serve Business and Platform creation/editing. Title changes
warn before changing a public link. The analytics drawer's shared Export menu
offers CSV for all responses or an inclusive date range, using one response table
model. See [Forms](forms.md) for naming, concurrency and export safeguards.

Forms at `/business/forms` and the Platform console share `FormsManagementPage`,
the authenticated dashboard layout, six real stat cards and paginated management
grid/table views. The shared toolbar provides search, view switch and
Active/Archive controls through PageManagementSection and ManagementToolbar.
Page and Form collections show 15 records per page in both views; Linktrees use
the shared client pagination setting, while Forms use matching server offsets.
Grid card designs and page actions remain unchanged. Loading sections reuse the
same heading/toolbar/body layout.
Page management has no separate refresh action. The global header invokes the
shared dashboard-refresh coordinator, which refreshes shared identity/inbox data
and the currently mounted collection, including its statistics. Forms and
Linktrees register their current loaders in both dashboards; overlapping clicks
are deduplicated and the header remains busy until the requests settle. Search,
archive filter, view mode, current page and open editor drafts remain in place.
Linktree manual refresh passes the same busy state to statistics and both collection
views, matching Forms loading feedback on Business and Platform. Business refresh
waits for both list and summary requests to settle, including partial failures.
The Platform header refreshes its business directory only while that page is
active, and retains its server-route refresh for server-owned data. No browser
reload or system-wide cache clearing is performed.
Linktree collections replace the always-visible clear-all action with shared
PageSelection controls. Only selected IDs are sent to the existing per-page
analytics-clear endpoints (at most five concurrent requests). Business and
Platform adapters reload their real list and summary in a finally block so
partial failures never zero unrelated totals; selections remain for retry.
Business selection requires the per-Linktree analytics-clear permission.
The Active tab includes non-archived Active and Paused forms; Archive is a separate collection flag, never a status. Owner-scoped
APIs persist definitions and uploads; public `/form/<slug>` pages collect real
responses through the same Form/Card renderers. Editor previews remain temporary.
`FormsPageSkeleton` delegates to the shared SkeletonPageManagement, with Form
statistic slots, and PageCollectionSkeleton renders static cards through the
server-safe ManagementGridLayout. Forms and Linktrees share collection skeletons
and the StatCard loading prop, including responsive frames and selection slots.
The interactive ManagementGrid delegates to that same layout after resolving its
pagination and render callbacks on the client. Loading routes never pass
getItemKey/renderItem callbacks across the React Server Component boundary.
Grid/table use shared Linktree action-button styles with Analytics before Edit,
followed by Share analytics, Delete and Open. Pause/Activate, Archive/Restore and Duplicate live
in the saved-form edit drawer footer through shared EditorPageActions, with no
redundant three-dot list control. Duplicate uses the existing scoped endpoint
and requires create permission; mutations require update permission. Lifecycle
responses update only persisted metadata in the open draft, preserving edits and
revision safety. Form analytics uses the shared analytics drawer. Full definitions
load on edit; collection requests load summaries only.
Create/Save stays clickable for invalid drafts: clicking reveals localized inline
field errors and a footer summary; hovering/focusing the primary action previews
the requirements. Selecting a summary item opens the correct tab/accordion and
focuses the field. The shared Form/Card editor validates before uploads or saves,
preserves draft rules, clears resolved errors as fields change, and distinguishes
save failures from loading failures. Authorization/session/rate-limit/conflict and
image-size failures use safe localized messages beside the save actions.
Shared, theme-aware skeletons reserve space for six statistics, the selected
grid/table, response history and editor/preview drawers while requests settle.
Closing a loading drawer prevents a late response from reopening it. Public form
navigation uses a route skeleton; placeholders reuse the shared reduced-motion
pulse and expose localized loading status without focusable fake controls.
See [Forms](forms.md) for lifecycle, API, tracking, privacy and verification.

`features/forms` owns the typed draft model, validation, layout chooser, and preview
renderer. Form layout has Content and Final page tabs; there is no Settings tab.
Content uses compact accordion sections with Banner and Introduction fixed
at the top. Questions and added components share a draggable content order,
followed by fixed Privacy. The preview uses the same order. Only one primary
section is expanded at a time, with Questions open initially. New forms start with
optional Name then required Phone number fields; existing drafts retain their configured questions. Inputs reuse shared editor labels and modal fields,
with localized placeholders and optional-field hints. Card layout uses the same
builder shell, question controls, privacy, final-page editor and preference controls.
Its Content tab contains Welcome page, Questions and Privacy accordions.

Questions use a compact purpose field with a placeholder, a Custom section with its
Add menu, and a separated Personal Information list with a second
Add menu. Both lists reuse FormQuestionEditorRow for collapsible editing, visible
row deletion, numbering and keyboard reorder actions. Grouping does not change the
draft's question order or conditional-question validation.
Short-answer rows include the question field and an optional 210-character
description. New blank custom rows open for editing automatically. Descriptions
are preserved as authored text and shown beneath the question in the preview,
with an accessible description association on the answer input.
Multiple-choice rows also offer an optional description. Each answer has adjacent
add/remove controls and an optional local image tile with full-image viewing.
Answer images follow the existing raster upload limits and show alongside the radio
choice in the preview, with image viewing separate from answer selection. Image
arrays remain aligned when answers are inserted/removed and are cloned on duplicate.
Expanded multiple-choice headers omit repeated question text; the editable field
remains the single authoring entry. Business locator is not offered in the menu.
Editor labels use 13â€“14px text and 40px fields, with clearer grouping and spacing.
The four content accordions retain numbered headers without helper descriptions.
The Purpose statement keeps its input placeholder without a helper paragraph;
Final page opens directly with its fields. Keep these authoring changes
separate from the compact customer-facing preview's typography and controls.

Banner uses shared Image/Carousel segmented tabs and matching square upload tiles:
one tile for Image, five for Carousel. Click an empty add tile to upload, click an
image to replace it, or use its remove action. There is no crop control. Upload
limits and decoding checks apply to both layouts. The banner retains an enabled toggle.
Preview and public carousels use small pagination dots instead of side chevrons,
with shared sliding transitions and a three-second banner interval in editor previews. Published banners advance only on dots or swipes, keeping the first contentful image stable during loading. Sliding
respects reduced-motion preferences.
Clicking a banner opens the validated image uncropped in the shared ImagePreviewModal,
which reuses modal keyboard handling, close behavior, and focus restoration.
Introduction supports a logo, headline, optional description and slogan, with a
visibility switch for the logo only. Its shared image picker shows a compact logo
thumbnail and Update action, with guidance below, followed by the headline,
description and slogan fields.
New drafts begin with localized optional Name and required Phone number questions. Custom questions include
short answers, choices and
conditions based on earlier multiple-choice answers. Image questions and appointment
questions are not offered in the custom Add menu. Personal Date of birth remains
available. Reordering or deleting
a source question clears invalid dependent conditions. Personal-information choices
are ordered as Contact (phone, email, address, country, city, province/state, ZIP),
User (first name, last name, name, birth date, age), and Work (company, job title,
work email, work phone). Demographics and National ID are not offered. Birth uses
the date control, and work email/phone reuse their corresponding input types.
Generated field labels follow the preview language through explicit localization keys.
Custom and Personal Information use identical shared Add buttons and portaled
popovers above their triggers. Opening them does not expand the drawer body;
the menu is viewport-bounded, with internal scrolling only when space is limited.
Privacy uses automatic Sponsor.krd policy links and configurable consent. Additional components include text, image, carousel, product benefits,
testimonials, steps, about and FAQ. Final page supports a headline, description,
optional website/app/content links, and cursor appearance.

The live preview fills the remaining drawer-body height alongside the editor on
desktop, with native internal scrolling for overflow and fixed preference controls.
The editor scrolls independently; the preview stays on the physical right in RTL
and LTR. Narrow screens stack a bounded preview below the editor. Preview controls,
fields, headings and spacing use compact sizing. Its language, theme and color controls
stay above the scrolling content; the localized Send button and final-page actions
stay in the preview footer. Send remains associated with the question form for
native required-field/email/consent validation. The introduction is centered, the
banner is slightly taller, and shared visibility switches replace section checkboxes.
Preview preference controls
change preview labels without changing authored text or global preferences.
Appearance and color are saved with the form; preview language is independent. Generated question, privacy-link and action labels carry
explicit localization keys, so switching preview language translates those defaults
alongside placeholders, consent, buttons and final-page fallbacks. Editing one of
those labels clears its key and preserves the authored text, even if it matches a
default. Preview preference button labels also follow the selected preview language.
Media is local, decoded raster data only (JPEG/PNG/WebP,
5 MB and 40 million pixels per image, at most five images per media group).
Unsafe URLs and invalid question dependencies block save requests with inline errors; preview links
allow only credential-free HTTP(S). No remote image fetch occurs. Saving uploads validated raster assets to owner-scoped storage.

New forms start with a layout chooser inside the existing drawer: select Form
(all questions on one page) or Card (custom questions on individual cards and personal fields together), then press Next to
open the second step. Back returns to the chooser without discarding draft
data. Its footer uses shared compact Back and Create/Save actions without Cancel.
The editor requires a separate internal Form title above the content tabs. It controls
the dashboard name and URL, with shared inline availability checks for creation and editing.
The optional Introduction headline is independent: changing it never changes the internal
name or URL. Both public layouts omit empty introduction headings and never substitute
the internal title; browser/share metadata uses public content with a generic localized fallback.
Invalid links show inline errors and block save requests; incomplete drafts in both layouts may be saved privately to the server.
Existing valid drafts retain their data when
changing layout and saving. Editing and previewing saved forms bypass the initial
creation step.

Ready status publishes a server-validated form; legal URLs are generated from the platform origin.
Preview consent is in the fixed footer with Send, explicitly associated with the
question form for native validation. It starts checked in the editor preview and unchecked on a live public form
and uses the shared CheckboxField's filled check style; clearing it still blocks
submission while consent is required. Restarting the preview restores that default.
An enabled introduction logo overlaps the
banner boundary by half its height; without a banner it stays inside the introduction.
The logo is circular. Without the banner it uses the shared Linktree template
avatar size (112px, matching Spectrum); the overlapping banner logo remains 40px.
Clicking the logo opens the
same shared uncropped image viewer as the banner. The slogan uses a subtle tinted
background and border derived from the independent preview palette.
The introduction is always shown; its accordion only collapses the editing fields,
and the banner and logo retain their independent visibility controls.
A locally scoped preview palette, including input, focus,
placeholder, checkbox and button colors, follows only the preview appearance;
dashboard light/dark changes do not affect it. Its selectors explicitly outrank
the broad dashboard input/background overrides, including their important rules.
Saved language controls preview labels while business-authored text stays unchanged
when the dashboard language changes.

## Public-page SEO

The shared Linktree editor offers an optional blue verification badge in basic
information. It is off by default and appears beside the name in every template,
including previews. Business and platform editors share an icon-only toggle
beside the name input: grey when off and blue when on, with a localized
accessible name and pressed state. The
strict boolean `template_config.verification_badge` stores this presentation
choice; no database migration is needed. It is a page-owner display option,
not verification by Facebook, Instagram, or Sponsor.krd.

Templates use React's standard memo comparison, including all incoming props.
Public renderers preserve saved names, descriptions and WhatsApp titles,
subtitles, questions and outgoing messages in their original language,
including values matching application defaults. Locale changes only affect
application controls and fallbacks for missing content; an explicitly empty
question list remains empty.
Partial custom comparisons must not hide appearance or link callback changes.
Platform edits preserve subtitle colors through the shared Linktree service.

Business homepages show the shared hero and site chrome without a published
Linktree gallery or page list in their navigation/footer. The homepage fetches
only business branding; published page URLs and their sitemap entries remain
available independently.

Public Linktrees use request-scoped server reads, validated tenant canonicals,
full metadata, safe JSON-LD, generated share images, and host-aware robots and
paginated sitemaps. Search titles, descriptions, sharing previews, indexing,
and content language are derived automatically from page content; both
dashboard editors omit manual SEO controls. See [SEO architecture and operations](seo.md)
and [the implementation plan](seo-implementation-plan.md).

## Sponsor.krd Rise branding

Brand assets live together in `frontend/public/images/brand/`. The original
`02-rise.svg` has moved there as `rise-original.svg` and supplies Sponsor.krd's
Rise geometry. One transparent
`/images/brand/rise.svg` is used for the platform logo and administrator avatar.
Its center bar follows the app's light/dark theme through the embedding image's
color scheme; the surrounding component supplies the background. Shared branding
constants supply platform chrome and powered-by footers. The separate opaque
logo and transparent-mark PNGs are removed. `rise.png`, `rise-favicon-white.png`,
`rise-apple.png`, and `rise-icon-192.png` are transparent raster exports of the
same artwork for metadata and native icon compatibility, not independent logos.
Browser tabs use `rise-favicon-white.png` with the original white center pillar
in every theme. This distinct URL avoids reusing the earlier dark-center icon
from browser caches. The on-page SVG still adapts its center bar to the app theme.
Customer logos, avatars, favicons, and neutral placeholders remain separate.

The shared authentication preview's right-side logo tile always uses the dark
primary surface (`#161b22`), independently of the surrounding page theme. It
uses `rise-original.svg` so its center pillar stays white and its
cyan/pink colors stay original on sign-in and sign-up screens. A soft white
outer ring frames the dark tile in both themes.
Tenant authentication continues to display the tenant's own logo in that tile.

Platform Settings exposes one logo uploader. The backend derives the avatar
and browser favicon from that logo on reads and writes; neither has a separate
upload control. Apply `2026-10-02_unify_platform_logo.sql` through the normal
migration workflow to unify persisted platform assets. Legacy logo/mark URLs are
normalized on reads. Uploaded logos still use the existing validated PNG/JPEG
boundary; this change does not enable arbitrary SVG uploads.

The retired `Logo.jpg`, `sponsor-krd-logo-mark.png`, and `favicon.ico` public
files are removed. Deployments must remove those files on the server too;
copying new files over an existing public directory is insufficient. Rebuild
Next.js and purge any reverse-proxy/CDN copies of the retired assets and their
`/_next/image` variants. Run the normal migration workflow to apply
`2026-10-02_replace_platform_branding.sql`, which replaces saved platform
branding without touching customer branding. Existing known legacy platform
paths are also normalized on read, including old environment defaults.

After deployment, verify the old URLs return 404, verify the homepage's icon
and social metadata, and request homepage indexing through Google Search
Console. Use its Removals tool for any old image URLs still appearing in
search. Google controls recrawl timing; local code cannot immediately purge
Google's index or copies hosted by other websites. Do not block the old URLs
in robots.txt, because crawlers must see their removal.

The shared Linktree editor reuses one solid-color picker for subtitle and
footer-button colors. Footer color is saved per page in
`template_config.footer_button_color` and rendered by the shared footer in all
templates. Clearing it restores the template's default footer color; it does
not change subtitle or signal colors. Only valid solid colors reach footer CSS.

System language buttons reuse `components/shared/LanguageToggle`, showing the
active EN/AR/KU code with one style across root/tenant home pages, authentication,
sign-up, business/platform dashboards and onboarding dialogs. Thin feature adapters
retain cookie/account persistence and permission boundaries. Platform sign-in uses
`PlatformLanguageSelector preAuth` to update the visitor cookie without calling a
protected preference API. Authentication handoff also retains a locale control.

Public `/linktree/*` pages do not show a visitor language toggle. Saved page
text and link labels are rendered unchanged; built-in interface labels and
fallback descriptions use Kurdish, independent of visitor language cookies.

Business Settings > New page defaults configures starting values for new
ordinary Linktree pages only. It does not manage the business default page;
that page is edited through Pages. A separate card in the same tab can create
the business default page if it is missing, using system defaults rather than
the starting settings above. Saving any existing page, including the
business default page, never changes these starting values.

The shared Linktree editor allows business and platform administrators to edit
the page slug. Format errors and unavailable slugs appear inline. Availability
checks use the surface's scoped endpoint and exclude the current page during
editing; changing the slug updates its public URL on save.

The Campaigns navigation entry uses the same management composition as the
Platform business directory: a shared six-card performance summary, page
header actions, search and status filters, a two-column grid, the shared
management table with mobile cards, and create/details/delete dialogs. Business
Management and Campaigns both render card collections through the shared
`ManagementGrid`, while their domain-specific card bodies remain separate.
Campaign
cards and rows include a
mock video creative preview plus objective, destination, audience, budget,
spend, impressions, clicks, CTR, conversions, and derived cost per conversion.
All campaign mutations remain
browser-local mock state until the backend campaign domain is implemented. The
campaign-specific UI places its shared grid or table directly in the main
management surface without another surrounding card. Each campaign uses simple
dividers instead of nested metric cards, restrained creative colors, and quiet
interaction states while retaining the shared Platform dashboard
header, statistics, table, modal, and navigation patterns. The cards derive
their totals from that current mock collection. The campaign analytics detail
modal keeps the shared management-modal shell but
uses a campaign-specific, flat layout: the creative and campaign identity lead,
six outcome and cost metrics are separated by dividers, conversion rate is
derived from clicks and conversions, and configuration remains a compact
description list. It does not introduce nested metric cards.
Campaign creation reuses the Linktree editor's `ManagementModal`, numbered
`ModalWizardProgress`, wizard actions, `EditorField`, and modal input styles.
Its frontend-only three-step flow uses one unified name for the campaign, ad
group, and ad, then covers the Reach, Video Views, Website Lead, and Sales
objectives; optimization and maximize-delivery bidding; budget and schedule;
audience and placement; destination, video code, ad text, and call to action;
and optional interactive add-ons with create-new and choose-existing modes.
The optimization goal uses the shared `CustomSelect`. Website Lead and Sales
also show a website-only data-connection panel whose connection and event fields
reuse `CustomSelect`; that panel is absent for Reach and Video Views.
TikTok Ads account
configuration remains available in Platform
Settings. Business dashboards expose neither
feature; `/business/campaigns` and the former `/business/campains` alias are
removed. Business TikTok Pixel, Events API, and delivery settings remain in
place. The shared TikTok Pixel editor disables group deletion when only one
group remains. Every active group is used for automatic public Linktree
tracking; none is designated primary. The Ads OAuth callback
requires a verified platform-admin session and
returns to the configured platform console's Settings > TikTok Ads tab.

## Public marketing tracking

`components/analytics/PublicRouteTracking.tsx` is the central positive
allowlist for fixed public routes. It resolves the canonical server identity,
reports through `createPageTracker`, and mounts the shared TikTok loader.
Tracking starts automatically on allowlisted public pages. Linktree renderers
keep their specialized action tracking but use the same
dispatch primitives. Individual landing and join components
must not call TikTok directly.

## Private business onboarding

Custom-domain management is exclusive to the platform business directory. Its
globe action opens the reusable domain-management panel with shared compact
tables, modal inputs and footer controls. Business Settings has no domain tab.
Pending/disconnected statuses refresh automatically while the panel is visible,
with cancellation on close or tenant changes. The DNS dialog prioritizes a current request failure over a
previous ownership failure, and reports temporary server DNS lookup failures
explicitly. Verified primary origins drive public routing, canonicals, sitemap
and share images; dashboard authentication also uses the selected hostname.
See [Custom domains](custom-domains.md).

Selected domain routing and canonical origins share `resolvePublicOrigin`.
The default address remains canonical until a custom domain is HTTPS-ready and
primary. The inactive address returns an uncached 404 for public, dashboard and
API routes without redirects. Removing the domain immediately restores the
default address. Domain deletion places the shared
confirmation above management dialogs and retains the parent dialog on cancel.

Platform Settings > Blocked subdomains lists permanent system reservations and
database-backed custom blocks. Administrators can add or remove custom blocks;
an assigned business name or a name reserved by an active application cannot
be blocked. This platform-only policy editor is a standalone component.
It reuses the shared ManagementTable in compact mode with subdomain, type, and action columns,
pagination, loading skeletons, and mobile cards. The header Add button opens
the shared ManagementModal with SettingsField, ModalTextInput (including its
reusable domain-suffix option), and ModalFooterActions.
Manual blocks can be deleted; permanent system reservations display a disabled
delete action and a lock indicator. Failed additions keep the modal open with
inline feedback. Refresh and individual removals show their own progress.

The signup subdomain field checks the backend after a 350 ms debounce and
shows checking, available, blocked, taken, invalid, or connection-error feedback
inline in Kurdish, Arabic, or English. Requests are cancelled on input changes
and stale responses cannot replace the current result. Availability reflects
business ownership, active application reservations, and custom/system blocks;
wildcard DNS resolution is not an availability test. The server remains the
authority when the application is saved, submitted, or approved.

`/join?token=...` validates an administrator-issued, one-time 24-hour invitation before showing
Google authentication. `/join/application` additionally requires HttpOnly
signup-session cookie and is blocked by proxy otherwise. Both routes use
private no-store caching and `noindex, nofollow, noarchive`. The invitation's
expiry timestamp is not displayed on the signup screen, but an expired token
still resolves to the dedicated expired-invitation error state. The compact,
single-page application requires only business name, phone, and an available
editable subdomain. Submission records the current terms/privacy versions and
acceptance time on the server after the user follows the legal notice. Country,
city, social-profile URLs, and brand uploads are not part of the application.
Validation appears beside the affected field and
entered values remain available after recoverable failures. Signup request
payloads are built explicitly from backend DTO fields; never spread UI-only
form state into a strict API request. Platform administrator selects plan during
review. Tenant `/business/workspace-entry` is the sole business sign-in route
and offers Google and a six-digit email code for
approved active business members. The root-domain platform login and the
invite signup page offer the same Google or email-code choice, with the email
option verifying identity before it creates a platform/application session.
`/business/auth/consume` exchanges the single-use handoff while rendering only
a loading state; invalid or expired handoffs return automatically to the tenant
login without exposing a stale retry screen. Tenant login loads the public business name, logo, favicon, and website color before
applying the shared authentication design; the tenant color reaches the page's text selection through the
same document-level theme variables used by the public pages. Tenant-free shells (platform admin login, invite signup, signup
wizard) mark their surface with `data-sponsor-krd-theme` instead, so text selection and brand utilities resolve to the
Sponsor.krd cyan-to-red brand treatment everywhere on the auth sheet. Handoff consumption is guarded against duplicate React
effects, uses an eight-second client/proxy deadline, and performs a hard
dashboard navigation after the session cookie is stored. Initial dashboard
session, access-manifest, and page requests run concurrently.
Newly approved businesses enter the real dashboard with its entire surface
marked inert behind a non-dismissible required form. The single setup screen
uses the same
stacked brand asset control and grouped fields as business management: optional
brand assets and Sponsor.krd default color, editable name and phone, read-only
assigned subdomain, and plan-limited TikTok Pixel/Events API configuration.
System page defaults are applied automatically rather than presented as a
separate step. It also shows the verified owner account name and email as
read-only identity fields. The legacy `/business/getting-started` URL only
redirects to `/business`; onboarding never uses a separate authentication page.

## Platform-administrator impersonation

The platform business directory exposes an "open dashboard" action on every
active business that has a subdomain, in both the table and grid views. It is a
button, not a link: it posts to the impersonation endpoint and navigates to the
single-use URL that comes back. `PlatformAdminDashboard` opens the target tab
synchronously on the click and assigns its location once the response lands,
because a `window.open` issued after an `await` is treated as an unrequested
popup and blocked. The returned URL is single-use and short-lived; it must
never be stored, logged, or shared.

While such a session is active, the business dashboard layout renders
`BusinessImpersonationBanner` above `BusinessDashboard`. The banner is
deliberately non-dismissible, names both the business and the administrator,
and owns the exit action, which performs a full navigation rather than a router
push because the session cookie is cleared server-side. Its presence is driven
by the `impersonation` object on `GET /api/auth/session` â€” never by a client
flag. See
[docs/security.md](security.md#platform-administrator-impersonation).

## Large feature composition

Business and platform dashboard route transitions use the shared
`SkeletonDashboardShell`. It reserves the desktop sidebar, responsive header,
and initial content surface while server data or a route bundle resolves. Keep
route-level dashboard loading states on this shared shell. There is no global
root loading fallback: navigation must not show an unrelated homepage composition.
Routes without a matching loading boundary wait for their actual content.

Authentication routes use the shared `SkeletonAuthenticationPage` boundary so
navigation reserves the real split-screen authentication layout in both light
and dark mode. Link validation and secure handoff exchange use the shared
compact `LoadingState`; predictable forms and data surfaces continue to use
layout-matched skeletons. Platform-impersonated business sessions keep a
permanent amber security banner whose dark surface and exit action have explicit
contrast rather than inheriting a tenant or platform accent.

The loaded dashboards also share `DashboardSidebar` and `DashboardHeader`.
Each permission domain supplies its own navigation, notification inbox, refresh
operation, branding, and account actions, while the shared components own the
responsive sidebar, collapse behavior, global header controls, active states,
and profile-menu presentation. Do not recreate dashboard chrome inside a
feature entry point.

The Business dashboard publishes the tenant's effective website color at the
document boundary. Text selection, the custom cursor,
portalled dialogs, and shared accent controls therefore
use the tenant color on every Business route. The Templates catalogue is the
deliberate exception: it establishes a Sponsor.krd theme boundary so template
artwork and catalogue controls are not repainted by the current tenant.

Both dashboards render notifications through the communications feature's
shared inbox hook and `NotificationBell`. The unread badge, responsive
dropdown, loading and empty states, read/delete/read-all/delete-all behavior,
keyboard dismissal, and notification detail modal are one implementation.
Selecting a notification marks it read and opens the modal before any optional
navigation. Business and platform adapters provide only their authenticated
endpoint and safe action-route resolver. Platform pending-approval cards are a
permission-specific extension inside the same dropdown and are never exposed
to business users.

Google profile images continue through `next/image`; the optimizer allowlist is
restricted to HTTPS `lh3.googleusercontent.com` OpenID avatar paths (`/a/**`
and `/a-/**`) rather than permitting arbitrary remote Google content.

Large pages and templates compose focused modules rather than owning every
data lifecycle and renderer inline.
Business dashboard analytics totals are loaded and normalized by
`useBusinessAnalyticsTotals`; the dashboard consumes the hook and remains
responsible for page composition and cross-feature coordination. Cached
domain responses are validated before feature hooks consume them. A legacy
or malformed Linktree-list cache entry is discarded and refetched instead of
reaching dashboard sorting or rendering code.

Add new dashboard network lifecycles as feature hooks. Do not place new
independent persistence,
fetching, or rendering systems directly in the large entry components.

## Request and state boundaries

JSON API transport is owned by `frontend/src/lib/api/request.ts`. It applies
same-origin credentials and no-store defaults, serializes explicit `json`
bodies, unwraps the standard backend envelope, converts normalized failures to
`ApiRequestError`, and preserves `AbortError` for effect cleanup. Safe GET and
HEAD requests retry short-lived network, 502, 503, and 504 failures with a
small bounded backoff; mutations are never retried automatically. Feature code
must not duplicate response parsing or error-envelope extraction.

Domain endpoints belong in feature API modules such as `features/business/api`,
`features/communications/api`, and `features/platform-admin/api`. React hooks
own loading, refresh, cancellation, and local presentation state; components
compose those hooks and domain operations. The local-storage cache delegates
network transport to the same request primitive and caches the unwrapped domain
value. Direct `fetch` remains appropriate only where the `Response` itself is
required, such as streamed downloads, upload progress/raw multipart handling,
the Next.js proxy, or calls to third-party services.

Do not introduce a global state library without a concrete state lifecycle
that cannot be represented by server rendering, a feature hook, or a focused
context.

## Motion architecture

The frontend uses the current Motion for React package through `motion/react`
as its single authored-motion runtime. `AppMotionProvider` owns the application
default easing, duration, and operating-system reduced-motion preference. Do
not add the legacy `framer-motion` package alongside `motion`, nest another
page-level `MotionConfig`, or create project-owned CSS keyframes.

Prefer the shared primitives in `components/motion/MotionPrimitives.tsx` for
spinners, pulses, status pings, shines, fades, and reveals. Use the shared
`components/ui/marquee.tsx` for measured continuous rails. A feature may use
`motion` directly when it owns a distinct interaction or visual sequence, but
it must still inherit the application provider and honor reduced motion.

CSS transitions remain appropriate for immediate visual state feedback such
as color, border, shadow, filter, and focus changes. Entrance and exit
sequences, continuous movement, loading motion, measured movement, and
multi-step transforms belong to Motion. Do not use Tailwind `animate-*`
utilities, inline `animation` declarations, injected keyframe styles, or
manual DOM animation loops for these behaviors.

Next.js 16 (App Router) / React 19. See
[docs/architecture.md](architecture.md#frontend-boundaries) for feature and
component ownership and the enforced ESLint boundaries between business and
platform-administration UI. This file covers the implemented product surface,
routing, and frontend commands.

## Public platform and business pages

The tenant homepage uses the shared public navbar, footer, theme, and visitor language controls. Published Linktrees and Forms keep their shared renderers and tracking.

- The root domain renders the Sponsor.krd landing page.
- Published platform announcements can appear as root-domain banners or
  feature cards.
- Each active business owns one unique subdomain.
- A business subdomain homepage has a Sorani Kurdish project-focused hero with mobile template
  mockups and no action button. When public Linktrees exist, one section lists those
  published pages. The navbar link leads to that section only when it is
  present. Each card opens the published
  Linktree route by SEO name or UID and uses its stored image and subtitle.
  The mockups preview template designs; only the gallery represents published
  tenant pages. No helper workspace or tabs appear on the homepage. The shared
  tenant navbar, contact action, theme behavior,
  and public footer remain available.
- The public homepage loading state reserves the hero mockups and Linktree gallery
  footprints. The gallery is omitted when the business has no published pages.
- Business and root pages share `PublicSiteNavbar`. The business variant keeps
  tenant branding, theme control, its configured contact action, and the
  published-page anchor. Compact viewports use its dismissible menu; the
  business navbar gains a restrained glass surface after scrolling.
- Template previews elsewhere in the product use the shared `PhoneMockup`
  instead of drawing device frames inside feature components.
- Public linktrees render at `/linktree/:uid`. The same route also resolves a
  linktree by its SEO name.
- On the configured root domain (including `www`), `/linktree/:uid` resolves
  only a Sponsor.krd-owned platform Linktree. On a business subdomain the same
  path remains strictly tenant-scoped. Host resolution chooses two explicit
  backend endpoints; an empty subdomain is never treated as an implicit
  business lookup. Root-owned pages keep first-party analytics but mount no
  TikTok base code or client pixel.
- Linktrees support branding, an avatar, a subtitle tagline under the name, a
  longer description helper text, configurable footer, WhatsApp questions,
  ordered links, TikTok tracking, and six selectable Linktree templates.
- A custom colour is stored as `gradient:<direction>:<from>:<to>` and rendered
  only through `parseWebsiteColor`, which owns the nine-direction table and
  emits explicit `0%`/`100%` stops so the two colours split the surface evenly.
  Surfaces must not keep a local direction map: one in `BackgroundColorPicker`
  covered four of the nine and emitted invalid CSS for the rest. A template's
  own `from`/`via`/`to` recipe cannot express a direction, so
  `getBackgroundGradient` also returns the parsed `backgroundCss` and
  `templateBackgroundStyle` prefers it â€” without that, every custom gradient
  rendered as the template's hardcoded diagonal and changing the direction
  repainted nothing.
- The hex field in `ColorGradientModal` holds an uncommitted draft string and
  commits to the colour only once the draft is a whole hex. Parsing every
  keystroke instead made the field unusable: `#`, `#0`, and `#00` all fail to
  parse, so each one reverted to the previous colour and a colour could only be
  replaced by pasting it complete. Any control that sets a whole colour â€”
  presets, sliders, eyedropper, switching between the two gradient stops â€”
  clears the draft, and blurring restores the committed value.
- A linktree background is either a colour or an uploaded image. The image tile
  sits beside the custom-colour swatch in `BackgroundColorPicker`, and the two
  are exclusive: uploading replaces the colour surface, and picking any colour
  clears the image. The URL lives in `template_config.background_image` because
  `linktrees.background_color` is `varchar(50)` and cannot hold an upload path;
  the colour stays stored so text, accents, and borders keep deriving from it.
  Only same-origin `/images/upload/` paths are painted:
  `lib/templates/background-image.ts` validates on read, and both the linktree
  and public services strip anything else, so an owner cannot point public
  visitors at a third-party host. Templates receive it as
  `TemplateTheme.backgroundImage` and apply it through the shared
  `templateBackgroundStyle`, since each template paints its own full-bleed
  surface over the page background. That helper also veils the photo in the
  direction `deriveTextColor` already chose, so an arbitrary image cannot leave
  the page's text unreadable.
- A background pattern can be drawn over that surface, whichever surface it
  turned out to be â€” gradient, solid colour or uploaded image. The catalogue and
  the SVG renderer live in `lib/templates/background-pattern.tsx`, and the
  picker in `components/shared/BackgroundPatternModal`; the linktree editor and
  all Linktree editing surfaces open the same modal. The
  choice lives in `template_config.background_pattern`, validated on read by
  `readBackgroundPattern` and stripped server-side by
  `common/linktree-background-pattern.ts` when it is outside the catalogue.
  Templates receive it as `TemplateTheme.backgroundPattern`;
  `TemplateViewportLayout` paints it once under the content, so all five
  templates inherit it without each drawing its own. It is `fixed` on a public
  page and `absolute` in a preview, so the texture stays put while the page
  scrolls.
- Each Linktree card and table row shows its own lifetime unique viewers and
  unique clickers, served by `GET /linktrees`. The table's traffic column is
  gated on one table-level flag rather than per row, so a row without totals
  cannot shear the column out of line with its header.
- Public Linktree buttons use the shared `TemplateLinkLabel` in every template:
  the editable title stays primary, the English platform name stays secondary,
  and a quieter separate label follows it on the same secondary row with the
  saved phone number, account username, or email address when available. Phone
  identities use local display form without the country code and normalize to
  one leading zero.
  Older links fall back to extracting the same identity from their destination
  URL.
- Approved public marketing routes load a business's TikTok pixel and report
  through `createPageTracker`
  (`features/analytics/page-tracking.ts`). Adding tracking to anything on
  a published Linktree or form follows [docs/tracking.md](tracking.md); mounting the pixel on an
  unapproved surface fails `components/analytics/pixel-placement.spec.ts`.
- Why-choose-us items use a rotating accessible color palette for their icon
  badges, with translucent fills that remain visible in light and dark modes.
- The public services/products section uses prominent two-column showcase
  cards with large imagery, numbered overlays, stronger depth, and larger
  content/actions. Each card keeps the shared neutral surface while its text,
  icons, number, and price use a distinct content accent; action buttons retain
  their configured platform/brand color. Service images open in the shared
  keyboard- and touch-friendly image viewer; compact dashboard previews retain
  their horizontal rail.
- `branch-signal` is the Ultra-only premium Branch Signal Linktree template. It
  supports the complete shared solid, gradient, custom-gradient, uploaded-image,
  and pattern background system. Text contrast follows that background, while
  signal paths, avatar rings, nodes, borders, hover light, and the footer accent
  follow the saved subtitle color, falling back to the tenant website color. Its asymmetric dark cards use only the
  stored link title, description, platform icon, URL, and default message;
  share/theme/header controls are not invented inside the template. The shared
  phone supplies preview-only device chrome.
- The templates page catalogues Linktree templates only and carries no category
  tabs; the business subdomain landing page lists Linktrees alone.
- Appointment cards can open a business's public Calendly, Cal.com, Google
  Calendar, or custom HTTPS booking page, or start a WhatsApp conversation.
  Sponsor.krd stores the appointment details and click analytics; availability,
  confirmation, cancellation, and reminders remain with the selected
  provider.
- Team members can include a photo, role, experience, biography, and an
  optional link, phone, or WhatsApp action.
- Certificates can include an image, issuer, year, description, and optional
  HTTPS verification link.
- Videos play inline through public YouTube, TikTok, Instagram, Facebook,
  Vimeo, Dailymotion, Streamable, and Loom embeds, or through direct HTTPS
  MP4, WebM, and Ogg files. Unknown HTTPS pages remain external links.
  Partner logos can link to their brands and render in a continuously
  looping, pause-on-hover marquee.
- Before-and-after sections support up to 12 titled image pairs, optional
  descriptions and custom labels, and a comparison slider controlled by
  touch, mouse, or keyboard.
- Languages support up to 30 entries, each with an optional supporting
  detail.
- Payment methods support up to 32 entries with built-in neutral icons for
  common Iraqi providers and general methods, optional account instructions,
  and an optional uploaded provider logo.
- Special offers support up to 20 promotions with prices, coupon codes,
  expiry dates, images, and optional HTTPS destinations.
- Events and workshops support up to 20 dated entries with a location,
  image, description, and optional HTTPS registration link.
- Audio and podcasts support up to 20 direct audio files or public Spotify,
  SoundCloud, Apple, YouTube, and other HTTPS episode links.
- Why Choose Us supports up to 20 short advantages with selectable built-in
  icons and supporting descriptions.
- Impact stats support up to 20 entries, each with a value, an optional
  suffix, a label, and a selectable built-in icon.
- The process/how-it-works timeline supports up to 20 steps, each with a
  title, description, selectable built-in icon, and an optional action link.
- Documents and Downloads supports up to 24 externally hosted HTTPS files
  with titles, descriptions, file types, and display sizes.
- Owned Brands & Pages supports up to 20 properties with an ownership or
  leadership relationship, type, logo, description, official HTTPS link,
  optional founding year, and optional featured public content. Facebook
  Pages, public Facebook posts, public Instagram posts and reels, YouTube
  videos, playlists, and channel uploads use official embeds when their
  platforms allow them; every entry retains a reliable official-link card as
  a fallback.
- Education supports up to 20 rÃ©sumÃ©-style entries with an institution,
  degree or qualification, field of study, location, current or completed
  status, start and end years, grade, description, institution logo, and
  optional HTTPS verification link. Current study automatically displays
  `Present`.
- Work experience supports up to 20 entries with a title, organization,
  employment type, location, start and end dates, current/completed status,
  description, image, and optional HTTPS verification link.
- Pricing supports up to 6 plans with up to 20 features each, a price,
  billing period, one featured/recommended tier, and a call-to-action;
  missing features are automatically shown as gaps relative to the richest
  plan.
- Locations support exact pins or approximate-radius display, multiple
  branches, contact details, images, and map links.
  - Public pages are server rendered with business-scoped metadata and return
    a themed not-found page when the business or page cannot be resolved.
  - All error-page markup and styling lives in the single shared
    `components/error-pages/ErrorPage.tsx` component. Page-level 403, 404, 410,
    500, 502, 503, and 504 states replace the homepage content while retaining the
    real public navbar and footer. The error-content region fills the small viewport,
    keeping the footer below the initial fold until the visitor scrolls. All
    three scopes â€” Sponsor.krd root, business subdomain, and platform console â€”
    render through one `PublicMarketingSiteShell`, so the page frame, the
    32-pixel grid backdrop, the hero accent atmosphere, spacing, typography,
    buttons, and light/dark surfaces are identical everywhere. Scope differences
    are branding only, supplied through the typed `ErrorPageTheme` adapter:
    business pages pass the current business color, favicon, logo, and name;
    root and console pages pass Sponsor.krd's own accent and logo. Navigation and
    footer content follow the same adapter â€” business errors keep the tenant
    navigation and footer, root errors keep the Sponsor.krd marketing footer with
    signup and login actions, and console errors keep Sponsor.krd branding without
    account actions. `ErrorPage.tsx` must not grow a second layout branch per
    scope. The platform route-level 403, 404, 500, 502, 503, and 504 states all use
    this shared presentation. Every error-page home action points
    to `/` on the current host; error pages never link to a dashboard or login.
    Authorization failures use 403 only when the authenticated user may safely
    know the page exists. Concealed private routes and cross-tenant resources
    continue to use 404. Public Linktree URLs return 410 only
    when a tenant-scoped deletion tombstone proves that the content previously
    existed and was permanently removed; unknown URLs remain 404. A 429 response
    uses the same large presentation as 500
    inside the active page region; on login it replaces the full right-side
    form panel while preserving the left branding panel rather than replacing
    the whole page. A 502 response means a critical upstream service returned an
    invalid response. It replaces public tenant or dashboard content, and on
    login it replaces the form-side panel; optional integrations keep a local
    error. A 503 response represents a temporary maintenance or
    upstream-service outage and includes a retry action that reloads the current
    page. Critical 503 and network failures replace public tenant content and
    business or platform dashboard content with that shared page. On business
    and platform-administrator login screens, the 503 state replaces the full
    form-side panel while retaining the branding panel. Optional requests such
    as branding, analytics, and secondary feature data keep a local fallback and
    must not turn the whole screen into a 503 page. A 504 response means a
    critical upstream request exceeded its deadline and uses the same placement
    rules and retry behavior as 502. The frontend API proxy returns 504 when its
    30-second backend deadline aborts a request; other connection failures remain 503.
    Recoverable request failures (400, 409, 413, 415, and 422) do not replace
    the page. They render through the shared
    `components/shared/InlineRequestError.tsx` alert inside the affected form,
    dialog, or upload area so entered data remains available for correction.
    Upload selectors validate size and declared media type before sending, while
    the backend remains authoritative and validates the actual file signature.
    Next.js `error.tsx`, `global-error.tsx`, and `not-found.tsx` files remain
    thin required route boundaries with no visual implementation. Platform
    administration owns `error.tsx` and `not-found.tsx` under its console
    segment so a console failure keeps platform branding instead of falling
    through to the root marketing pages; both delegate to the same shared
    component.


## Business dashboard

### Business dashboard language

The authenticated business dashboard has a member-owned `ckb`/`ar`/`en` language
preference. The dashboard layout reads it from the business session response and
mounts `BusinessLocaleProvider` around business content only. The header uses a
single cycling button that shows the destination language code (AR, EN, or KU) and
remains available on mobile. A change updates client text at once,
persists through `PATCH /api/auth/preferred-locale`, and rolls back with feedback
if the request fails. The control is hidden for impersonated or legacy sessions
without a member identity. The public business application form lets the
applicant choose their initial dashboard language (English for a new account).
The application form opens with blank business name, phone, and subdomain fields,
including when reopening an older draft or reapplying after a deleted business;
the saved dashboard language remains selected. Typing a business name does not
fill the subdomain automatically.
Business Settings â†’ Defaults exposes the same member-owned preference as a
dropdown; changes there or in the header save immediately and stay in sync.
If an approved business is later deleted, its old signup session shows that a
new administrator invitation is needed instead of offering an unusable form.
This is not a business-wide or public-page language setting. The Business dashboard
stays LTR in all three languages; the Business subtree carries the selected
`lang` for assistive technology.
The selected language is also mirrored to a host-only, non-sensitive
`business_dashboard_locale` cookie. It is a UI hint only, never an
authentication or authorization input. The pre-sign-in Business workspace,
handoff loading state, and dashboard error pages use it before a member
session can be read. The sign-in screen has its own AR/EN/KU toggle that changes
only this cookie; successful dashboard changes still persist to the member
profile through the API. A fresh browser defaults to Kurdish. Shared
authentication and error components receive optional Business copy, leaving
Platform and root-domain defaults unchanged.

The required first-time Business setup modal also uses the saved dashboard
locale for its fields, validation, brand asset controls, color picker, verified
owner identity, and TikTok group editor. Shared controls retain their existing
Kurdish defaults on other surfaces.

The Business Templates catalogue uses the same typed-copy boundary: summary,
search, preview captions, sample contact links, and locked-template labels
switch with the Business locale. The Platform catalogue uses the same shared
Arabic or English copy when its administrator selects that language, while
keeping Kurdish as its default. Template product names and stable IDs are not translated.

### Platform administrator language

The platform console has its own administrator-owned `ckb`/`ar`/`en` preference,
independent of business members. The header's AR/EN/KU cycling button displays the next
language, immediately switches the console shell and localized page copy,
and persists through guarded `PATCH /api/platform/auth/preferred-locale`.
The profile response restores the saved preference on sign-in; a host-only
`platform_dashboard_locale` cookie prevents a Kurdish flash while it loads.
On failure, the control restores the previous language and reports an error.
Platform controls use localized fallback text when an API supplies an
untranslated failure message; the original API details remain available in
Kurdish mode.
The console keeps its existing LTR layout. The translated Businesses page now
includes navigation, dashboard summary, directory grid/table and badges,
search, delete confirmation, the applications cards and rejection dialog,
the invitation wizard, business analytics, business editing, and session
management. The shared edit fields, brand controls, color picker, TikTok
settings, session panel, and loading announcements receive platform-specific
copy without changing their Business integrations. The Platform Linktrees page
also supplies Arabic and English labels to the shared manager, grid/table, search, editor,
duplication and analytics drawers, plus its platform-specific
empty states, confirmations, loading announcements, and action feedback. The
Arabic copy shared with Business lives in `features/link-editor/shared-arabic-copy.ts`;
the shared English dashboard catalogue lives in `features/shared/i18n/english-messages.ts`.
Surface-specific copy remains in each adapter. The Platform Templates page passes
Arabic copy or the shared English catalogue to the templates, including its
search dialog and sample phone preview. The Platform Campaigns catalogue and
its grid/table, creation wizard, details, performance metrics, and action
confirmations use the administrator language. The campaign editor's English-source
fields, choices, and helper text also have Kurdish equivalents instead of falling
back to English. Campaign names and other saved
campaign content remain unmodified. The Access Control page and its permission table,
descriptions, profile actions, editor/view/delete dialogs, and policy simulator
also respond to the platform language. Known permission categories and displayed
descriptions use the selected language; internal permission keys, action codes,
and administrator-authored profile names remain unchanged. Billing's plan and business
subscription views, status badges, filters, search, details, and plan editor
also use the platform language, including date formatting in every supported
locale; stored plan names and descriptions are not
rewritten when the language changes. New plan description presets follow the
selected language. The Communications center translates its overview,
announcement catalogue, message thread, publishing editor, status filters,
empty-table descriptions, and confirmation dialogs while leaving administrator-authored messages
untouched. Conversation-category labels are shared with the Business messages
panel and follow the selected language. Announcement history and message timestamps use the selected locale
instead of the browser default. Platform Settings translates general branding, security sessions,
data retention, media policy, cleanup confirmations, and the TikTok Pixel and
ad-account panels. Its general, upload, and security-session feedback and
accessibility labels also use Kurdish in Kurdish mode rather than English source text.
The platform notification bell, approval review actions,
and sign-in and console error screens also follow the saved language. The
administrator email-code sign-in controls have Kurdish, Arabic, and English
copy instead of relying on the shared form's English defaults. The
console and sign-in loading announcements follow that cookie as well. The
announcement editor's shared date picker receives an Arabic or English calendar locale
without changing its ISO values. The shared TikTok Pixel
editor receives the common Arabic or English copy through its typed adapter;
the shared TikTok ad-account modal accepts a translation callback so other
surfaces keep their own defaults.
The shared notification bell's loading announcement follows either dashboard's
selected language. Platform search and copy-value controls receive localized
action, success, failure, and accessibility labels.
Shared stat-card loading announcements and the Platform Linktree list fallback
also follow the selected language. The management-table fallback accepts the
surface's translated no-results label.
The reusable time picker accepts an explicit Kurdish, Arabic, or English locale
for its labels, validation message, and popover controls.

The authenticated business dashboard is available at `/business` on the
business's own subdomain. It provides:

There is no separate overview screen. `/business` is the address the login
handoff and the onboarding flow send people to, and it redirects to
`/business/pages`, the Linktree management screen and the first sidebar entry.
Every console section therefore keeps exactly one canonical URL. An
unrecognised `/business/*` segment also resolves to Linktree management rather
than to a placeholder screen.

Its sidebar footer uses the tenant's effective subscription as its source of
truth, shows an upgrade action only below the highest plan, and keeps support
available in both expanded and collapsed layouts. The navigation region scrolls
independently on shorter screens so the account controls remain reachable.

Dashboard metrics use the shared `components/shared/StatCard.tsx` component.
It has one Linktree-inspired horizontal presentation across dashboard pages,
settings, analytics drawers and shared reports. `StatCardFrame` owns the card,
icon, value, caption and action geometry for both ready and pending content;
`stat-card-styles` owns the shared color tokens. Color, optional icon, compact
sizing, descriptions, actions, and loading announcement remain configurable.
The old funnel/live/comparison/story presentations are removed. Loading replaces
all slots (including captions and actions) with noninteractive shared skeletons,
without fake zero values or data-dependent text. Known metric colors and caption
context are reserved by Forms and page analytics skeletons. `StatCardGrid` owns
spacing and column breakpoints in both states: two columns below desktop, with
an explicit one-column option for a single statistic. Long text truncates with
shared keyboard/hover tooltips; caption context stays beside the label.
Initial fetches show skeletons; existing values remain visible on background
refresh. Campaign collections also wait for their local persisted data before
showing totals. Settings use an unavailable value for data not yet requested,
rather than presenting false zero counts or inactive states.
Linktree initial data, lazy page bundles, grids, tables, edit
forms, and analytics content use the matching shared skeleton composition.
Per-page analytics, Event Tracking, TikTok configuration, Settings,
sessions, business messages, and communication inboxes follow the same rule:
their initial placeholders preserve metrics, tabs, headers, and the expected
chart, table, form, or list body instead of showing only a spinner or leaving
the rest of the page blank.
The business Templates route uses a catalog-specific skeleton while template
permissions load, including its metrics, header actions, catalog cards, and
phone preview footprints. The shared skeleton contract covers responsive
management tables and cards, page management, settings, TikTok,
business directories, analytics modals, editor
forms, and communication lists. A route shell and an embedded content fallback
are kept distinct when the surrounding header or dashboard chrome is already
mounted. Linktree previews render lazily.
Public-page cards use the stable Sponsor.krd fixture and the real public mobile
composition inside a scrollable shared phone. Preview interactions are
disabled, and the preview canvas forces mobile grids even when the surrounding
dashboard is wide enough to match desktop media queries.
Background refreshes preserve the existing content, while saves, uploads,
destructive actions, and other explicit operations retain compact progress
feedback instead of hiding their surrounding context.
The business dashboard header refresh control coordinates one in-place refresh
of shared business identity/access data, the notification inbox, and loaders
registered by the currently mounted page. It deduplicates overlapping clicks,
keeps the current route, filters, tabs, pagination, dialogs, and visible
content in place, and reports partial failures without performing a browser
reload. Editors and settings forms must not register a loader that replaces
unsaved local input; they may refresh only independent read-only data.
The platform header refresh also invokes the shared notification adapter, so
its communication inbox and permission-specific pending approvals refresh with
the rest of the platform dashboard rather than waiting for the next poll.
The shared Linktree manager exposes six metricsâ€”owned page count, views,
unique visitors, interactions, interaction rate, and conversions. Linktree
summaries use `pageType=linktree`; clearing analytics remains page-scoped.

- linktree creation, editing, deletion, publication status, default-page
  selection, slug checks, link ordering, link batch
  synchronization, image uploads, template selection, footer settings, and
  WhatsApp modal settings. The default page is pinned first, followed by pages
  ordered newest first in both grid and table views;
- template browsing subject to the business's plan;
- profile and branding management, including logo, favicon, default avatar,
  website color, business name, username, phone, and email;
- default linktree template, background, footer, and WhatsApp settings;
- TikTok Pixel and Events API configuration;
- active-session listing and revocation;
- per-page analytics in the Linktree analytics modal,
  including views, unique visitors, clicks, unique clickers, conversions,
  date filtering, and action performance. Clicked buttons that were later
  removed or replaced remain visible as historical rows, while unresolved
  clicks use a clearly labelled unattributed row so the breakdown does not
  silently omit recorded traffic;
- TikTok delivery health and retry controls;
- analytics deletion for one public page or the complete business;
- business notifications, announcement banners, and conversations with the
  platform administrator.

The shared Linktree editor accepts either a Telegram username or a private
channel invite (`https://t.me/+hash`, `t.me/+hash`, or `+hash`). Private invite
hashes retain their `+` and hyphens when saved and edited. Public link cards
do not present invite hashes as `@username`, and message-prefill parameters
are not appended to private invite URLs.

Dashboard navigation and backend actions are controlled by the business's
effective access manifest. Effective access combines capability rules,
subscription entitlements, field rules, approval requirements, and quotas â€”
see [docs/security.md](security.md#authorization).

Routes: `/business/pages`, `/business/tiktok-config`, `/business/templates`,
`/business/profile`, `/business/settings`. `/business` redirects to
`/business/pages`.

## Shared business and platform UI

Every component or workflow used by both the business and platform dashboards
has one shared implementation. Updating shared UI or behavior must update and
be verified on both surfaces. The route-level business and platform components
only adapt typed configuration such as API endpoints, ownership, public paths,
branding, analytics scope, and capabilities.

Platform Business Management and platform Linktree management share the same
dashboard surface, management-grid frame, card surface, table frame, responsive
breakpoints, pagination, and Sponsor.krd toolbar accents. Their record fields
and domain actions remain feature-specific.

Platform-admin-specific controls may differ only when an operation is
platform-exclusive or requires a platform-admin permission. Those controls are
injected or gated through an explicit capability boundary; permission-specific
actions must not fork the shared editor, manager, modal, table, loading state,
or public renderer around them.

## Platform-administration console

The platform-administrator console is exposed only on the root domain through
the configured `PLATFORM_ADMIN_PATH`. A dynamic route validates that configured
segment directly; there is no physical public implementation route.

The console provides:

- platform-owned Linktree creation, editing, duplication, uploads, availability
  checks, archive/status controls, deletion, and root-domain previews.
  Business and Platform render one role-configured Linktree manager, including
  the same six summary cards, archive filter, grid/table views, search, editor,
  and analytics modal. Platform analytics include date ranges, conversions,
  and per-button click rows through platform-guarded endpoints; platform role
  configuration keeps root-domain URLs and excludes business-only client
  invitations and default-page behavior;
- business editing, deletion, session revocation, profile-change request review,
  asset uploads, TikTok configuration, Linktree import/export, and full-business
  backup import/export. Business Management exposes icon-only import and export
  controls together in its header. Export creates one portable collection for
  every business, while import accepts either that collection or an individual
  business backup; both use the same transfer helper and feedback behavior as
  the analytics modal's Linktree backup;
- global linktree template availability and configuration;
- a permission catalog, permission profiles, field-level rules, approval
  rules, explicit denies, and access simulation;
- typed entitlements, subscription products, plan configuration, template
  access, permission assignment, business subscriptions, usage counters, and
  approval review;
- announcements for all businesses, selected plans, or selected businesses,
  with business-bell, dashboard-banner, and public-homepage channels;
- encrypted administrator/business support conversations and notifications;
- administrator profile, branding, sessions, platform statistics,
  Redis cache clearing, upload policy, unused-media cleanup, data-retention
  policy, and manual retention runs.

The billing implementation is an internal access, plan, subscription, and
quota system. It does not collect money. There is no payment-provider
checkout, payment-method management, invoice generation, refund processing,
or payment reconciliation.

The Business dashboard's Plans & subscription modal currently shows only a
localized Coming soon message and its close control. It does not load billing
data or expose the unfinished comparison, usage or management controls. Platform
plan administration and existing subscription/access enforcement remain active.

Routes (mounted beneath the private console path): `/`, `/businesses`,
`/linktrees`, `/templates`, `/campaigns`, `/access-control`, `/billing`,
`/communication-center`, `/settings`.

## Routing and tenancy

Assume `ROOT_DOMAIN=example.com` and a business subdomain of `acme`.

| URL                                                 | Result                                       |
| --------------------------------------------------- | -------------------------------------------- |
| `https://example.com/`                              | Platform landing page                        |
| `https://example.com/<PLATFORM_ADMIN_PATH>`         | Platform console                             |
| `https://www.example.com/`                          | Treated as root domain                       |
| `https://example.com/linktree/:uid`                 | Platform-owned Linktree                      |
| `https://acme.example.com/`                         | Business public landing page                 |
| `https://acme.example.com/linktree/:uid`            | Public linktree                              |
| `https://acme.example.com/login`                    | Tenant 404                                   |
| `https://acme.example.com/business/workspace-entry` | Business sign-in                             |
| `https://acme.example.com/business`                 | Dashboard with session; otherwise tenant 404 |

There are no compatibility redirects for the former tenant login paths.
Only the workspace-entry route and the single-use handoff consumer are public
under `/business`; every dashboard route without a business session is
rewritten to the tenant 404 page.

### Root marketing website

The root-domain marketing website uses the same public design system as the
business website through `PublicMarketingSiteShell`, `PublicSiteNavbar`, and
the shared marketing primitives. Sponsor.krd provides only branding,
navigation, authentication actions, and marketing content; it must not fork
those shared primitives.

The `/` homepage is deliberately limited to the shared Sponsor.krd navbar, one
viewport-height hero, and the shared Sponsor.krd footer. The hero positions
Sponsor.krd as the secure SaaS
connection layer for TikTok advertising accounts, states that the platform
administrator connection is isolated, and describes direct business-account
connections as a future capability. The homepage renders no communications,
product preview, or secondary content sections.

The root homepage is the only public marketing route. Its shared navbar is
brand-only; Business authentication remains a tenant subdomain concern and is
not linked from the root-domain website. The terms and privacy routes remain
as compliance documents required by active onboarding flows; they are not
marketing pages.

Root-domain visitors can cycle between Sorani Kurdish (`ckb`, the default),
Arabic (`ar`), and English (`en`) without changing page direction. The host-only
`sponsor_public_locale` cookie is a presentation preference, not an identity or
authorization signal; it is separate from both `platform_dashboard_locale`
and `business_public_locale`. It carries through the homepage, invitation and
signup flow, legal documents, platform-owned public Linktrees, metadata,
loading states, and root error pages. User-authored Linktree content and
administrator-provided review reasons remain in their authored language.
Invitation, signup, and administrator sign-in routes also expose localized
browser metadata instead of inheriting the generic English site description.
The Arabic and English legal text mirrors the existing Kurdish policy and requires normal
legal review before publication of any substantive policy change.

Homepage content is authored in the dedicated root hero. Do not invent prices,
customer counts, testimonials, endorsements, or other claims.

The frontend proxy:

- derives the subdomain from the `Host` header;
- checks business subdomains against the backend;
- attaches `x-subdomain` to internal requests;
- blocks `/business` on the root domain;
- blocks the private platform path on business subdomains;
- checks the platform-administrator session before serving the configured
  private console path;
- submits non-API page telemetry in the background;
- generates a fresh CSP nonce per rendered request, supplies the policy to
  Next.js through the request headers, and returns the identical policy to the
  browser so framework scripts receive the nonce automatically;
- rejects authenticated browser mutations whose `Origin`/`Referer` does not
  match the effective request origin (see
  [docs/security.md](security.md#csrf--origin-protection)).

Caddy removes inbound client `x-subdomain` headers before proxying. Business
services still scope owned records by the authenticated business ID.

## Commands

| Command                             | Action                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev:fe`                       | Start the frontend development server on port `3011` with Webpack (the stable fallback for local route compilation) |
| `pnpm build:fe`                     | Generate `frontend/.env` from allowlisted root/process values, then build                                           |
| `pnpm --filter frontend dev`        | Sync frontend environment values and run Next.js on port `3011`                                                     |
| `pnpm --filter frontend build`      | Sync frontend environment values and create a production build                                                      |
| `pnpm --filter frontend start`      | Run the production build on port `3011`                                                                             |
| `pnpm --filter frontend lint`       | Run ESLint                                                                                                          |
| `pnpm --filter frontend lint:fix`   | Run ESLint and apply fixes                                                                                          |
| `pnpm --filter frontend type-check` | Run TypeScript without emitting files                                                                               |
| `pnpm --filter frontend test`       | Run the Vitest suite once                                                                                           |

Default local address: `http://localhost:3011`. For subdomain routing in
development, use a wildcard localhost domain such as `http://acme.lvh.me:3011`
and include every browser origin, including its port, in `CORS_ORIGIN`. Add
local hostnames used for device testing to `ALLOWED_DEV_ORIGINS`.

Conditional-answer questions use an in-memory CSV matrix: UTF-8 headers are the ordered questions and each complete row is a valid cascading answer path. The shared editor provides a sample download, inline format guidance, and bounded import (256 KB, 2â€“5 columns, 1,000 paths, 200 characters per cell). Blank rows are ignored and duplicate paths are collapsed. Malformed replacements preserve the previous matrix. The preview filters choices by every preceding answer and clears descendants when a parent changes; native required selects validate completion. Imported text stays in its authored language and renders as text only. Matrices are independently cloned with drafts; ready forms require a valid imported matrix. No file or response is sent to a server.

Question Add menus are action menus: they have no placeholder option and no initial selection. Required/Optional is a shared compact two-state badge button inside the trailing edge of question inputs (inside the upload control row for CSV conditional questions). Required uses the theme fill and readable theme ink; Optional uses a bordered neutral surface. It uses aria-pressed and reserved logical-end input padding to keep text clear in LTR and RTL layouts. Interactive adornments use an EditorField div wrapper so buttons are not nested in labels. Conditional import uses a simple guidance card, aligned download/upload controls, and collapsible localized format help in Kurdish, Arabic, and English. Imported titles/answers remain authored text. Question headers use the shared pointer/touch reorder handle beside QN, with Up/Down keys for keyboard access. Drag targets do not add a colored outline or ring. Reordering is scoped to Custom or Personal information and preserves question IDs; a move that would put a dependent question before its source is rejected with a localized status message instead of deleting its logic.

### Automatic form privacy

The shared Forms editor no longer accepts manual privacy URLs, company fields,
custom disclaimers, or additional policy links. `FormPrivacyHelp` places an interactive question-mark beside the acknowledgement
checkbox in the fixed preview footer on the last question step. Its shared
`HoverPopover` opens on hover, keyboard focus, or tap and contains a localized
preview privacy summary plus `FormPolicyLinks`. Links remain available through
the help button if the acknowledgement checkbox is hidden;
the shared visibility switch controls only that checkbox. Existing preview
behaviour (checked initially, required when shown) is preserved and is not a
marketing opt-in or a persisted consent record.

Legal URLs use the configured platform application origin, never a business
subdomain/custom browser host. `?lang=ckb|ar|en` selects the same document
language as the preview; invalid queries fall back to the root cookie. The
legal shell renders English LTR and Kurdish/Arabic RTL. Draft readiness no
longer needs a manually entered policy URL.

Privacy and Terms revision 2026-10-10 describe saved forms, responses and first-party analytics,
business/advertiser responsibility, separate marketing opt-ins, and TikTok
tracking placement. Platform documents do not substitute for a business's
privacy notice for real response collection. Native TikTok forms
and lead delivery are not integrated. Revision constants match the backend's
acceptance records; existing signup drafts must accept the new revision.
The public privacy contact supplied by the owner is
esma3ildilshad04x@gmail.com. Forms use owner-scoped APIs and the shared first-party tracker.

Sources for the disclosure boundaries:

- https://ads.tiktok.com/resources/help/article/explaining-privacy-practices-to-lead-generation-ads-users
- docs/tracking.md

Privacy help keeps the preview palette in light/dark dashboard themes. Its links
remain reachable when moving from the trigger to the popup; Escape and outside
press dismiss it without submitting the form or closing the editor.

### Final-page actions

The shared Forms final-page editor has headline/description inputs, a CTA
visibility switch, collapsible typed action cards, and an upward-opening Add
Button action menu. Each type (Website, Install app, View content) can be added
once; existing types are disabled in the menu. Cards reuse the shared pointer
and keyboard reorder handle; collapse preserves their draft values. Existing
legacy action URLs still render.

Website actions use one URL. App actions expose App Store and Google Play URLs;
ready forms need at least one. The preview prefers Google Play on Android and
App Store elsewhere, falling back to the available URL. Content actions choose
PDF or image and open the supplied public URL in a new tab; the editor does not
fetch, upload, or inspect remote files. All non-empty URLs reject unsupported
protocols and credentials. Drafts can remain incomplete; enabled final actions
must be complete for local Ready status. The independent preview palette owns
the success icon and footer. The Show animated tapping hand preference controls a decorative shared
AnimatedTapHint on final CTA buttons (including unfinished editor placeholders).
It does not change the mouse cursor. The hint cannot intercept clicks, is hidden
from assistive technology, and remains static for reduced-motion preferences.

New form drafts start with a localized View Website action (blank URL until the
owner supplies a destination). Deleting it is respected; existing drafts are
not silently repopulated. The final success icon, headline and description
are centered together within the remaining body space between banner and fixed
footer. Both tabs render the same 144px banner through FormMediaPreview; the
banner never shrinks when the final body uses a flex layout. Long content
continues to scroll inside the preview.

The preview toolbar has equal-width Language, Theme and Color controls. Color
opens the shared ColorGradientModal in its optional anchored popup variant,
without a backdrop. It offers the same solid, HEX/RGB/HSL, preset, eyedropper and
gradient-direction controls as the existing modal; Apply commits the preview
color, while Escape, outside click or Close discard pending edits. The popup
stays within the viewport, scrolls internally when needed and restores focus.
Preview color remains local to the builder and does not change the dashboard
accent or saved draft. Validated solid/gradient values supply preview-owned
accent, fill and readable-ink variables; both tabs use the same selected color.
AnimatedTapHint uses a neutral pointing-hand icon and a continuous 1.8-second tap without fading,
with a static reduced-motion fallback and no pointer interception.

The anchored color picker is up to 400px wide and 540px tall, with compact
preview/direction controls and internal overflow on smaller screens. Both the
popup and modal use ColorSwatch: swatches fill their complete bounds with the
actual color and indicate selection with contrasting checkmarks, without
inheriting a dashboard accent fill. Solid/gradient previews set one background
property so changing modes cannot retain an old gradient image.

RGB/HSL editing uses shared ColorChannelsEditor and ColorChannelSlider controls
in both picker variants. Tracks show channel-specific color ranges with native
keyboard/touch input, readable handles, localized labels and degree/percentage
units. Number fields allow clearing/typing without resetting the color; blur
clamps finite values and restores empty entries. HSL edits retain hue and
saturation through achromatic colors and avoid repeated HEX rounding between
slider adjustments. Switching gradient stops remounts the channel editor.

All shared color-picker modals and anchored popups offer a single compact row
of the same rainbow presets as the Linktree first-step background picker,
including cyan and pink, with its dark shade replaced by pure black, plus pure white.
The palette has one source in `lib/utils/color-palettes.ts`. Custom HEX/RGB/HSL values and captured colors remain
available. Preset swatches are 24px squares and shrink to fit narrow viewports.

Add component uses FormComponentPicker and the shared CustomSelect icon-grid
variant. Eight localized cards appear in a four-column popup (two on narrow
screens): Text, Image, Carousel, Product details & benefits, Testimonials, Steps,
About us and FAQ. The popup inherits the editor theme, stays inside the viewport,
opens above when space below is limited, and closes after selection or dismissal.
Adding retains the existing block model and 20-component limit.

The Add component trigger spans the editor section. Its grid popup aligns with
the trigger and has a small connecting caret, with a short entrance from the
button edge. Placement above/below changes the animation origin and caret side;
reduced-motion preferences disable the animation. Internal overflow remains
bounded without clipping the caret.

Added form components reuse FormEditorSection headers and open after creation.
Only Questions and added components have section drag handles; Banner, Introduction,
and Privacy remain fixed. Individual questions still reorder within their own group.
Duplicated drafts remap the shared content order to the new component identifiers.

Added component headers include a visible localized Delete button beside the
collapse control, available while expanded or collapsed. Deletion removes the
component from both editor and preview order while preserving questions and answers.

Text components use FormTextComponentEditor: a compact toolbar for block-wide
bold, italic, underline, three heading sizes, alignment, and an anchored shared
solid-color picker. Top/bottom spacing uses the shared native sliders (0â€“80 px).
Formatting is stored as typed textStyle data and rendered with escaped plain text,
never authored HTML. Automatic color inherits the independent preview appearance.

Image components use the component variant of FormImagePicker: a 112 px
contained thumbnail, side Update action, and localized format/size guidance.
They have no title field or crop tool and retain the shared JPEG/PNG/WebP, 5 MB
raster validation and image replacement/removal behavior.

Carousel components share the image-only thumbnail editor with multiple uploads,
up to five images, per-image replacement and removal, and no crop tool.
Component Delete actions sit immediately before the collapse arrow and appear on
section hover or keyboard focus; touch devices keep them visible.

Image and Carousel images in the form preview open the shared full-image
viewer when clicked. Editor thumbnails only manage uploads; the component eye
action has been removed. Component deletion is icon-only with a localized accessible
name and tooltip, before the collapse arrow, retaining hover/focus/touch visibility.

Product details & benefits uses the shared FormImageSetEditor with a 30-character headline,
optional 50-character description, and two to five selectable product slots. Each
product pairs its validated local image with a 30-character headline and
100-character benefits text. FormImageSetPreview shows two cards side by side in
a horizontally scrollable row; clicking an image opens the shared full viewer.
Older drafts map their indexed images/items into product records before editing,
and duplication assigns independent product IDs. No crop tool is provided.

Testimonials reuse the same image-set editor/preview as product benefits, with
two to six customer records, 30/50-character section headline/description and
30/100-character customer headline/feedback. Image descriptions can be hidden
without losing authored data. The preview uses a two-column grid of circular
80 px images with click-to-open viewing; hidden descriptions are also omitted
from image viewer titles and accessible names. All built-in labels are localized.

Steps components use FormListEditor and FormListEditorRow, with a 30-character
headline, three initial step cards, and one to five authored steps. Step titles
have a 70-character counter; descriptions retain the 1,000-character limit.
Shared drag handles support pointer/touch and keyboard reordering within Steps,
independent of outer section ordering. FormListPreview follows the same order
with compact check icons using the preview accent and localized placeholders.

About us components use FormAboutEditor and FormAboutPreview with a 20-character
headline, optional image visibility, and a business description. Hiding the image
preserves the upload; visible preview images open the shared image viewer.
FAQ shares the Steps list editor and preview: three initial question/answer pairs,
one to five entries, 70-character question titles, and 1,000-character answers.
Dragging preserves each question/answer pair, and the preview shows every answer
with a question icon. All built-in labels support English, Arabic, and Kurdish.

Card layout uses FormCardContentEditor and FormCardPreview. Both layouts reuse
FormPreviewSurface for the isolated preview palette/device frame, FormPreviewHeader
for banner/carousel, circular avatar, centered introduction, slogan and completion,
and FormPreviewButton for primary navigation. FormIntroductionEditor shares logo,
headline/description/slogan controls, retaining the card's 50-character title limit
and optional time estimate (20 seconds per visible question, rounded up).
Card pages retain a full-screen decorative background through FormPreviewBackdrop,
with a clipped, rounded background image blurred by 12px and a white scrim in light appearance or black scrim in dark
appearance. The image itself is blurred so the effect cannot sample surrounding dashboard UI or spill beyond card corners. Welcome and final pages suppress the inline banner while retaining shared
branding typography and completion content; fields and buttons match the form layout.
Question cards show a visible neutral progress track, fixed Back/Next/Send controls
and internal scrolling. Contiguous personal fields share a card; an intervening
custom question starts a new personal group, preserving authored order and conditional
dependencies. Shared response state revalidates obsolete choice/CSV answers after
editor changes. Required questions without configured choices/CSV block advancing.
Native required/email/consent validation remains attached to the current question form.
Conditional visibility removes hidden cards; stable page IDs preserve navigation.
Both layouts also provide shared preview-only previous/next chevrons above the
frame, without numeric counters. Form layout browses content/final; card layout
browses welcome, visible question groups and final. Arrows allow reviewing incomplete
pages without submission, preserve responses and respect page boundaries. Editor tab
changes select the corresponding preview page; submit buttons retain validation.
Final footers disappear when no enabled, renderable actions remain.
The feature is still a local preview with no persistence, publishing or lead collection.

All preview phone questions, including contact and work phone, reuse the shared
PhoneNumberInput and compact CountrySelector with Iraq (+964) initially selected.
Each field owns an independent calling-code selection in preview state; card
navigation preserves that selection and the entered national number. Custom
country options reuse the canonical calling-code list with localized region
names, and remain inside the scoped light/dark preview palette. Required phone
validation stays on the number input, so selecting a code alone cannot complete
an empty required phone field. Final screens no longer include Start again.

Compact preview calling-code selectors show only the code in a content-sized trigger,
with the chevron immediately beside the code.
Their shared CustomSelect popup shows localized country names, supports prefix
search by country name or calling code, and opens directly when a user types on
the focused trigger. Arrow keys navigate results; Enter selects and Escape
closes. Portaled menus carry the preview appearance independently of dashboard
theme. Existing selectors opt into search explicitly.

Card question panels fit their content without stretching the input surface to
fill the device frame. Longer panels shrink and scroll within the available
space, with navigation kept at the bottom of the frame.

The form audit also verifies non-whitespace required short answers, nonnegative
integer ages, CSV upload callbacks that retain concurrent editor changes, and
completion guidance that matches available CTA destinations. Common dropdowns
participate in the modal keyboard stack, so Escape dismisses a menu before its
editor; arrows skip disabled options and focus returns to the trigger.

Both preview flows reset only their own scroll and move focus to the new preview
page after Start/Back/Next/Send. Editing or changing editor tabs does not move
keyboard focus away from the editor.

Form question conditions apply automatically when authored; the global Logic
settings switch and flag are removed. Questions default to Always show, with
condition source/answer controls available when an earlier choice question exists.
CSV conditional answers reuse CustomSelect with themed portal menus and no search field.
Changing an ancestor clears descendant answers; required CSV paths remain validated
before either layout advances. Multiple-choice editors reuse FormChoiceOptionsEditor:
image tiles precede answer text, delete stays beside each row, and one Add option
button appends to the list. Images stay aligned with text through deletion/addition;
renaming/deleting answers updates dependent conditions. Preview images also precede
answer labels and retain a separate full-image viewer.

## Campaign sample cleanup

The frontend campaign workspace starts empty rather than populating fabricated
campaigns and statistics. Previously cached built-in campaign IDs are excluded;
user-created local campaigns are retained. Connection and existing add-on IDs
are entered explicitly, without fictional account choices. This workspace remains
frontend-only; cleanup does not add a TikTok campaign synchronization backend.
Template preview data and automated test fixtures remain isolated from saved data.

## Shared Linktree editor drawer

The optional Banner section precedes Information and defaults off for existing
and new Linktrees. Forms and Linktree reuse EditorBannerControls,
EditorImagePicker, PublicImageGallery, and the inline crop workspace. Single-image
and carousel modes retain up to five images; Linktree accepts JPEG/PNG up to 5 MB.
The drawer preview and all six public templates share full-width banner rendering
through TemplateViewportLayout and TemplateBanner. Banners retain their image
proportions, with no card border or rounded frame. Public responses include owner-scoped banner dimensions from uploaded_media_assets; PublicImageDimensionsProvider supplies them to the shared gallery. The first image reserves the banner's aspect ratio before download, and carousel slides fit that stable frame without cropping. Legacy assets without stored dimensions retain the existing fallback until their inventory is repaired. Fullscreen image viewers are loaded on demand. TemplateHeader overlaps the
unchanged template logo halfway across the banner's bottom edge. Banner
and logo clicks open FullscreenImageViewer with navigation/zoom controls, while
explicit Update actions retain image replacement. With Banner disabled, no banner
markup or spacing is added. Preview image interactions are allowed without
navigation or tracking; public interactions use the shared page tracker.

Shared input helpers, ModalTextInput/ModalTextArea and CustomSelect all reuse
SHARED_CONTROL_CLASS for borderless surfaces and inherited light/dark appearance.
Form previews preserve those surfaces rather than restoring field borders.
Validation remains intact with inline messages and soft error fills.
Linktree and Forms reuse compact editor-control styles (40 px inputs, 80 px
textareas, 13 px field labels), EditorImageTile thumbnails and image actions.
Linktree profile/background uploads use the same 96 px square tile as form logos,
with neutral light/dark surfaces. Built-in platform marks keep their brand colors.
Information uses full-width fields in this order: Logo, Headline, Promotion
slogan and Description. Headline is also the page name; there is no separate
internal Title. Slogan and link-button color controls anchor the shared color
picker as a popup, matching the background picker without a modal backdrop.
The create/edit and duplicate editors reuse the Link slug field with owner-scoped
availability checks. New pages can retain automatic backend URL allocation.
Canonical writes use headline, slogan, slogan_color and logo, with optional
seo_name for explicit address changes. Platform choices use two mobile/three desktop columns.
Link destination errors reuse ModalTextInput.error and FieldInputError inside
the field, preserving values, aria-describedby and aria-errormessage. Save/blur
errors are revealed without an extra card banner; destination errors do not
color Button text. Shared field tokens increase contrast against editor cards
while retaining borderless styling.
Each link card groups its drag handle, platform name and actions in the header,
followed by the destination row with the platform icon, input and color picker
together in that order; country code stays beside its number. A full-width
Button text field sits below that row. Business and Platform drawers share this
layout. Icon selection uses the shared anchored popup positioning and outside
dismissal, retaining search, categories and image uploads without a backdrop.
Shared popup placement aligns with the trigger start edge, clamps to the owning
dialog and viewport horizontally, and prefers below when at least 320 px is
available; otherwise it opens above with a bounded scrollable height.
The icon popup reuses editor search inputs, image-action buttons and compact
close controls. A compact library dropdown replaces overflowing tabs above
a five-column icon grid with readable two-line names, with visible pressed states and a reduced-motion
aware 180 ms opening transition. Search blends into its parent surface without a
border or colored ring, including the global theme override; selected icons use a soft theme tint with
readable neutral text in both appearances. CountrySelector always delegates to the searchable CustomSelect popup; both
compact public phone fields and dashboard phone fields share its theme-aware
menu. Country and icon pickers reuse PickerPopupHeader and the same soft search
surface, popup corners and neutral option spacing. Compact country triggers avoid
legacy input styling so public Forms use this shared appearance too. Link color selection remains an anchored color popup, sharing the same surface
palette and header as icon/country pickers. HEX/RGB/HSL fields stay borderless on
focus; segmented controls use soft selected states and Apply is compact and
aligned right. Color popups align their end edge with the trigger so they extend
over the editor rather than the preview; Icon pickers keep start alignment.
Page design and Background pattern reuse PickerPopup and PickerOptionCard
for a matching three-column gallery, with readable captions and miniature
previews. Locked templates remain disabled; selection still saves the existing
identifier and closes.
Primary actions inherit the owning tenant solid/gradient accent and readable ink
across the portal. Actual preview colors and channel gradients remain unchanged.
Link cards use the shared Forms ReorderHandle for pointer/touch dragging,
auto-scroll and keyboard Up/Down ordering, with localized labels. A per-drawer
group isolates drop targets. GPS remains the separate final section. Grouped
link metadata carries global display_order so duplicate platform instances
retain their position in create, Business batch sync and Platform edits.
Their crop actions reuse EditorImageCropWorkspace and useEditorImageCrop inside
the existing drawer, preserving hidden draft controls and moving Confirm/Cancel
into its fixed footer. Both editors share the crop workspace skeleton. Linktree
crops encode PNG to remain compatible with its PNG/JPEG upload endpoints; Forms
retain WebP fallback. Initial Linktree loading reuses disabled EditorSection
headers with localized labels and placeholders matching the loaded field geometry.
The preview loading state uses the same fitted phone frame as the live preview.

Business and Platform Linktree creation/editing use one feature-owned
`features/link-editor/components/LinktreeEditorDrawer`. The old business modal
and re-export wrapper are removed. The shell uses the same ManagementDrawer as
Forms: fixed header/footer, contained desktop panes, mobile body scrolling,
shared motion/reduced-motion behavior, focus trap, Escape and focus restoration.
EditorPreviewLayout owns the responsive edit/preview pane geometry for both
Linktree and Forms. Linktree uses a single editor with Information, Platforms, Links and optional
WhatsApp questions accordion sections. It reuses EditorSection with Forms, opens
Information initially, and keeps collapsed draft controls mounted. Create/Save
validates the entire draft and opens the first invalid section; there are no
Next/Back actions, progress steps or synthetic Enter-to-advance behavior. Link
display names are edited directly; individual links have no language-toggle button. Changing the drawer language updates recognized built-in link names, the
default description and WhatsApp dialog/question/message defaults in the draft.
Explicitly edited fields (including edits back to a default), custom questions,
page names, URLs and phone numbers stay unchanged. The shared editor tracks
authored fields for the open draft; the preview and save use the same values. It retains
advisory headline availability checks, selected-link normalization, owner-specific upload
and save endpoints, business defaults and template entitlement boundaries.

The drawer stays mounted while edit data loads. Both owner adapters cancel
pending edit reads on close or replacement so late responses cannot replace a
new draft. Editor state is available immediately like the Forms editor; the
preview and selected template load lazily behind a local preview skeleton.
Memoized draft projections and useDeferredValue keep typing/validation responsive.
Preview content uses DynamicTemplate inside PhoneMockup/DeviceViewport and the
selected business default template (Spectrum fallback), rather than a second
renderer or sample contact data. Headline, logo, slogan, description, uploaded
background, patterns, badge, ordered links and custom icons/colors follow
the unsaved draft. Local raster backgrounds are preview-only; published image
validation still requires owner upload paths. Public and preview palettes share
createLinktreeTemplateTheme. Preview anchors and modified clicks
are contained, and preview interactions cannot submit the editor.
No tracker, pixel, submit or analytics endpoint is mounted by the preview.
The Linktree editor uses FittedPhoneMockup to fit the complete hardware frame
to the preview pane's width and remaining height using CSS container units.
Its aspect ratio stays intact, resizing needs no JavaScript measurement, and
long pages scroll inside the phone rather than clipping or scrolling the frame.
All six Linktree templates share viewport fitting through
TemplateViewportLayout/useTemplateViewportFit. Mobile top/main spacing is compact;
the natural content box scales only when necessary, down to 85%, after reserving
the measured, unscaled sponsor/legal footer. Very long pages remain scrollable.
The shared banner opts into PublicImageGallery's edge-to-edge mode: its image
window compensates horizontally for the template fit scale, while an outer box
retains the original image ratio and height. Images cover that window without
stretching; a small crop may be needed when fitting. Logo overlap and content
positions stay unchanged. Stored dimensions reserve the height before loading;
legacy banners use decoded image dimensions once available. Forms and other
gallery callers retain their existing sizing and contain behavior.
The footer is anchored absolutely to that page box, so ancestor containment
cannot move it to the app shell's bottom. The page height and fit use the owning
VisualViewport when available, follow browser-bar resizing and ignore pinch
zoom magnification. The app shell's large-viewport minimum is removed only while
a public Linktree owns it, preventing blank overflow below a fitted page.
Measurements use the owning window (the iframe for previews), observe content,
footer and viewport changes, and batch resize work in one animation frame.
The fit does not change authored values or reduce browser zoom settings.

WhatsApp questions use one native dialog for published pages and both dashboard
previews. The browser owns background inertness, Escape and focus return. On
opening, focus moves to the panel itself so the close button is not outlined
as an active keyboard control; tabbing still shows the shared focus indicator.
A plain dim backdrop replaces full-page blur. CSS transitions animate
only opacity/translation over 140ms on entrance and honor reduced motion.
Closing releases the native dialog and backdrop immediately, without retained
overlay/display exit transitions. Outside touch taps dismiss on touch release
rather than waiting for a compatibility click; the touch event is canceled to
prevent activation of links behind the dismissed panel. Dragging, scrolling,
canceled gestures and multitouch do not dismiss it. Long question
lists scroll inside the viewport-bounded panel. Scroll locks are reference
counted per owning document, so preview dialogs never lock the dashboard.
Stable media/sponsor callbacks keep chooser state changes from rerendering the
underlying template; existing question engagement and conversion tracking remain
on the shared tracker.

The questions section has its own Question theme control, reusing the existing
Light/Dark/Custom picker with solid colors only. It stores
`template_config.whatsapp_modal.backgroundColor`; legacy and new pages default
to white independently of the page background or dashboard appearance. The
panel derives readable text, button and hover colors from that saved surface.
Business and Platform share saving/loading and the same live preview. On mobile
the panel leaves at least 32px (or 5dvh/the safe-area inset, whichever is larger)
below it, with its maximum height adjusted to preserve internal scrolling.
When a question includes a valid video URL, the shared message formatter places
the URL first, followed by a blank line and the question message. Questions
without video keep their existing message unchanged.

Both owner adapters pass DashboardAppearanceControls and their existing language
selector into the Linktree drawer header, matching Forms. The controls change
the dashboard's existing appearance and locale preferences; they preserve the
open draft and expanded section and do not change the authored page palette.

Public Linktree templates no longer render the sponsorship footer or its
WhatsApp button. This applies to saved pages, the template catalog and editor
previews. The shared footer renderer, editor footer fields, validation and
outgoing footer payloads are removed, as are business page-default footer controls.
Legacy storage and response fields remain compatible with existing installations
and other business contact information; they cannot re-enable the removed block.

LinktreeEditorPreviewPanel places the page theme selector above the phone, using
the shared CustomSelect styling from Forms. Its Light, Dark and Custom options
combine the old background field into one control. Light writes `#ffffff`, Dark
writes `#161b22`, and Custom opens the shared ColorGradientModal picker used by
Forms, anchored above the preview without a backdrop. The color picker has an
optional Image tab using BackgroundImageUpload, which is also reused by the
existing compact background uploader. No preset swatch row is rendered below
the page-theme selector. Applying the Image tab retains the uploaded image;
applying a color replaces it. Selecting a preset clears the image override; returning to
Custom restores the last custom color in the open draft. Existing custom pages
open in Custom without being rewritten. The preview and save payload continue to
use `background_color` and the existing image configuration, with no new schema.
Page appearance remains separate from the dashboard's header theme toggle.
Page design, background pattern and theme live in one three-column preview row.
LinktreeDesignControls reuses TemplateSelector's entitlement checks and the
shared BackgroundPatternModal on both owner surfaces, passing anchors to open
compact popups instead of centered dialogs. All three pickers share
useAnchoredPopup for placement, theme inheritance and outside dismissal.
Selecting Custom again reopens its picker without adding a fourth button.
The choices remain
available across all editor sections, update the live preview, and save through the
existing template configuration. Loading placeholders follow the visible content fields;
no URL input or placeholder is rendered.

Linktree category controls follow Headline in BasicInfoStep. Both dashboard
surfaces reuse LinktreeCategoryFields and LinktreeSeoEditor, including optional
localized business details, indexing, language, sharing image and search preview.
Public details use TemplateHeader's shared media context across every template.
SEO settings remain draft state until Save; validation runs before image uploads.
Preferred page language controls public HTML language/direction and preview
direction independently of the dashboard's editing language. See [seo.md](seo.md).
## Linktree Information defaults and opening hours

The shared Business/Platform Linktree SEO editor displays automatic title and
description values derived from Information until a custom override is entered.
Automatic values stay derived instead of being saved as stale overrides. Clearing
an override or choosing Use Information restores automatic updates.

Business opening and closing hours reuse TimeInput with the shared anchored
PickerPopup. Display defaults to twelve-hour; localized 12h/24h buttons inside
each picker switch the field and hour choices without changing the selected time.
The 24-hour picker omits AM/PM, while persisted values remain HH:mm. The
optional fields support clearing, typed entry and keyboard selection; no native
time widget or database change is required.

Public business details and both dashboards' previews use the same opening-hours
component. Selected weekdays appear as wrapping chips in Saturday-first order,
above separately labeled opening and closing times. Public times use the same
12-hour AM/PM formatter as TimeInput, with isolated left-to-right time values in
all page languages; stored HH:mm values and weekday selections remain unchanged.

DateInput and DateTimeInput also reuse PickerPopup; standalone portal positioning
is removed. All date/time fields open through the full control and keep manual
typing available while open. Typing another datetime date retains its previously
selected time. Historical dates are allowed unless explicit min/max bounds reject
them. Other picker callers retain their existing focus behavior and sizing.

## Linktree analytics drawer

BusinessDashboard and PlatformLinktreesPage both lazy-load
`features/analytics/components/PageAnalyticsDrawer.tsx`, using ManagementDrawer
like Form insights. The same drawer skeleton, filters and content serve both
roles, with explicit data-source/capability props. Range controls are above the
metrics, with localized shared DateInput controls. PageEngagementOverview shows
active time, engagement, contact intent, confirmed outcomes/revenue, sources and
devices in English, Arabic and Kurdish. Unknown measurements display a dash.
See tracking.md for measurement, retention and server-confirmation definitions.

Both integrations pass their existing shared appearance controls into the drawer
header. Changing language updates labels and date formatting without reloading
data or resetting expanded sections. The loading state uses the actual metric
labels, range controls, collapsed sections and button rows. Essential view,
click and contact cards remain visible; engagement/audience, confirmed outcomes
and WhatsApp question details expand on demand. All metric accents reuse shared
StatCard colors in light and dark mode. Linktree analytics uses the existing
standard shared StatCard presentation used by Linktree and Forms, with its
matching SkeletonStatCard loading state; it has no separate analytics variant.
Contact actions and unique contacts belong inside the collapsed Engagement &
audience section, alongside active time, engagement, sources and devices.

## Saved-page editor actions

Linktree and Form edit drawers share EditorPageActions for Pause/Activate,
Archive/Restore and Duplicate. These actions are absent from cards/tables and new
page drawers. Default Linktrees retain their protected status/archive restrictions.
The shared Linktree editor adapter serves Business and Platform endpoints and
reuses each host's existing mutation callbacks and inline duplicate workspace. Actions lock
other mutations while pending; status changes are reflected in the editor so a
later Save cannot undo a pause. Form duplication uses the existing scoped endpoint
and does not copy unsaved draft changes. No schema changes are required.

## Client-generated identifiers

Use `lib/utils/random-id.ts` (`createRuntimeId`) for client-generated item IDs,
including newly added WhatsApp questions. Calling `crypto.randomUUID` directly
can fail in browser contexts where that method is unavailable. The shared helper
uses supported UUID generation with compatibility fallbacks. Existing saved IDs
remain unchanged, preserving ordering, messages and question attribution. These
IDs identify records; they are not authentication tokens or security nonces.

Carousel image update actions include the field name and image position in their
accessible label, so repeated image controls remain distinguishable. Picker
integration tests wait for the anchored popup's animation-frame initialization;
they query labeled controls rather than presentation-only placeholders.

## Form preview sample copy

New form drafts leave optional introduction and completion text empty. Headline, description, slogan, purpose, and final-page custom text are saved only when entered by the owner. Shared preview renderers supply localized samples without changing the draft. Public rendering disables samples, including final-page action guidance; the standard submission thank-you acknowledgement remains. This applies to both layouts and Business/Platform editors. Existing authored content is preserved.


## Inline Linktree duplication

The Business and Platform editors open LinktreeDuplicateWorkspace inside the existing ManagementDrawer, with the shared editor/phone-preview layout. Its starting values come from saved edit data, independently of unsaved source changes. Headline, slogan and slogan color, description, verification badge, logo, banner/carousel, page design, background pattern, and theme/background image can be customized. The shared crop, image, banner, appearance and design controls update the live preview. A server-suggested slug is visible, editable and checked for availability; the future relative URL updates immediately. Only changed fields and persisted owner upload URLs enter the duplicate request. Cancel returns to the untouched source draft; success refreshes the list. No standalone duplication modal is used.


## Inline Forms duplication

Forms duplication uses the existing edit drawer, shared FormBuilder, preview, crop workspace and media upload pipeline in Business and Platform. The Duplicate action loads a saved source snapshot and an owner-scoped available name/address suggestion. The copy supports all form fields, banner/carousel ordering, logo, final-page details, questions and appearance; its address is editable through the same DuplicateSlugField and usePageDuplicateSlug used by Linktrees. No record is created until Duplicate succeeds. Cancel restores the original unsaved draft. Copies are unarchived, paused, have fresh identities and no responses. The create capability controls both duplication endpoints and the editor action.

## Linktree overview statistics

Business and Platform Linktree management share LinktreeStats with six existing StatCards: Pages, Views, Unique visitors, Clicks, Unique clickers, and Contact actions. Cards have value and label only. All six use one pending state until list and summary requests settle, including refresh. The loading layout uses the same StatCardGrid (two columns below desktop, three on desktop) and six shared card skeletons. Overview totals cover the owner collection independently of list search/archive filters.

Views/clicks come from owner-scoped Linktree summary rollups. Exact unique visitors/clickers and contact intent come from retained raw analytics; contact intent never claims a sent message or completed order. The summary boundary validates counters. Failed or missing data displays a dash, while successful zero traffic displays zero. Platform summary failure does not block list management, and per-page unique visitors are never summed into an owner total. The old overview click rate and conversions cards are removed; detailed reporting remains in the analytics drawer.

The Linktree campaign toggle, badge, highlight and sorting priority are retired
from the shared Business/Platform grid and table. Publication and archive
actions remain in the editor.

## Page pinning

Forms and Linktrees use the same icon-only `PagePinButton` and
`usePagePinning` request lifecycle in Business and Platform grids, desktop rows
and mobile cards. Tooltips and announcements support English, Kurdish and
Arabic. Saved pins sort before unpinned pages; within each group the existing
order applies (default Linktree first, then creation date; Forms by update date).
Unpinning restores that order. A successful change returns pagination to the
first page without remounting the Linktree collection. Pending writes disable
the affected control; failures retain the existing state and show a toast.
Pinning does not change public content, publication or archive state.

## Share analytics actions

Form and Linktree grid/table action sections reuse AnalyticsShareButton,
AnalyticsShareDrawer and ShareExpiryField in Business and Platform dashboards.
Sharing defaults to No expiration. New Form shares enable Include form responses
by default; owners can turn it off before creation. Existing links are unchanged.
The create action shares the expiry trigger's 40px height and aligns with that
trigger even when a custom date field is displayed beneath it. Presets and the shared DateTimeInput support
optional expiry during creation or later editing. Disabling or deleting a link
revokes access. The link and six-digit code share one panel, with separate copy
actions. New codes appear at creation and can be revealed once more through an
owner-only action; old hash-only codes cannot be recovered. All text supports English,
Kurdish and Arabic. The public code gate and read-only report reuse shared fields,
selects, statistic cards and loading primitives. Linktree reports render the same
PageAnalyticsContent as Business/Platform drawers: range presets, four overview
cards, engagement/audience, confirmed outcomes/revenue, WhatsApp question selections
and per-action details, in the same order and with the same collapsed defaults.
The grant-scoped reader applies validated calendar ranges to summary and actions;
actions retain the drawer reader's ordering without a separate top-50 cutoff.

The sharing drawer reuses ManagementDrawer chrome, EditorSection accordions,
ModalStepActions and shared soft controls, including matching field-shaped loading
placeholders. Both collection views pass the tenant accent explicitly into the
portal; platform collections explicitly retain the platform theme. Page design
colors do not override the business dashboard accent.

The shared report portal uses tenant colors after unlocking, shared language
and theme controls, collapsible report sections, responsive shared tables and
matching report skeletons. New Form shares can explicitly include submitted
answers/contact details. The portal reuses FormSubmissionsTable with expandable
details and server pagination; it provides no response editing or deletion.

Form portals render FormAnalyticsOverview with the same six cards and detailed
insights as the Forms drawer, followed by FormSubmissionsTable and its matching
skeleton when the grant includes responses. Source and time spent use the same
read-only response projection. They reuse admin search, row limits, CSV menu,
range export and cancellable export progress. The shared snapshot exporter uses a
grant-scoped reader and the same CSV column builder as the drawer. Answer summaries
are omitted when the owner has not enabled sharing responses. Search is debounced and retains focus; phones use answer
cards while tablet/desktop use the shared table. The code gate reuses
AuthenticationCard with an accessible single numeric field and six-dash placeholder.

The share code gate uses the same AuthenticationShell split layout, preview panel,
pre-auth language toggle and AuthenticationCard as Business sign-in. Code input
and submit styling are shared with EmailCodeAuthenticationForm through
authentication-control-styles; pending access checks keep the real controls
visible and disabled. The authenticated report navbar contains a single-line page name alongside
matching compact refresh, theme and language controls. Long names truncate within
the available width; read-only and expiry labels do not add header rows. Report
content starts directly with analytics; grant expiry remains enforced by the API.

Share pages resolve live public owner branding server-side before rendering the
code gate. Business sign-in chrome uses the tenant logo, color, name and favicon;
the neutral business logo is the fallback. Existing root-domain share URLs
redirect to the business's current canonical subdomain or selected custom domain.
Proxy routing permits the share route only after normal host registration checks.

The share route has a dedicated localized not-found screen explaining that the
link expired, was disabled or was deleted, using the shared sign-in shell and
tenant branding. An already-open report switches to that screen when a denied
read is followed by a failed live branding check; an ordinary expired viewer
session still offers code entry when the grant itself remains live.


### Shared app appearance

Business and Platform dashboard shells, public marketing navigation, and standalone
appearance controls use `useAppTheme`. Its external store owns the document class,
`data-app-theme` preference marker, local storage and server-readable cookie. The
root layout renders the cookie preference before hydration. One storage listener is
attached while controls are mounted; repeated preferences avoid storage/cookie
writes. Tenant palette context values are memoized independently of appearance.

User-triggered changes use a 180ms native View Transition with synchronous React
updates, so portaled drawers and page chrome enter the new theme together. Queued
callbacks from superseded transitions cannot overwrite newer choices. Unsupported
browsers use a short color-only CSS fallback; reduced-motion users switch without
animation. Initialization and cross-tab synchronization do not start animations.
The transition is scoped to explicit appearance changes and does not change
navigation transitions or authored Form/Linktree preview palettes.


### Drawer animation and lifetime

All end-side editors and analytics surfaces reuse ManagementDrawer. ManagementModal
keeps its hydrated drawer content in a propagating DrawerPresence; ManagementDialog
owns retained chrome, focus and the scroll lock. Ordinary centered dialogs retain
their existing presentation. MotionSlide shares 320ms entry / 220ms exit timing,
the app's entry ease, a 200ms backdrop fade and reduced-motion handling. It animates
only the panel transform and backdrop opacity, and uses Motion's temporary
will-change management instead of a permanent transformed layer.

For a conditionally mounted feature, keep DrawerPresence outside the condition:

```tsx
<DrawerPresence>
  {open && <FeatureDrawer onClose={close} />}
</DrawerPresence>
```

An always-mounted drawer can pass isOpen directly to ManagementDrawer. Do not
place an early null return above that shared shell. DrawerSession preserves the
first entrance across a lazy module's fallback/content replacement; retain the
owner key for the same opening. Business and Platform form/Linktree editors,
analytics and share controls use these boundaries. The panel, backdrop, focus trap
and reference-counted scroll lock remain until exit completes. Reopening can
reverse an exit, duplicate dismissals are ignored during exit, and closing one
of several overlays cannot unlock or refocus the page beneath a newer overlay.
DrawerPresence normalizes keys in both session modes and stops supplying new
children when its parent exits. Motion retains the outgoing surface itself, so
late form updates during close cannot insert it twice or duplicate animation keys.

TikTok settings use one continuous workspace without Events/Configuration tabs.
The four overview cards show configured Pixels, API connections, delivered events
and delivery success rate. Shared Pixel/API configuration appears first, followed
by real delivery diagnostics; plans without diagnostics see a compact locked
notice rather than fabricated preview data. Loading mirrors this combined layout.
The overview uses shared StatCard/StatCardGrid above the panel, with four desktop
columns and the same responsive skeleton. Pixel groups and delivery diagnostics
live inside one shared PageManagementSection with one heading, the group controls
in its shared toolbar strip, and one Save footer at the very bottom.
Embedded sections omit independent headers, refresh controls and panel frames;
delivery content is composed inside the shared Pixel editor before its footer.
Platform settings preserve the standalone editor. Loading mirrors this structure.

TikTok overview cards use the same shared StatCard loading prop as LinktreeStats,
including metric colors, icon slots and pending captions. Embedded Pixel groups
are flat divided rows with shared field surfaces; reconciliation uses compact
label/value rows instead of nested stat cards. The management loading body follows
that flat layout as well.

TikTok pending groups match the real four-field row (Pixel ID, token, test code,
event selector/test action) at the same mobile/tablet/desktop breakpoints. The
shared toolbar skeleton mirrors its label, helper and Add action. Delivery pending
content reserves the reconciliation heading/badge, two value rows and status row;
it has no removed error-log title or arbitrary large blocks. The final Save slot
remains below both setup and delivery during loading.

Business Settings exposes Profile, New page defaults and Messages tabs. The former
Sign-in and sessions tab is no longer rendered or mounted from this page; session
security behavior and Platform administrator session controls are unchanged.

The [dashboard data audit](dashboard-data-audit.md) records each overview/collection
source and scope, unknown-versus-zero behavior and reporting limitations. Shared
request guards prevent stale responses winning, and mounted billing/access/
communications/settings screens register with global dashboard refresh.

## Shared cursor feedback

RootLayout sets createCursorVariables from verified request branding before hydration.
Business and Platform theme providers reuse that contract for the white arrow,
white pointer hand, tenant outlines and soft static halos. CursorGlow mounts once
at the root and adds a small decorative trailing halo through a frame-rate-independent
transform, without replacing the browser cursor or rendering React state per move.
It stops frames when settled, respects reduced motion and mouse-only input, and
cleans up listeners/frames. Specialized text, resize, drag and disabled cursors remain native.

Settings profile/defaults and TikTok configuration reuse SectionSaveActions for
a bottom-right save row inside the management section. The Settings loading
skeleton places its save placeholder in the same footer position. Save permissions,
validation and dirty-state behavior remain feature-owned.

## Global refresh feedback across dashboard pages

useRegisterDashboardRefresh returns the coordinator pending state so Settings,
Templates and TikTok can reuse their actual skeletons for explicit header refresh.
Pixel configuration, delivery, active messages, signup applications, blocked
subdomains and the stored platform Ads connection register their own loaders.
Business directory, access control, billing and communications pair StatCard
loading with DashboardRefreshRegion for content without an exact existing skeleton.
The region uses shared accessible LoadingState and hides pending content without
unmounting it, preserving collection pagination, local filters and editor state.
No guessed replacement cards or full document reload are introduced. Platform
Settings waits for both general and active-section loaders even if either fails.

Forms and Linktrees use PageManagementCollection for identical initial and refresh
collection skeletons. Linktrees wait for both list and analytics readiness before
revealing the collection, matching Forms rather than exposing cards beneath pending
statistics. The shared shell, toolbar, responsive grid/table primitives, selection
and 15-item pagination remain common; labels, metrics and columns are resource-specific.
LinktreesPageSkeleton supplies the real six Linktree statistic slots to the same
SkeletonPageManagement used by FormsPageSkeleton. Business and Platform route loading
select this composition for Pages/Linktrees instead of generic gray statistics or
the Platform business-directory skeleton.

## Dashboard consistency contract

PageManagementSection is the common management heading, toolbar and content shell
for Business/Platform Pages, Forms, Templates, Settings, TikTok, businesses,
Campaigns, Access Control, Billing and Communications. Resource-specific controls
stay explicit; shared controls use ManagementSearchTrigger, ManagementViewToggle,
PageManagementActions and SettingsActionButton. Inline management refresh controls
are removed in favor of the global header coordinator. Platform Form toolbars use
the same explicit platform accent as Platform Linktrees. Management collections
use PAGE_MANAGEMENT_PAGE_SIZE (15), including default grids/tables, campaigns,
Business directory requests, access control and billing; response-table page-size
choices remain explicit to their analytics use case.

Linktree/Form grids share PageListDescription and PageListActions, including
content direction, footer spacing, action radii and three actions per table row.
Linktree table/mobile actions include the same Open action as its grid. Empty
optional descriptions stay omitted; Linktree load errors use RequestErrorNotice
with translated copy, matching Forms. Remaining campaign/subscription browser date
fields use DateTimeInput without changing their stored date formats.

Both dashboard route boundaries share DashboardPageLoading and DashboardLoadingShell.
They resolve the actual route, retain verified owner branding before hydration,
and select a real matching skeleton. When no exact skeleton exists they use shared
LoadingState instead of unrelated cards. Business-directory loading mirrors its
updated shell, toolbar and six metric colors. The campaign global refresh reloads
its existing stored draft collection; it does not imply connected live reporting.


Form and Linktree selection toolbars share PageSelectionActions for two separate
confirmed writes: amber Delete analytics preserves pages/forms and form responses;
red Delete pages/forms removes the selected records through existing owner-scoped
DELETE endpoints. Business Linktree deletion requires its delete capability,
independently of analytics-clear permission. Default Linktrees (is_default or the
reserved id slug) are excluded from record deletion but remain eligible for
analytics clearing. Platform and Business use the same workflow and translations.
Requests are deduplicated and limited to five in flight. After partial record
deletion, collections/statistics refresh and only failed IDs remain selected.
Deleting the final Form on a server-paginated page clamps to an available page.

Linktree drawers in both dashboards expose the shared Link slug field independently
of the headline, below Description. Its compact presentation shows only the URL
path for a filled slug, with availability errors or progress when relevant. The
automatic-link hint appears only while a new slug is blank. New pages may leave
it blank for server-generated addresses;
existing pages retain their saved slug until explicitly edited. Debounced,
abortable availability checks use the authenticated owner's endpoint and exclude
the current page. Invalid, taken, pending or failed checks block explicit URL
changes. A localized warning explains that changing the slug invalidates links
and QR codes using the previous address. Business and Platform payload adapters
send the explicit value as `seo_name`, including approval-governed updates.

Shared ModalTextInput/ModalTextArea render default length limits directly in JSX
through input-limits.ts; explicit field limits take precedence. Decimal NumberInput
also declares a bound. Do not add DOM-wide input observers: scheduling a frame
cannot establish that streamed/Suspense descendants have hydrated. The retired
GlobalInputLimits observer could add maxlength=255 before React hydrated a public
form quantity input. Native inputs must declare any applicable limit themselves.
Server-side definition/submission validation remains authoritative. Hydration tests
compare server and client numeric/text fields with no warning suppression.

## Shared Linktree mutations

Business and Platform Linktree editors use `features/link-editor/use-linktree-mutations.ts` and its shared API module. Both scopes serialize the same canonical editor payload and save the page and links with one request. Empty descriptions are sent explicitly so clearing a field persists. The shared layer also owns archive, status, delete, normalized API errors, and applied-write cache invalidation. Dashboard adapters supply scoped presentation and update their lists only after an applied result. HTTP 202 `APPROVAL_REQUIRED` produces a separate pending result: show the localized approval notice, leave published data unchanged, and never continue with a second link write or announce a completed save.

The shared analytics drawer uses the same `apiRequest` transport as other features. Linktree badges live in the neutral link-editor feature; the generic `PageListMetaField` lives in shared components. Both dashboards, Forms, and public directories reuse these components.

## Dashboard home-screen installation

Public pages retain `/manifest.webmanifest` with the public homepage as their launch URL. The Business layout links `/business/manifest.webmanifest`; the Platform layout links the manifest under the configured private console path. `lib/brand/dashboard-install.ts` owns both dashboard manifest contracts and Apple standalone metadata. Relative `id`, `scope`, and `start_url` isolate installations by origin and keep public and dashboard installs distinct.

Business installs launch `/business/launch` on the current tenant subdomain or selected custom domain. This entry validates the host-bound session through `/api/auth/session`, then redirects to `/business/pages` or `/business/workspace-entry`. Upstream failures return a retryable 503 without removing a valid cookie. Platform installs launch the Businesses route under the configured console base and reuse its existing session/login protection. Manifest endpoints expose public branding only, carry no credentials, and remain accessible without a session so login and installation work after expiry. The private console path is never placed in the public manifest.

There is no offline dashboard or service-worker caching of authenticated responses. Home-screen installation requires a secure production origin and platform browser support. Existing shortcuts installed with the previous homepage start URL should be removed and re-added from the correct dashboard after deployment; browsers do not reliably migrate an old shortcut into a new app identity. Reinstalling may require signing in again in the installed app's browser context.

The public manifest is an explicit route handler, not the special root `app/manifest.ts` metadata file. Root layout supplies its link through `Metadata.manifest`, allowing child dashboard metadata to override it. Next file-based manifest metadata otherwise takes priority over the dashboard link.

## Optional Linktree sponsorship

Both dashboard editors expose one shared Sponsor section. It is off by default for new and existing pages. When enabling it, the sponsor name starts with the owning business/platform name and the optional destination starts as `/` (the current owner's homepage). Owners can edit the name, clear the destination for plain attribution, or choose a text label versus an uploaded JPEG/PNG wordmark. Wordmarks use the existing upload/crop controls, preserve their proportions, and are persisted through the same owner-scoped upload endpoint. Validation happens before uploads and submission.

The configuration is stored at `template_config.sponsor`: `{enabled, style, name, logo, url, intro?}`. `style` is `text` or `wordmark`; text-mode name is required and at most 100 characters; wordmark mode hides the name field and saves no separate text name; `logo` is an owned managed upload or null; `url` is `/`, an absolute HTTP(S) URL without embedded credentials, a validated international `tel:+` number, or null. WhatsApp uses a canonical `https://wa.me/<number>` destination. Disabled settings can be retained without displaying attribution. Removing a wordmark requires returning to text or disabling attribution before saving.

All six templates and the live drawer preview use the shared sponsor/legal footer. Attribution appears above the existing English Terms and Privacy links. When no custom introduction is saved, the introductory label follows the public page language: «سپۆنسەرکراوە لەلایەن», «برعاية», or “Sponsored by”. Wordmarks have a localized accessible attribution label when no text name is present and a bounded contain layout. Preview attribution never navigates or tracks; published optional links use the existing page tracker. Footer spacing reserves room for the sponsor and mobile safe area.

Sponsor controls use concise labels. Introductory text is editable (100 characters maximum), and an explicit empty value hides that line. Destination choices are No link, Homepage, Website, WhatsApp, and Phone call. Only Website shows a URL field; contact modes reuse the shared country selector/phone input and save canonical destinations. Incomplete phone entries cannot be saved. Wordmark mode hides the sponsor-name field and uses a localized generic image alternative for accessibility. The legal footer measures its actual height so wrapped custom text cannot cover page actions.
