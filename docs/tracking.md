# Public-page tracking

Sponsor.krd has one first-party analytics pipeline. TikTok browser Pixel and
Events API delivery are an optional, narrower layer on top of that pipeline.

## Placement rule

The public `/linktree` and `/form` directory indexes do not mount a tracker or
pixel. They list destination pages without recording false destination views;
card prefetch is disabled. Allowlisted UTM fields and ttclid are carried to the
selected page, where the existing shared tracker handles the actual visit.

The optional default-Linktree homepage uses `PublicLinktreeContent` with
`enableMarketingTracking={false}`. `/` retains the first-party Home route view
through `PublicRouteTracking`; it does not load TikTok base code or report
Linktree actions/conversions. The canonical `/linktree/<slug>` keeps its existing
page tracker and pixel behavior. Use that canonical URL for tracked campaigns.

TikTok marketing tracking is allowed only on published public Linktree and form pages.
It must not be mounted or forwarded from:

- the Sponsor.krd root website;
- platform administration or authentication;
- business dashboards or authentication;
- a business subdomain landing page;

Fixed public routes may collect first-party analytics through
`PublicRouteTracking`, but that component must never mount `TikTokPixel` and
the backend must never create TikTok outbox rows for `route`
page types.

The structural placement test in
`frontend/src/components/analytics/pixel-placement.spec.ts` enforces the
browser boundary. `forwardsToTikTok` and its tests enforce the server boundary.

## Shared page tracker

Public Linktree and form interactions report through
`frontend/src/features/analytics/page-tracking.ts`. A component must not call
the TikTok queue directly.

Every reported event receives one randomly generated event ID. When a browser
Pixel event and server Events API event represent the same conversion, both
must use that exact ID and the same TikTok event name. TikTok can then
deduplicate the pair.

Published forms and Linktrees now expose canonical `analytics.content` metadata
using the registered public-page ID rather than their source record ID. Registered
actions include the authoritative marketing content name. Both channels build
content IDs, names, `contents` and public SEO descriptions with the shared
`@linktree/types/tiktok-content.cjs` implementation; visitor-supplied platform
labels cannot replace registered action metadata. Source IDs remain valid for
first-party ingestion and dashboard URLs. Older public payloads retain the
frontend fallback until their cached HTML refreshes; event IDs/names remain
compatible throughout. No stored history is rewritten.

A browser SDK failure returns a failed dispatch instead of aborting first-party
ingestion or outbound navigation. Each configured Pixel is attempted independently;
a failed destination never triggers a duplicate broadcast to successful ones.
The existing Events API queue continues independently for token-enabled Pixels.
SDK PageView is browser-only base-code activity; the paired app page event is
ViewContent. Dashboard server tests are synthetic server-only requests, not a
second browser conversion. Neither replaces testing real accepted submissions.

The tracker:

- records a page view once;
- suppresses rapid duplicate actions;
- queues first-party events durably in the browser;
- hands navigation events off before leaving the page;
- fires a Pixel only for a registered action; and
- treats engagement-only events as first-party analytics, not conversions.

Analytics failures must never break public navigation or rendering.

The batch ingest endpoint acknowledges permanent client errors per event, but
propagates infrastructure errors and rate limits as retryable HTTP failures.
The browser retains that batch; committed siblings are safe to replay because
their event IDs are idempotent. A database outage must never become a successful
response that permanently removes unrecorded events from the retry queue.

## Registered actions

Linktree banner changes and banner/logo image opens use `page:banner-change` and
`page:image-open`. The media action migration registers them for existing and
future Linktree pages with `metadata.engagement_only=true`. They report through
`trackEngagement` and never dispatch a browser Pixel. Server forwarding checks
that metadata too, preventing media engagement from becoming Events API
conversions even though each event resolves to a registered action. Drawer
previews have no media tracker callback.
Carousel autoplay is presentation only and never reports `page:banner-change`.
Manual pagination dots, mouse drags and horizontal touch swipes continue reporting that registered
engagement action through the same shared callback.

Every reportable public action has a `public_page_actions` row. The row binds:

- the action to one `public_pages` identity;
- a stable `action_key` used by the renderer;
- an internal action type and label;
- the allowed TikTok event name; and
- optional metadata and destination information.

Renderers use neutral keys such as `link:<id>` or `page:<purpose>`. New code
must not reuse names from removed page systems. An unregistered action can be
recorded internally, but it cannot fire a Pixel because the browser and server
would have no authoritative shared event name.

## Browser Pixel

`TikTokPixelBaseCode` provides the server-rendered base snippet for public
Linktree and form HTML. `TikTokPixel` handles client route state, and
`tiktok-dispatch.ts` is the only runtime owner of `window.ttq`.

Pixel IDs come from the public page owner's database configuration. All active
groups for that owner receive the same eligible Linktree events, independently
of saved display order. Each group may therefore be selected in its associated
TikTok ad account without changing a primary setting. The public read exposes
all active Pixel IDs; the Events API outbox creates one row per active group
that has its own encrypted token. Browser and server copies of an event use the
same event ID and name for deduplication within each Pixel. The platform
content workspace has its own groups; it never shares destinations with
customer businesses. Events API tokens are encrypted at rest and are never
sent to the browser. Neither value may be read from a shared environment
variable because tracking ownership is per public-page owner.

## Events API

Linktree and action classifications are internal analytics metadata, not
TikTok catalog types. Browser Pixel and Events API payloads omit
`content_type`, including inside `contents`: TikTok accepts only `product`
or `product_group`, and these events do not describe catalog products.
The server delivery boundary also omits it for previously queued events.

The backend ingests first-party analytics idempotently. Eligible Linktree and form
events create transactional `marketing_event_outbox` rows for active,
entitled business destinations. The outbox worker performs delivery, retry,
backoff, error recording, and permanent-failure notification.

The Events API test tool sends a test-code-scoped event using the selected real
published Linktree or form belonging to the authenticated owner, including the
tenant subdomain for a customer or the root domain for the platform workspace.
It refuses to fabricate a root-homepage URL when that owner has no eligible
published page. Diagnostic events include a page content ID but never invent TikTok
click IDs, cookies, or visitor identities. A plan or offer link opening is a
button click, not a checkout event. Do not add shopping events to a Linktree
whose visitors cannot actually add to cart or purchase.

Analytics reporting is read-only with respect to marketing delivery. Showing
an archived/replaced action as a historical row, or grouping an unresolved
event as unattributed, never replays it to the Pixel or creates a new Events
API outbox item. Already-rendered pages may still resolve an archived action;
that original event keeps its shared browser/server event ID and event name so
TikTok deduplication remains intact.

Engagement-only events without registered actions do not enter the TikTok
outbox. Examples include section opens, form views, and engaged-view
milestones. They remain available to Sponsor.krd analytics.

## Privacy and security

- Never expose Events API tokens, internal owner IDs, IP addresses, or raw
  identity claims to public clients.
- Apply the configured retention policy to raw analytics and delivery data.
- Hash TikTok advanced-matching values in the required normalized form.
- Validate page and action ownership server-side; never trust IDs from the
  browser.
- Keep debug output free of secrets and sensitive personal data.

## Website campaign readiness

Public Linktrees and forms emit ViewContent in both browser and server channels.
Registered contact/link actions emit their stored Contact/ClickButton event;
SubmitForm is emitted only after a response is accepted. Base-code PageView is
separate browser-only activity. Do not add duplicate Event Builder rules for
events the application already emits, or shopping outcomes/value that these
pages do not measure.

Use the canonical published `/linktree/<slug>` or `/form/<slug>` as the ad
destination, on the intended business/custom domain. The bare homepage and
directory indexes do not perform marketing tracking. Select the same owner Pixel
in Ads Manager, save its matching Events API token, and verify real page views
and conversions with Test Events plus normal Events Manager delivery/diagnostics.
Optimize for the relevant Contact/SubmitForm goal when that is the campaign's
actual outcome; ViewContent alone measures visits.

TikTok appends the real `ttclid` to ad landing URLs. The shared attribution reader
retains it in origin-scoped session storage for the existing 30-minute idle
analytics session, so a later Linktree/form request without the query parameter
can still carry it. A newer real click supersedes it; a new session expires it.
Blocked storage falls back to document memory. No identifier is invented or
carried into dashboard/fixed-route attribution. `_ttp`, IP, user agent and the
owner-scoped hashed anonymous visitor identity continue through the existing
delivery path. Campaign UTMs remain useful for first-party reporting; do not
manually invent click IDs or use test event codes in live campaigns.

Verify first-party cookies in the owner's TikTok Pixel settings. Optional
Advanced Matching of email/phone is a separate data-sharing integration:
this application does not automatically extract or send form answers. Do not
enable broad automatic field collection on arbitrary customer forms without
reviewing which data it would collect and the site's disclosures. A controlled
implementation must use permitted identifiers only, normalize/hash them correctly,
and retain the existing owner and consent boundaries.

Official references: [website connections](https://ads.tiktok.com/help/article/website-data-connection-setup-methods?lang=en),
[matching signals](https://ads.tiktok.com/resources/help/article/how-to-set-up-matching-events-with-events-api),
[cookies](https://ads.tiktok.com/resources/help/article/using-cookies-with-tiktok-pixel?lang=en),
and [standard events](https://ads.tiktok.com/resources/help/article/standard-events-parameters?lang=en).
- Preserve tenant entitlement checks before creating outbox work.

## Adding a tracked Linktree action

1. Define a stable neutral action key.
2. Register its `public_page_actions` row through the supported backend write
   or seed path.
3. Use the shared page tracker in the public renderer.
4. Choose the internal event and TikTok event deliberately.
5. Verify that Pixel and Events API deliveries share the same event ID and
   event name.
6. Add tests for registration, tenant ownership, rapid-repeat suppression,
   navigation delivery, and TikTok eligibility.
7. Run the placement test to prove no new surface mounts the Pixel.

Any request to add TikTok tracking to a surface outside the Linktree/form allowlist is an architecture
and privacy-policy change, not a component-level implementation detail.

## Linktree insights and outcome integrity

Business and Platform Linktree insights use one `PageAnalyticsDrawer`, backed by
their existing owner-scoped endpoints. The centered analytics modal and its
compatibility wrappers are removed. Loading uses that same drawer shell. Requests
are cancelled when superseded or closed; failures remain visible with Refresh.

Contact actions mean outbound WhatsApp/call/email intent, including registered
Contact actions. They do not prove a message was sent, a booking was accepted or
a purchase completed. Those outcomes require a trusted server integration.
The public event endpoint rejects visitor-claimed lead/submission/payment outcomes
on Linktrees. It ignores visitor-supplied revenue. Amount and explicit currency
are retained only for a trusted completed-order transaction; currencies are
reported separately. Unmeasured outcomes/revenue display a dash, not a fake zero.

Action reports include conversion events outside the click-event set, with click
counts filtered independently. Retained contact events are classified at read
time even when older ingestion did not set their conversion flag. Existing
additive rollups remain available for history after raw-event retention; exact
visitors, contact details, sources and device breakdowns use retained events.
This read correction does not rewrite history or replay marketing deliveries.

Active-time snapshots use the shared page tracker and remain first-party only.
They use a per-view ID, report cumulative foreground/focused seconds every 15
seconds and on background/exit, and stop accumulating after 60 seconds without
interaction. Snapshots are durably queued and final reports use the existing
beacon handoff. The report takes MAX per view, then averages measured visits;
15 active seconds qualifies an engaged visit. Hidden/idle time is excluded.
No old duration is invented, and previews never start these measurements. All
storage uses existing event JSONB columns; no migration or data reset is needed.

Traffic-source attribution uses the landing document's reported referrer, UTM
parameters and click ID. The tracking API request's `Referer` header identifies
the current page and must never stand in for a missing landing referrer; doing
so incorrectly classifies direct visits as referrals. This correction applies
to new events, sessions and marketing payloads, without guessing past sources.

TikTok event names are authoritative registered-action values on both channels;
an untrusted browser event-name claim cannot promote a contact to a purchase.
Views retain ViewContent. Engagement and unregistered actions never create an
outbox item. Event IDs, destination ownership/entitlement, bot filtering,
encrypted tokens and the existing retry worker remain shared. Contact events
omit monetary parameters. Test Events must be verified against the real owner
Pixel/token after deployment; local checks do not establish production delivery.

Date filters use calendar dates: Today, Yesterday & today, the last seven dates
including today, All time, or an inclusive custom range. They never claim that
two calendar days represent a rolling 24-hour interval.

## Persisted forms

### Server test panel

Business and Platform TikTok settings share `TikTokTestEventPanel`. Choose a
Linktree or form, a published page, the exact TikTok test code, and ViewContent,
Contact or ClickButton; forms also offer SubmitForm. The selected canonical URL
is shown before sending. Save Pixel/token changes first. Tests send only to
TikTok's test environment and never insert form responses, analytics conversions
or marketing outbox rows.

Owner-scoped `GET .../tiktok/test-pages` endpoints return eligible published
pages in 100-item cursor batches. Both dashboard adapters use the same service;
Platform resolves its internal workspace on the server. The POST test request
uses JSON and an optional `page_id` public-page identity, revalidated against
owner, source status and live eligibility before sending. Omitting `page_id`
retains legacy automatic selection. SubmitForm is rejected on Linktrees. Test
parameters use a registered matching action when available. Only HTTP success
with TikTok code `0` is acknowledged; HTTP errors, validation details and provider
request IDs remain visible. Never send an Events API token from this panel's
browser request or attach a test code to normal production conversions.

Confirmed browser conversions are dispatched once per submission event ID within
the shared page tracker. A throwing browser SDK does not change a saved response
into a failed submission; the existing server delivery remains independent.
Failed dispatches can be retried with the same ID, preserving TikTok deduplication.
The existing opt-in `?ttdebug=1` report identifies missing active Pixels, missing
submission actions and dispatch exceptions. A dispatch entry means the event was
handed to the browser SDK, not proof that TikTok received it.

For website form campaigns, select the owner Pixel and `SubmitForm` optimization
event after verifying a successful submission in TikTok Test Events. The app
already sends that event after saving; avoid adding an Event Builder button-click
rule for the same submission, which would create an independent extra event.

### Linktree WhatsApp question attribution

The shared tracker attaches a saved question ID to the registered WhatsApp contact
action. Different questions remain distinct even when they share message text;
rapid repeated taps on the same question are deduplicated. The server resolves
the label from the page-owned `whatsapp_questions` row and rejects unknown IDs and
visitor-supplied labels. Message bodies and video URLs are not question analytics
properties, and question destinations have query strings removed before storage.
Chooser opens and dismissals are first-party engagement events only, validated
against a page-owned WhatsApp action. Selection closes do not count as dismissals.

Public rendering, attribution, and the current-question report all use
`whatsapp_questions`, with `linktrees.whatsapp_modal_enabled` taking precedence
over the legacy JSON flag. The editor's `template_config.whatsapp_modal.questions`
copy can contain stale or temporary IDs and is never an analytics authority.
Create/update use `syncWhatsAppQuestions`: existing IDs are retained only when
they belong to that Linktree; new questions receive server-generated IDs. Editing
wording, reordering questions, or saving unrelated settings therefore preserves
history. Removed questions remain visible through retained event snapshots.
No schema migration or existing-data rewrite is needed. Events whose question ID
was already discarded cannot be safely assigned to a question afterwards.

The report includes current questions with zero selections, retained historical
questions, selection counts, unique visitors, selection share and last selection
time within the selected dates. The drawer omits per-question link breakdowns;
the separate Buttons section retains button-level click totals. These measurements start when the
updated public tracker is deployed; no past selections are invented. They measure
contact intent, not delivery or confirmed sales. Existing JSONB event storage is
reused with no migration or reset. Analytics controls use the shared dashboard
theme/language controls; engagement, confirmed outcomes and question details are
collapsed by default and retain expansion when the language changes.

Public `/form/<slug>` pages use the shared first-party tracker for views, starts and final actions. Accepted submissions call `UnifiedAnalyticsService` atomically with response storage and link the analytics event for attribution. Actions are registered through the form public-page trigger. Published forms resolve owner-scoped Pixel IDs through `PublicPageAnalyticsService`, including the platform workspace. Both SSR base code and the browser Pixel are restricted to public routes. Accepted submissions enqueue `SubmitForm` in the same transaction as response storage; the browser fires `trackServerConversion` only after success with the submission request ID. Retry receipts do not create another server event. The generic analytics endpoint rejects claimed form conversions. Starts remain internal engagement. The form outbound allowlist accepts page views, transaction-backed submissions and registered final button clicks; it does not emit checkout, purchase or registration events, trust visitor-supplied conversion names, or invent monetary value/currency for leads. The shared attribution reader carries bounded `ttclid` and `_ttp` alongside server IP/user agent and a hashed visitor identity; no response values enter marketing delivery. Active owner entitlement, encrypted destination tokens, bot filtering, outbox batching and retry/dead-letter handling are reused. Verify a real published URL with TikTok Pixel Helper and Events Manager Test Events after deployment; a Pixel ID enables browser delivery, and each destination needs its own valid Events API token for server delivery. See [Forms](forms.md).

Implementation references: [TikTok Events API](https://ads.tiktok.com/resources/help/article/events-api?lang=en), [standard events](https://ads.tiktok.com/resources/help/article/standard-events-parameters?lang=en), and [deduplication](https://ads.tiktok.com/resources/help/article/event-deduplication?lang=en). Use matching event names and IDs on both channels; do not infer registration or purchase events from a lead submission.

TikTok health reconciliation counts distinct analytics event IDs accepted by at
least one destination. Sending one conversion to two Pixels is one accepted
conversion, while delivery/queue/failure counters still count destination rows.
These are Events API acknowledgements, not an estimate of attributed Ads Manager
conversions. No history rewrite or migration is needed for this read-query fix.

### Analytics delivery consistency

The outbound navigation handoff carries the bounded saved WhatsApp question ID,
so a redirect that arrives before the beacon/batch retains the same question
attribution. Ingestion still resolves the saved label and validates page/action
ownership; retries keep the original event ID and never add another conversion.
Chooser opens and dismissals use immediate first-party handoff and do not fire a
Pixel. Selecting a question does not record a dismissal.

Event rows and daily rollups use the same conversion decision, including
registered Contact actions and transaction-backed form submissions. Linktree
summary reads recover retained historical contact conversions where possible;
missing historical question IDs cannot be reconstructed from totals.

TikTok health filters by event occurrence in each page's timezone, including
delayed deliveries in the original event's date range. Browser-event totals count
distinct events, independently of the number of destinations or availability of
an Events API token. New events retain the validated browser-dispatch claim in
their properties; older events fall back to outbox metadata. This is a browser
dispatch report, not proof that TikTok received a browser event. Server delivery
requires both a successful HTTP response and TikTok response code `0`; malformed
or missing acknowledgements retry instead of being marked delivered.

## Linktree sponsor attribution

Optional sponsor links use registered action key `page:sponsor-click`. The migration and fresh baseline register/update it from the owning public page's sponsor configuration and hide it when disabled or destination-free. Metadata marks it `engagement_only=true`. Public clicks call the shared page tracker's `trackEngagement("action_open", ...)` with immediate navigation delivery; they are never browser Pixel or Events API conversions. Drawer previews and the untracked default-Linktree homepage do not report sponsor actions. Sponsor logos are presentation, not image-open actions.


TikTok delivery notices show only the latest failed attempt for unresolved deliveries.
Successful deliveries disappear automatically; the view refreshes every 30 seconds
while visible. Dismiss notices acknowledges observed attempts for the authenticated
owner across sessions without deleting history, stopping retries, or changing health
and reconciliation totals. New failed attempts appear again. Provider details are
collapsed behind readable, localized error explanations.
Apply `2026-11-09_tiktok_delivery_dismissals.sql` through `pnpm db:migrate` before
running the updated diagnostics API. The additive nullable column preserves old
application compatibility; leave it in place on application rollback.
