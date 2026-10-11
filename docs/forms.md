# Forms

## Scope and implementation plan

Custom and personal questions share one ordered editor list and drag group in
both layouts and dashboards. The existing pointer/touch handle, held/target
feedback and keyboard Up/Down controls move questions across categories while
preserving stable IDs and conditional dependencies. Category-specific Add menus
remain available below the list; previews and saved definitions use the same
question sequence. Moves that place a conditional question before its source
are rejected with the existing inline explanation.

Business Forms is available only on the Max subscription plan. The shared business navigation hides Forms on Basic, Pro and Ultra and redirects unavailable direct dashboard routes. Authorization enforces the subscription-plan ceiling independently of editable permission profiles, including uploads and response management. Public form reads, submissions and sitemap entries also require a live Max subscription; downgrading preserves definitions and responses for a later upgrade. Platform workspace forms retain platform permission checks. Fresh-install grants are limited to Max; existing grants cannot override the runtime ceiling.

Response deletion confirmations use the shared confirmation dialog above the analytics drawer (layer 150 above layer 140) in both Business and Platform dashboards.

Turn the shared Form/Card editor into an owner-scoped publishing and response service. Reuse the Linktree host resolver, dashboard components, authorization, storage and analytics pipeline. Keep dashboard previews temporary; collect responses only on published public pages.

1. Validate complete definitions on the server and introduce durable forms and response tables.
2. Bind business operations to the authenticated business, and platform operations to the internal workspace. Reserve title-derived public slugs transactionally.
3. Persist editor media through the existing owner-scoped upload service. Connect shared grid/table views to paginated summaries and fetch full definitions only for editing/preview.
4. Render both layouts at `/form/<slug>` using the existing preview components, with real submission validation and explicit privacy acknowledgement.
5. Record accepted submissions and first-party conversions in one database transaction. Expose owner-only response history and real summary statistics.
6. Verify lifecycle, revision conflicts, tenant isolation, uploads, retries, analytics boundaries and both dashboard configurations. Update legal disclosures and deployment documentation.

## Ownership and URLs

Analytics Export retains CSV full exports and offers an export-only date
range panel in both dashboards. Shared date inputs select inclusive start/end
calendar days in UTC; missing/reversed ranges show an inline error. Range exports
respect the current search, paginate through the existing owner-scoped response
API with one stable snapshot, and include the selected dates in the filename.
The range never changes the response list or analytics filters.

Required questions render labels without asterisks in both form/card previews
and public pages. Required flags, native input constraints, conditional validation
and server-side submission requirements remain unchanged.

Uploaded form banners fill the available width and use their natural image
proportions for height, including carousel slides. The shared media renderer
applies this behavior in both dashboard previews and public forms at every
viewport size; only empty banner placeholders retain a fixed height.

All form editor image pickers share the optional, lazy-loaded `ImageCropEditor`.
Cropping replaces the content inside the existing drawer instead of opening a
second dialog; the hidden builder remains mounted to preserve unsaved edits,
expanded sections and image selection. Cancel/Confirm return to that editor and
restore focus to the Crop action. Main form save actions are unavailable during
cropping, and the drawer cannot close while a confirmed crop is being processed.
Crop Confirm/Cancel actions occupy the drawer's fixed footer and
use the same compact, right-aligned sizing as wizard actions. The control
strip shares the crop canvas's dimmed checkerboard, and crop views omit the
form-editing subtitle and the extra visible instruction paragraph. Reset and zoom
buttons sit below the image on a checkerboard visible in light and dark themes;
there is no zoom slider. Pinch zoom remains available on touch devices.
Reset and zoom share white surfaces with subtle gray hover states in light mode
and slate surfaces in dark mode; zoom uses the shared icon button's surface tone.
The workspace groups the checkerboard canvas and attached preview panel in one
rounded surface. The panel shows output dimensions and a clickable preview that
opens the current crop at output resolution in the shared `FullscreenImageViewer`.
Opening/closing the viewer never confirms or changes the crop. Composition
guides are always visible in the editor and never appear in the exported image. The image
area grows on desktop, while mobile stacks the preview below it.
Every crop starts in Free proportions with the full source image selected.
Logo output remains up to 720 px and other images up to 1440 px on the longest
edge, independently of the selected proportions. The shared ratio dropdown offers
Free proportions, Original, 1:1, 4:3, 16:9 and 9:16. Eight pointer/touch/keyboard
handles resize the crop rectangle; the entire edges show directional resize
cursors, with diagonal cursors at corners. Free allows independent width and height,
while presets lock their proportions. Moving/resizing the frame retains the image
position. Users can pinch/adjust zoom, reset, preview and optionally
fill blank areas with a Gaussian-blurred copy. Cancel preserves the source. Confirm
replaces only the selected image, retaining carousel order and image descriptions.
Native canvas exports PNG (WebP fallback or smaller PNG if needed) through the existing raster
validation and owner-scoped save/upload flow; no remote sources or new backend
upload paths are introduced. Errors stay inline and interrupted edits cannot replace
a different image. Both Business and Platform use this same implementation.
Blur uses a cached, small Gaussian raster to remain consistent without relying on
the [limited-availability canvas filter API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter).

Business forms belong to the session's business, never a body/query owner identifier. Platform forms belong to `PlatformContentWorkspaceService`. Business forms are served on that business's subdomain or verified custom hostname; platform forms are served on the configured root origin. The route is `/form/<slug>`.

The separate required form title (`name`, maximum 100 characters) owns only the internal dashboard name and public URL. Introduction `headline` is optional, independently authored and never renames a form. Both public layouts omit the introduction heading when it is empty; the internal name is never a public heading or browser/share title fallback. Browser/share metadata uses the public headline, with a generic localized form title when absent. Slugs use the existing lowercase ASCII style with hyphens, up to 60 characters; titles without a usable ASCII slug receive a deterministic title-derived `form-<hash>` URL. Existing titles/URLs remain unchanged until the title is edited. Saving an edited title updates its URL, with an inline warning to update shared links. Business and Platform editors share a debounced, abortable title availability check and display the resulting `/form/<slug>` inline. Authenticated `GET /title-availability?title=...&excludeId=...` endpoints resolve the owner on the server, verify ownership of edited IDs and reserve archived and paused URLs too. Saves repeat the check before uploading media. Create/update use the same owner advisory lock and existing unique index; collisions return `FORM_TITLE_TAKEN` and focus the title field rather than silently adding a suffix. Different owners can reuse a title. Public forms use live, uncached availability checks and content-based indexing eligibility (public headline and useful description required). The shared proxy probes a lightweight availability endpoint before streaming so unavailable forms return HTTP 404 and transient failures return 503.

## Persistence and lifecycle

`forms` stores owner, slug, name, layout/configuration JSON, Active/Paused status, independent archive flag/time, revision, cumulative submission count and timestamps. The server owns these metadata fields even when the editor sends a full draft.

- Complete new definitions are Active (`active`); incomplete definitions are saved as Paused (`paused`). These are the only form statuses. A form title and at least one question are required to save; the introduction headline is optional.
- Activate validates the entire public definition. Paused forms cannot be read publicly or accept responses.
- Archive is dashboard organization only: `isArchived` moves a form between the Active and Archive tabs without changing its Active/Paused status, public availability, revision, images or responses. Restore preserves that status. Active archived forms still accept responses; Pause is the control that stops them. Archive-tab forms can be edited, paused or activated using the same controls.
- Editing a published form must leave it valid. Updates compare revision and status before writing; conflicts return 409 rather than overwriting another editor.
- Duplicate allocates a new form/slug without copying response history.
- Delete permanently cascades responses, public-page identity/actions and associated page analytics. Referenced assets use existing storage retention/cleanup rules; duplicates keep shared images referenced.

`form_submissions` stores a receipt UUID, unique per-form retry UUID, form revision, server-owned question labels and validated answers, privacy acknowledgement/version, submission timestamp, completion duration and optional linked first-party analytics event. Public responses never expose this table. Archive and pause do not delete submissions. There is no automatic response expiry or external lead delivery integration; the owner must arrange appropriate retention/deletion. Individual response deletion/export is not part of this release.

## API

Business management uses `/api/forms`; platform management uses `/api/platform/forms`. Both use the same service and response contracts.

| Operation | Method and suffix |
| --- | --- |
| Summaries | GET `?page=0&q=&filter=active` (or `archived`) |
| Metrics | GET `/stats` |
| Full definition | GET `/:id` |
| Create | POST collection |
| Update | PATCH `/:id` |
| Availability | PATCH `/:id/status` with `active` or `paused` |
| Archive/restore | PATCH `/:id/archive` with boolean `isArchived` |
| Duplicate | POST `/:id/duplicate` |
| Delete | DELETE `/:id` |
| Responses | GET `/:id/submissions?page=0` |
| Per-form analytics summary | GET `/:id/analytics` |
| Upload raster | POST `/upload` |

Summaries paginate in pages of 20; responses default to 20 and allow validated sizes of 50 or 100; summaries exclude full question/CSV/media configuration. Search treats `%` and `_` literally. Business and platform read/create/update/delete/upload capabilities are enforced by the established guards. Existing plan access is seeded from equivalent Linktree grants. Upload entitlement/storage limits still apply; there is no independent forms-count plan quota.

Public endpoints are GET `/api/public/forms/:slug`, GET `/:slug/status` under the same prefix and POST `/api/public/forms/:slug/submissions`. Host resolution uses the shared trusted subdomain/custom-host boundary. Redis limits definition reads to 60, lightweight availability checks to 120 and submissions to 10 per minute per IP. Suspended businesses are unavailable.

## Validation and media

Strict schemas reject unrecognized properties, invalid dependencies, unsafe URLs and oversized configuration. Bounds include 50 questions, 50 components, 20 choice answers, 10 conditional CSV columns/5,000 rows and 10 final actions. The existing editor may use tighter UI limits. Published choices require distinct nonempty options; conditional questions require a valid CSV path. The server independently enforces required fields, email/date/age/phone validation, allowed choices and question visibility. Hidden answers are discarded. Phone responses are stored with the selected calling code (default Iraq +964); matching pasted international numbers and Iraqi domestic leading zero are normalized.

Final actions accept credential-free HTTP(S) destinations; app actions require at least one store destination. Uploaded JPEG/PNG/WebP images are limited to 5 MB and 40 million pixels, decoded and normalized to PNG with a maximum dimension of 2,048. Every saved local image URL must belong to the owner. SVG/remote image URLs are rejected. Unsaved data URLs are decoded locally into multipart upload files during save (without fetching data URLs or relaxing CSP), with duplicate image data uploaded once per save. Upload failures name each affected section and image/option number in the footer; selecting a location opens its editor, and failed pickers show the localized error inline. Existing orphan cleanup handles images from interrupted saves.

## Shared UI and public submission

`FormsManagementPage` is the single Business/Platform implementation. Scope and typed capabilities select the API and available controls. Grid/table actions share the Linktree action-button treatment: Analytics, Edit, icon-only Delete, the gray public-page button, then the three-dot expander. Expanded actions insert archive/restore followed by pause/activate before Delete, matching Linktree order without reintroducing Duplicate. The public-page button is disabled for paused forms. Forms use a three-column desktop grid and one column on mobile. Form and Linktree collections reuse PageListImage, PageListUrl and PageListTraffic for round media, canonical links with clipboard controls, and unique visitor/interaction counters. Form lists include description and creation time, while a single owner-scoped paginated database projection calculates traffic for the selected rows, excluding bots; no per-card analytics requests are made. Preview and Duplicate are absent from both collections. Analytics opens one shared FormInsightsModal for both dashboards, presented as a wide responsive drawer, combining per-form views, visitors, starts, accepted submissions, completion rate and interactions with compact paginated responses. Expand a row to read full answers and consent/attribution details. Optional overview details show 14 UTC days of accepted responses, average measured completion time, latest submission and the top five response sources, devices and countries. These breakdowns count accepted submissions and can show unknown attribution after analytics retention. Statistics and responses have independent loading, localized errors and retry controls, plus a refresh action. The backend resolves the form's actual public-page identity under the authenticated owner. Form response pagination is zero-based through the FormResponsesDto query boundary; the global one-based page validator for other endpoints is unchanged. Loading/error states, grid/table, drawers, search, preview and editor are shared. Failed saves keep editor data; pending saves lock editing and duplicate submits. Forms show only Active or Paused badges, including in Archive. Paused forms have an Activate action; incomplete final buttons/questions produce a clear activation error. Stale saves explain how to reload the editor. List requests abort stale loads. Response history shows authored answers with submission date, source/campaign, device/country and completion time.

Public rendering reuses `FormPreview`, field controls, conditional selectors, phone selector, privacy footer and final-page components. Public pages use a dedicated responsive presentation: a borderless, full-width page with an edge-to-edge responsive banner, enlarged logo and centered content up to 56rem wide with responsive gutters. Card layout keeps its blurred background and uses the available viewport height, with scrollable questions and separate navigation/footer; ordinary forms scroll above their pinned footer. Public fields use 16px text and 54px controls, including inherited dropdown options; primary actions have a 54px desktop and 48px mobile minimum target. The public viewport keeps its privacy/actions footer pinned while the content scrolls independently, with no fields covered by the footer. Mobile uses a 160px banner, 72px logo and 48px controls; input text remains 16px to avoid browser auto-zoom. Loading skeletons share the public shell. Editor previews keep their compact device frame. Editor page arrows are excluded from public flows so required steps cannot be bypassed. The shared privacy checkbox starts checked in public and editor flows; visitors can uncheck it, and required acknowledgement blocks submission while unchecked. The final page is shown only after a successful server receipt. Failed requests preserve answers and reuse the same request UUID; a completed retry returns the original receipt, including after an edit changed the form revision. New requests against an obsolete revision are rejected.

## Tracking and privacy

Published forms use the approved shared TikTok Pixel/Events API pipeline for page views, accepted submissions and registered final actions. Owner entitlement and active destination groups apply equally to business and platform forms. Starts remain first-party only. Form answers are never forwarded or used for automatic advanced matching; TikTok profiles are never imported. See [tracking](tracking.md) for deduplication and delivery verification.

The shared page tracker records page views, one form start per page instance and registered final-action clicks. Starts, submissions and final actions have `public_page_actions` registrations. The accepted submission records `form_submit` through `UnifiedAnalyticsService` inside the same transaction as the response and counter. No second browser conversion is queued. Shared analytics retains visitor/session HMAC identities, IP HMAC/security signals, device/browser/OS, country, referrer, UTM campaign/source/medium, attribution and bot classification under its existing retention settings. Completion duration is bounded client timing, not a trusted security measurement. Response values and phone/email contact fields are kept out of event properties.

The successful response links its conversion event, allowing the owner to view attribution without joining on personal answers. Acknowledgement records the actual current platform privacy version; stale acknowledgements require reload. Privacy acknowledgement is not marketing consent. Optional consent records no accepted policy version when unchecked. Business disclosures and lawful use remain the business's responsibility.

Metrics are actual page views, unique visitors, starts and accepted response count. Traffic excludes classified bots; accepted response totals come from the durable counter, never a client-forged analytics conversion. These are all-time totals while the analytics retention policy can shorten the available traffic window. Completion rate is a separately labeled last-14-UTC-days measurement over retained tracked sessions. Starts are deduplicated per page/session, and a session completes only when an accepted durable response links to a matching non-bot conversion in that period. Tracking-only conversions cannot improve the rate; missing starts produce an unavailable rate rather than a fabricated zero or a clamped lifetime ratio. The collection overview and individual drawer share this calculation.

## Answer summaries and source performance

Expandable insights include all-time multiple-choice summaries for current questions. Each choice shows count and percentage of nonempty answered responses, including zero-count choices. Historical values from removed choices are grouped as Previous options, preserving the denominator after an edit. Optional and hidden unanswered questions do not count as answers. Private free-text responses are not aggregated into analytics labels.

Source performance shows up to ten sources ranked by completed tracked sessions, then starts. It uses the same 14-day retained cohort as completion rate, with attribution from each session's first start. Duplicate starts and multiple submissions within a session count once for this funnel. Lifetime response/source totals remain separate and can differ from the tracked-session counts. Unknown sources are grouped; bots and other tenants are excluded. No date controls, database migration, new browser event or marketing tracking is introduced.

## Response search and CSV export

The shared Business/Platform drawer presents the original six-card all-time overview (views, starts, accepted responses, completion rate, visitors and interactions), with collapsible response trends and aggregate source/device/country insights. It uses one compact search field with a clear action and a responses-per-page selector. Date filters are not applied to the response table. The shared Export menu offers CSV for the current search, either all matching responses or an inclusive date range. The export-only panel reuses backend date filtering.

Expanded submissions display answers in a compact responsive grid: one column on mobile, two on tablet and three on desktop. The original compact table shows submission time, an answer summary, source, completion time and an icon to expand all answers. Expanded answers retain the responsive grid with full text. Internal response IDs, raw attribution and policy/version fields are omitted from expanded answers; they remain stored and included in authenticated CSV exports. Both dashboards reuse the same detail component.

Response queries accept `q` (up to 100 characters), inclusive UTC `from`/`to` dates, zero-based `page`, and `pageSize=20|50|100`. Search matches authored answer values, response IDs, source, campaign and country. Wildcards are treated literally. Invalid or reversed dates are rejected. Every request resolves business/platform ownership before reading responses. Overview metrics stay all-time; response filters do not silently change their meaning.

The drawer exports all matching responses in cancellable batches of 100 using the same authenticated API. The first batch returns a server-generated `snapshotAt`; later export batches send it as `before`, preventing newly created submissions from shifting the offset. Export checks row counts and duplicate IDs and never downloads a failed or partial result. Close and Cancel remain available while exporting; filters and Refresh are locked to the exported selection, and closing cancels outstanding requests.

Both formats use the same reference-style table: one submission per row, stable metadata headers first (`response_id`, `created_time_utc`, `form_id`, `form_name`, relative `form_url`, source/action, campaign/medium/channel, device/browser/OS/country/referrer, campaign content/term, completion seconds, consent/privacy version/form revision), followed by authored question labels. Current questions preserve their authored order, including unanswered questions; historical answers from removed questions remain included. Duplicate labels and collisions with metadata headers are disambiguated. Unavailable attribution stays blank; no TikTok ad/account fields or inferred tracking values are fabricated. Browser/OS/referrer/content/term come from the existing owner-scoped conversion join, requiring no new tracking or database migration.

CSV uses UTF-8 with BOM, quoted/escaped cells, CRLF records and neutralized formula prefixes. Exports read all filtered pages with the server snapshot cutoff, verify complete unique receipts, allow cancellation and never download an incomplete export. Temporary download URLs are revoked. Exports contain private response data and are only available through existing owner-scoped read capabilities; no public export endpoint is introduced.

## Deployment and verification

Apply forward migrations using `pnpm db:migrate` before restarting the backend/frontend. Fresh installations use baseline parts `65_forms.sql`, `70_public_pages_analytics.sql`, `75_form_analytics.sql` and permission grants in `99_data.sql`. Existing installations use the `2026-10-10_forms*.sql` forward migrations, including `2026-10-10_forms_visibility.sql`. It converts old `ready` to `active` and old `draft` to `paused`. Legacy archived rows remain archived and paused because their previous availability was overwritten; new archive actions preserve availability. Do not reset a deployed database.

Tests cover strict schemas, upload decoding, guard/capability mappings, both dashboard scopes, both public layouts, retry preservation and the shared editor interactions. HTTP pagination tests run both controllers through the real global boundary and validation pipes, covering page zero, subsequent pages and invalid query values. Combined-insights tests cover answers and consent/attribution details, independent failure/retry states, pagination, request cancellation and both API scopes. `backend/test/forms.e2e-spec.ts` creates a separate PostgreSQL database named `sponsor_krd_forms_e2e_<pid>`, applies the complete baseline and drops only that test database. It exercises concurrent slugs, tenant separation, stable URLs, optimistic updates, lifecycle, paging/search, response/analytics atomicity and deletion. It requires a PostgreSQL test user with permission to create databases; it never resets the configured application database.

## Verification on 2026-10-10

Backend unit suite: 787 tests passed. Frontend Forms, Business/Platform integrations and public proxy checks: 226 tests passed. Isolated PostgreSQL integration suite: 8 tests passed, including independent archive/status behavior and repeatable legacy migration. TypeScript, frontend/backend lint and both production builds passed. Live local checks confirmed the management endpoint rejects missing sessions (401) and an unavailable public form returns HTTP 404 with noindex. Local forward migrations, including archive/status separation, were applied; production rollout still requires the documented migration and application deployment steps.

The shared forms collection and its loading skeleton use three columns on wide desktop screens, two at intermediate desktop widths, and one on smaller screens, matching the shared management grid.

Form media opens the shared unframed full-screen image viewer, with close/outside-click/Escape, gallery arrows, keyboard navigation, wheel and button zoom, mouse dragging and native touch scrolling/pinch. Viewer controls use the form language and preserve keyboard focus.

After a successful public submission, both layouts show shared return guidance. An HTTP(S) referrer gives a return link with query/hash removed and credential URLs rejected; missing sources give close/back guidance. An explicit `utm_source=tiktok` without a usable referrer offers Open TikTok (its website), never an unsupported app deep link or automatic redirect. Existing business final actions remain available. Return clicks use the shared first-party tracker and registered `form:return` action; apply `2026-10-11_forms_return_action.sql` with the normal migration command. Published form final actions use the shared owner-scoped TikTok pipeline.

The shared analytics drawer reuses the editor’s controlled dashboard language/theme controls. Header order is Refresh, Export CSV, Delete all form data, Language, Theme, Close; mobile stacks the title above controls. Data deletion requires the owner-scoped FormsDelete capability in each dashboard and an explicit permanent-deletion confirmation. It clears all responses, views, starts, events, daily page/action summaries and unused visitor/session records for the selected form, regardless of search. The form definition, publication status and other pages' tracking are preserved. A transaction locks the owned form (the same lock used by submissions and tracking ingestion), reuses the unified analytics cleanup and resets the durable response count. The delete action remains available for forms with traffic but no responses. Both drawer data and dashboard collection totals refresh after success; failures remain in the confirmation with an inline error. Visitor/session identities shared with other pages are retained while those pages still reference them.

## Search and loading

Useful active forms with a headline and meaningful introduction description are
indexable and included in the owner-scoped sitemap. Empty/starter descriptions
remain noindex. Archive does not change public availability or indexing by itself;
pause removes availability. Canonical, sharing metadata and document language
come from the public definition, never submissions. Both layouts use responsive
saved images, eager first-screen banner/backdrop loading and an on-demand
fullscreen viewer. See [SEO policy](seo.md) and the
[research and measurement plan](public-form-seo-performance.md).

New forms default to Kurdish, dark appearance and red (`#ef4444`); saved
form appearance remains unchanged. Shared Form/Card privacy checkboxes start
checked and can be unchecked; required consent still blocks submission when
unchecked. Privacy help is rendered in a viewport-positioned portal so scrolling
containers cannot clip the explanation or policy links. Browser tab titles use
the form name; tab icons use the uploaded introduction logo, then the current
owner's public business logo, then the shared placeholder. Shared list dropdowns
use compact neutral selection/hover states with reduced-motion support.

The shared public/preview Send action stays disabled until all visible required answers are valid and required privacy acknowledgement is checked. Card Next actions validate their current questions; the final Send checks the entire visible form, including earlier cards. Hidden conditional questions do not block submission. Native form validation and server validation remain enforced; the browser `SubmitForm` conversion runs only after an accepted server receipt.
