# Frontend

Forms at `/business/forms` and the Platform console share `FormsManagementPage`,
the authenticated dashboard layout, six real stat cards and paginated management
grid/table views. The shared toolbar provides search, refresh, view switch and
Active/Archive controls. The Active tab includes non-archived Active and Paused forms; Archive is a separate collection flag, never a status. Owner-scoped
APIs persist definitions and uploads; public `/form/<slug>` pages collect real
responses through the same Form/Card renderers. Editor previews remain temporary.
Grid/table use shared Linktree action-button styles with Analytics before Edit and secondary actions behind three dots; Preview and Duplicate are removed. Form analytics uses the shared read-only page summary modal. Full definitions load on edit; collection requests load summaries only.
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
Preview carousels use side chevrons without a bottom navigation bar or counter.
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
The editor omits a separate Form name field. On save, every draft uses
its nonempty headline as its dashboard name;
editing the headline updates the name on save. Invalid links show inline errors and block save requests; incomplete drafts in both layouts may be saved privately to the server.
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
dispatch primitives. Individual landing, join, and advertising components
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
route-level dashboard loading states on this shared shell so they never fall
back to the unrelated public landing-page skeleton.

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

### Advertising-service frontend preview

The business dashboard exposes `/business/advertising` as the frontend preview
of a reusable tenant advertising-service feature. It composes the shared
dashboard header, statistic cards, segmented tabs, skeletons, tenant theme, and
public navigation/footer rather than creating a parallel dashboard shell. The
editor covers public copy, availability, contact, currency, payment labels,
packages, estimated outcomes, durations, and FAQs. Its public counterpart is
served at `/advertising` on a business subdomain and uses the current tenant's
public branding.

Until the backend domain is implemented, configuration is browser-local mock
state stored under a versioned key. The dashboard labels this limitation and
must not claim that edits are published across devices. This temporary frontend
state must not collect payments, TikTok credentials, authorization codes, or
customer orders. A future backend implementation must persist configuration per
business, calculate prices server-side, enforce tenant ownership, encrypt and
redact authorization codes, verify payment webhooks idempotently, and expose
only enabled public configuration.

The business homepage navigation links to the public advertising route. The
advertising surface follows the public site's left-to-right page structure and
reuses `BusinessPublicFooter`, the same tenant footer composition used by the
business homepage, including published Linktree and configured
contact columns. Public-route loading uses the current full-width 60px navbar
footprint rather than the retired floating-header skeleton.

The advertising surface also installs the tenant accent as the public cursor,
text-selection and theme color, restoring Sponsor.krd
defaults when it unmounts. Its metadata uses the tenant favicon plus logo or
default-avatar fallback for browser and social-preview imagery. Authenticated
business routes use short English browser-tab suffixes, and public content
titles are whitespace-normalized and bounded so user-entered names cannot
create excessively long browser tabs.

`BusinessPublicSiteShell` is the single visual and behavioral frame for both
the tenant homepage and tenant advertising page. It owns the public navbar,
continuous `BusinessGridBackdrop`, light/dark page surfaces, tenant theme
variables, cursor lifecycle, selection color, and shared
business footer. Public business features must compose this shell rather than
copying those concerns. Advertising sections use the same transparent section
surfaces, responsive spacing, heading scale, soft cards, and
`BusinessSectionDecorations` pattern as the homepage, so future shell-level
style changes propagate to both routes. Public business landing sections have
no separators on either route; only the shared footer retains its top boundary.
The tenant homepage has one hero, with mobile template mockups inside it, and,
when public Linktrees exist, one gallery section. Former About Us and
digital-presence sections and their navigation anchors are removed.
The homepage's fixed interface text has a visitor-controlled AR/EN/KU switch in
the shared navbar. The selection is immediate and stored in the host-only
`business_public_locale` cookie, independently of the private Dashboard
language. Server-rendered homepage metadata reads this cookie on subsequent
requests. Business-authored names, subtitles, and footer descriptions remain
unchanged; the visitor switch translates only application-owned text.
The same visitor preference now applies to the public advertising page,
video-code guide, and published business Linktrees. Their navigation, footer,
guide controls, default Linktree copy, WhatsApp question defaults, loading
announcements, metadata fallbacks, and business-host error pages follow AR/EN/KU.
Dismiss controls in the optional homepage communications component follow the
root visitor locale.
The Platform's own Linktrees keep their existing defaults. Persisted advertising
content, custom Linktree descriptions, link labels, payment provider details,
and owner-authored WhatsApp questions remain exactly as published; localization
does not silently rewrite them. This public preference is never used as an
authentication or tracking input.

Both public hero sections render `BusinessHeroAccentBackdrop`. It provides the
same tenant-colored radial atmosphere and restrained top highlight while
leaving the shared grid visible beneath it. The component is decorative,
non-interactive, theme-aware, and is the single place to tune this effect for
the homepage and advertising page together.

The advertising route uses a compact introductory title instead of a second
marketing hero. It contains no badge, CTA, preparation note, floating label,
or secondary action. A concise Kurdish description sits below the title;
public advertising copy uses `ØªÛŒÚ©ØªÛ†Ú©` and omits sentence-ending periods for a
consistent editorial style.

Its sponsorship journey is a dedicated interactive tutorial rather than a
generic card row. Five keyboard-operable steps explain sponsor type, package
selection, payment, receipt/video-code submission, and activation. The visual
examples use the established landing-section surfaces and Motion transitions,
show the bundled FIB, QiCard, FastPay, and Korek marks, and clearly identify
receipt and training media as examples. The public tutorial never collects
payment credentials, account passwords, receipts, authorization codes, or
orders; submission continues through the configured contact channel until a
tenant-scoped backend workflow exists.
The sponsor type, price rows, and payment-provider choices are local selection
controls rather than decorative options. A stable mockup frame owns
the guide header, content stage, and bottom navigation bar. Desktop uses a
descriptive step rail; mobile uses five compact English-number controls and
keeps the active Kurdish title immediately above them without horizontal
scrolling. Visible step descriptions and redundant `Step` labels are omitted.
English Back and Next controls and a progress indicator move through the
journey while preserving all illustrative selections.
The second tutorial stage uses one compact responsive semantic pricing table.
It shows only the sponsor type selected in the first stage, lets visitors
select an individual price row, and displays the complete English-number IQD
price and estimated-view schedule for that type. This tutorial state remains
illustrative and browser-local.
The changing stage is visually flat inside that frame: it does not wrap option
groups in another bordered card. Blue, violet, amber, rose, and emerald tones
differentiate the five steps, while individual sponsor, package, and provider
choices use distinct restrained tints and a consistent selected-state control.
The mockup header uses the shared full-color TikTok mark on its native dark
surface. Its full-width footer progress track uses five softly differentiated
segments matching the tutorial's blue, violet, amber, rose, and emerald steps;
future segments remain visible at reduced opacity.

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
  public footer, and advertising route link remain available.
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
- The grid's campaign-revenue action opens one shared modal in business and
  platform management. It loads, creates, edits, and deletes durable records
  through the surface-specific Linktree API base path. The modal derives live
  previews for immediate feedback, while persisted converted spend, duration,
  net revenue, and the summed total come from server responses.
- Approved public marketing routes load a business's TikTok pixel and report
  through `createPageTracker`
  (`features/analytics/page-tracking.ts`). Adding tracking to anything on
  either page follows [docs/tracking.md](tracking.md); mounting the pixel on a
  third surface fails `components/analytics/pixel-placement.spec.ts`.
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

Translation messages live in `features/business/i18n/messages.ts`. Dashboard
chrome, sidebar plan/support controls, dashboard-owned dialogs and action
feedback, locked-feature notices, and the Linktree management summary/actions
use the Business locale.
The shared Linktree management page receives typed copy from its Business
and Platform adapters. The Business adapter also
supplies localized copy to the shared Linktree grid, table, and status badges,
including action tooltips, pagination, loading announcements, accessibility
labels, and copy-link feedback. The page grid and table's lazy-chunk loading
announcements use that same copy, rather than the shared skeleton's English
default; the Platform screen supplies its own localized announcement. The
Business page search, duplicate, campaign-profit, analytics, delete, and
clear-analytics dialogs also receive localized copy. The campaign-profit calendar
receives the active Business locale, including English. Public Linktree GPS controls
and Google Maps labels use the visitor locale; the saved location title itself
remains user-authored. The shared Linktree editor receives Arabic and English
Business copy for its wizard, validation, template, pattern,
color, icon, and country pickers; Platform supplies Arabic and English copy while
keeping Kurdish as its default. Stored
page names, descriptions, questions, and link labels remain user-authored content
and are not rewritten when the dashboard language changes. The Business TikTok
route now translates its delivery history, Pixel configuration, and Pixel-group controls; shared configuration
components receive Business-only copy and keep their Platform defaults. The
shared Pixel test result translates the Request ID label in all three languages.
The TikTok delivery-status panel accepts the same three locales for its status,
explanations, and timestamps; API-provided error bodies remain unchanged.
Business Settings profile, defaults, security, and message tabs translate their
page labels, account identity, save control, sessions, conversations, template
selector, and color picker. Session confirmation controls, dates, brand upload
errors, cooldown dates, and accessible brand-image labels also follow Arabic or English when selected. The Business advertising editor translates its
navigation tabs, forms, action controls, dialogs, and editor-only previews;
saved advertising content and the public advertising page are not translated
by the dashboard preference. The Business notification bell, inbox actions,
detail dialog, dates, loading announcement, feedback, and announcement dismiss control also follow
the Business locale; notification titles, bodies, and banner content remain
author-authored. Platform notifications keep their Kurdish defaults. Shared business/platform UI should
receive translated labels or use an explicitly business-scoped provider, not
be forked.
The platform-administrator impersonation warning follows the Business
member's saved language even though it sits outside the dashboard provider.
Business loading screens use localized screen-reader announcements; shared
skeleton components keep their existing defaults in the Platform console.

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
duplication, campaign-profit, and analytics dialogs, plus its platform-specific
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
selected language. The shared campaign-profit calendar receives the active Business or Platform
Arabic or English locale; platform search and copy-value controls receive localized
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
Its `standard`, `funnel`, `live`, `comparison`, and `story` variants preserve
the visual requirements of each context without duplicating metric markup.
Color, icon, compact sizing, descriptions, actions, and loading state remain
configurable. The component's loading state selects the matching
`SkeletonStatCard` shape so data arrival does not change the card's footprint.
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
management tables and cards, page management, settings, advertising, TikTok,
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
  selection, campaign activation, slug checks, link ordering, link batch
  synchronization, image uploads, template selection, footer settings, and
  WhatsApp modal settings. Campaign-active pages are promoted directly below
  the default page in both grid and table views;
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
  checks, campaign/archive/status controls, deletion, and root-domain previews.
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
