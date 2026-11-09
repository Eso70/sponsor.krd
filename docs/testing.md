# Testing and verification

`test/six-fixes.e2e-spec.ts` creates/drops only its guarded
`sponsor_krd_six_fixes_test_<pid>` PostgreSQL database and uses a unique Redis
prefix. It verifies counter concurrency, window expiry and orphan repair; HTTP
429/503 submission boundaries; direct/approved/onboarding/platform TikTok policy,
encryption and owner isolation; and rollback/retry of deletion with business-authored
messages without removing another tenant's data. Unit lifecycle tests exercise
both scheduler consumers and Nest's dependent-provider shutdown ordering.

Retention lifecycle regressions use fake timers and a real Nest module teardown
to verify cancellation before startup, unchanged scheduling cadence, waiting for
an active check before the database closes, completion of an active cleanup,
and failure logging/retry. The complete backend integration suite must finish
without delayed `Scheduled data retention failed` errors after application close.

Security-hardening regressions cover encoded Fastify impersonation routes,
temporary versus permanent analytics failures, Redis write failures before
email delivery, credential-free Redis diagnostics, successful analytics-share
unlocks and bounded incorrect guesses. Shared origin rules have package tests
plus frontend/backend adapter coverage. Session UI tests cover owner and
administrator scopes and confirmation behavior; Ads tests reject forged
callbacks and ensure retired routes never contact TikTok.

`test/platform-session-security.e2e-spec.ts` creates only its own
`sponsor_krd_sessions_test_<pid>` database. It proves session-hash migration
reruns, preserved old cookies, digest replay rejection, logout, and concurrent
administrator sign-ins leaving one valid session. It never migrates or resets
the configured application database.

That suite also exercises real Redis cleanup before and after database token
hashing, stale tracking sets, scoped preservation, idempotence and unavailable
Redis. `signup-session-transaction.e2e-spec.ts` uses its own guarded PostgreSQL
database to verify email/Google rollback and retry after failed writes, ambiguous
writes and commit failures.

The communications smoke command runs the maintained `communications smoke`
case in `app.e2e-spec.ts`, using real session creation and the same HTTP guards.
It overrides `DB_NAME` with `sponsor_krd_communications_test`; initialize that
dedicated disposable database with the normal migration command first. Optional
`COMMUNICATION_SMOKE_DB_NAME` must match `sponsor_krd_communications_test` with an
optional lowercase alphanumeric suffix. It never uses the configured application
database name. The fixture sends no email and cleans its scoped Redis keys.

`test/analytics-sharing-limits.e2e-spec.ts` exercises the real Redis Lua limiter
with more than fifty successful viewers and concurrent incorrect guesses. Its
unique key prefix is deleted at teardown without flushing shared Redis data.

The November 3 hardening was checked with frontend/backend/shared TypeScript,
lint, the complete unit/component suites, and disposable PostgreSQL/Redis E2E
fixtures. The frontend production build uses the documented Webpack command;
the default Turbopack worker crashed on this Windows host with both Node 24 and
26. Framework worker failures must not be mistaken for application test passes.

Audit-regression coverage includes scheduled cleanup failure/retry, malformed
tracking cookies, pin validation and owner-scoped approval replay, settings-tab
draft isolation and upload/save permission alignment. Platform General settings
has unit and guarded PostgreSQL tests proving rollback of both sections when
the branding write fails. Shared editor tests cover both owner adapters, stale
reads, cancellation and approvals. Public/managed template normalization is
checked against the same implementation with explicit safe-read behavior.
Banner tests locate the viewport ancestor semantically; analytics parity mocks
the shared request helper and waits for loaded totals. Forms pagination fixtures
use the current 15-item contract.

Public directory coverage includes the proxy's bare-route allowlist and malformed
path rejection, shared Business/Platform directory rendering, empty states in
three languages, same-context links, pagination and bounded campaign forwarding.
The PostgreSQL fixture in `linktree-analytics.e2e-spec.ts` verifies cross-owner
isolation, publication status and archive-independent public access, live Forms plan gating, public-only summaries,
missing/suspended businesses and disjoint paginated results.

Default-Linktree homepage coverage:
- `business-homepage.spec.ts` checks off/missing defaults, host-derived tenant
  routing, custom domains, and exclusion of the platform root.
- `BusinessSettingsPage.spec.tsx` saves, reloads, and disables the preference in
  Kurdish, Arabic, and English.
- `PublicLinktreeContent.spec.tsx` verifies shared rendering with the explicit
  homepage marketing exclusion; pixel placement still constrains mounts.
- `linktree-analytics.e2e-spec.ts` checks real PostgreSQL persistence, partial
  updates, cross-owner isolation, and inactive default exclusion and archive-independent public access.

Linktree tracking regression coverage includes a real PostgreSQL fixture:
`pnpm --filter backend exec jest --config test/jest-e2e.json --runInBand linktree-analytics`.
It creates and removes only its guarded `sponsor_krd_linktree_analytics_e2e_<pid>`
database. It checks redirect-first question attribution, retry idempotency,
Business/Platform ownership, retained zero-selection questions, browser-only
tracking, multiple destinations, and page-local calendar filtering. Frontend
`LinktreePage.tracking.spec.tsx` checks immediate chooser engagement, selection,
dismissal and preview exclusion; the shared analytics drawer integration tests
cover both dashboard data sources.

Linktree viewport fitting has focused coverage for footer reservation, bounded
scaling, restoration to full size, resize batching, content changes and cleanup.
Banner tests cover single/carousel edge-to-edge rendering, preservation of the
reserved height ratio, removal of the shared maximum-button-width limit and
decoded dimensions for legacy images. Browser verification checks image bounds
against the screen width while template scaling is active.
WhatsApp dialog tests cover native cancellation, reopening, focus return,
backdrop dismissal and preserved question messages. Tracking tests also assert
that opening/closing the chooser does not rerender the memoized template.
Scroll-lock tests cover nested overlays and isolated iframe documents. Since
jsdom has no native dialog implementation or layout engine, its lifecycle shim
does not replace browser checks of fitting, top-layer focus and list scrolling.
Mobile fit regression coverage includes a VisualViewport shorter than the layout
window, browser-bar resize events, pinch-zoom preservation and restoration of
the app shell's minimum height. Dialog focus tests model a native browser that
initially focuses Close and verify that opening focuses the panel instead.
Outside-touch dismissal tests assert closure before any compatibility click,
cancel the touch end to prevent tap-through, suppress duplicate callbacks, and
preserve inside touches, drags, canceled gestures and multitouch.
Question-theme coverage verifies white defaults on dark pages, isolated control
colors, saved custom colors, live preview updates and save/reload in both owner
integrations. Backend config tests preserve legacy JSON and normalize unsafe
color input. The shared video-message regression asserts URL-first ordering
while keeping questions without a video unchanged.

The question fixture deliberately stores different editor JSON IDs and canonical
`whatsapp_questions` UUIDs, matching real public payloads. It also covers missing
JSON copies, disabled modals, cross-page IDs, question edits/reordering/removal,
unique visitors and historical labels. Both owner integrations assert unrelated
Linktree edits preserve question IDs. The phone validation suite resolves its
metadata dependency relative to this workspace's shared package; collection-pin
coverage uses the documented 15-row form page size.

The architecture HTTP suite gives its real Redis client a unique key prefix
per run and removes only that prefix at teardown. It must never call FLUSHDB
or FLUSHALL against a shared Redis server. Scoped pattern cleanup accounts for
ioredis automatically prefixing commands and SCAN returning physical keys.

For SEO changes, `pnpm --filter frontend test:seo` starts an isolated Next
preview with a disposable fixture API, without database writes. It tests raw
HTML, two tenants with identical slugs, robots/sitemaps, share images, real
anchors, noindex, crawler agents and HTTP status/redirect behavior. See
[SEO verification and live deployment checks](seo.md).

The SEO HTTP suite also checks the real root homepage and existing service routes
in all three languages, trusted canonicals, marketing Pixel exclusion, and one
service data read shared by metadata/body. Run this fixture sequentially after
an isolated frontend build: Next rewrites the workspace's generated type files
even when distDir is separate, which can trigger a dev reload during a request.
`seo-production-audit.mjs` checks the actual canonical tag and social image status,
MIME/PNG dimensions, and reports response-header/body timings. Its nonzero exit
on a failed image must not be mistaken for an ordinary successful page audit.

Set `SEO_SMOKE_FORMS_LOADING_ONLY=1` when running that command to test the real
Next.js server/client boundary for Forms loading. Disposable authenticated
fixtures cover Business and Platform routes in English, Arabic and Kurdish;
the checks require successful HTTP responses, the shared three-column grid,
and no function-serialization errors. This mode does not write application data.

The HTTP fixture also serves custom-domain dashboard entry through the real
Next.js server without changing host, rejects inactive default-host pages and
APIs without redirects, blocks platform/internal APIs on customer hosts, and
restores the default public page after domain removal. Backend tests verify
server-resolved business sessions and hostname-bound single-use handoffs.

Everything, in one command:

```bash
pnpm verify
```

That runs lint, type-check, test, and build across both applications. `lint`
and `type-check` never write to the working tree, so the same command is
safe in CI. Use `pnpm lint:fix` when you do want ESLint to apply fixes.

Individual applications:

The migration upgrade suite also recreates the previous Linktree content column
names and field catalog in its guarded disposable database. It runs the actual
migration command for both an empty ledger and an already-recorded baseline,
checks retained page content and public-page IDs/URLs, and verifies rerun safety.
Run it with `pnpm --filter backend exec jest --config ./test/jest-e2e.json --runInBand migration-upgrade`.

```bash
pnpm --filter backend lint
pnpm --filter backend type-check
pnpm --filter backend test
pnpm --filter backend test:e2e
pnpm --filter backend build
```

```bash
pnpm --filter frontend lint
pnpm --filter frontend type-check
pnpm --filter frontend test
pnpm --filter frontend build
```

## End-to-end suite

`pnpm test:e2e` needs no environment set up by hand.
`backend/test/e2e-environment.ts` runs before any module loads and resolves
what the suite depends on:

- It loads the `.env` files in the same order the migration scripts do.
  `migration-upgrade.e2e-spec.ts` connects with raw `pg` pools and had nothing
  to load them, so the run used to die on the first connection with
  `client password must be a string`.
- It pins `ROOT_DOMAIN=localhost`. Every injected request is addressed to a
  `<subdomain>.localhost` host and `BusinessGuard` derives the tenant by
  stripping the root domain off it, so a developer value such as
  `lvh.me:3011` leaves no derivable subdomain and a valid session is rejected
  as `Invalid business session`. The `x-subdomain` header is not a way around
  that — `internal-proxy-trust.ts` ignores it without an internal proxy key.
- It defaults `DB_NAME` to `sponsor_krd_e2e`, and never overrides a name that
  already looks disposable. Both suites truncate tables and drop databases,
  and both refuse to run against a name that does not look disposable; this
  only supplies a safe default.

An e2e spec must not depend on the developer's `.env`. Anything it needs goes
in that setup file, so the result is the same on every machine.

No fixed passing-test count is documented because the suite changes with the
code. Use the command output from the current revision as the source of
truth.

## Proportionate verification

Custom-domain coverage verifies automatic activation for many businesses across clustered
workers, corrected-DNS reconnection, expired/suspended exclusions,
one-domain-per-business enforcement, bounded concurrency and retry after worker failures. Shared dashboard
tests cover automatic status updates in business and platform contexts, hidden
tabs, request overlap and unmount cancellation. The domain e2e suite uses only its
disposable database with stub DNS/TLS; production DNS and certificate issuance
still require deployment verification.
DNS verification tests cover configured trusted resolvers, invalid resolver
configuration, missing versus mismatched proofs, token-free diagnostic logging,
and transient lookup errors. Both dashboard integrations cover current lookup
errors taking precedence over previously recorded ownership failures.
Routing tests cover default-only/custom-only transitions for public pages,
dashboard and APIs, uncached inactive-host 404s, fail-closed resolver outages,
and deletion restoring default routing.
Business/platform integration tests cover confirmation layering, keyboard
focus restoration, keeping the parent dialog open and successful removal. The
shared confirmation has a keyboard focus-trap regression test.

Subdomain policy coverage includes permanent/custom reservations, occupied names,
administrator-only policy mutations, stale signup availability responses, inline
request failures, and Kurdish/Arabic/English settings. The focused database suite
`backend/test/subdomain-policy.e2e-spec.ts` creates and drops only its own
`sponsor_krd_subdomain_test_<pid>` database. It verifies fresh baseline and forward
migration reruns, direct-write enforcement, block removal, existing reservations,
and concurrent block/assignment writes without changing the configured database.

Do not run every repository test after every localized change. Verification
must be proportional to the scope and risk of the work:

- Run the directly related unit, component, or integration tests for a
  localized change.
- Run the affected application's type check or lint only when the change can
  influence types, imports, framework rules, or shared code.
- Run an affected production build when changing routing, framework
  boundaries, build configuration, or server/client composition.
- Run a complete application or repository suite only for broad cross-cutting
  changes, shared infrastructure changes, security-sensitive work, database
  changes, release preparation, or when focused verification reveals possible
  wider impact.

Do not repeatedly rerun an unchanged full suite within the same task. Record
the successful result and rerun only the checks affected by subsequent edits.
This keeps feedback fast and avoids consuming unnecessary development time and
compute while preserving risk-based confidence.

## Commands reference

| Command                                          | Action                                                       |
| ------------------------------------------------ | ------------------------------------------------------------ |
| `pnpm lint`                                      | Run ESLint over both applications without writing changes    |
| `pnpm lint:fix`                                  | Run ESLint over both applications and apply fixes            |
| `pnpm type-check`                                | Run TypeScript over both applications without emitting files |
| `pnpm test`                                      | Run the frontend Vitest suite, then the backend Jest suite   |
| `pnpm test:e2e`                                  | Run the backend e2e configuration                            |
| `pnpm verify`                                    | Run lint, type-check, test, and build in order               |
| `pnpm --filter frontend test`                    | Run the Vitest suite once                                    |
| `pnpm --filter backend test`                     | Run Jest unit/property/integration specs under `backend/src` |
| `pnpm --filter backend test:e2e`                 | Run the Jest e2e configuration                               |
| `pnpm --filter backend test:cov`                 | Run backend tests with coverage                              |
| `pnpm --filter backend test:communication:smoke` | Run the communication database smoke script                  |

Application-specific lint/build/dev commands are in
[docs/frontend.md](frontend.md#commands) and
[docs/backend.md](backend.md#commands). Database commands are in
[docs/database.md](database.md).

Schema-command verification must cover fresh, complete-current, supported
unledgered, partial/unknown, failed, rerun, and concurrent `db:migrate` paths,
plus a `db:reset` path that proves an unrelated sentinel table is removed and
the consolidated schema is recreated. Use only disposable PostgreSQL and Redis
services. Never run `db:reset` against valuable data.

Request-boundary tests cover malformed UUIDs, pagination bounds, invalid enum
actions, unknown/invalid bulk-link payloads, both supported batch-link shapes,
invalid nested URLs and deletion IDs, and valid payload preservation.

Response-boundary tests exercise the real Nest/Fastify serialization path.
They cover canonical and legacy-compatible internal successes, validation
details, and generic unexpected failures.

Frontend request-boundary tests cover shared credentials/cache defaults, JSON
serialization, M2 envelope unwrapping, normalized error metadata, and abort
preservation. Feature-hook tests continue to cover domain normalization and
local state transitions independently from transport parsing.

Shared-dialog tests cover focus entry, forward and reverse focus containment,
and restoration to the element that opened the dialog.

Administration-query tests verify pagination transformation and maximum
limits, secret-free business list projections, and bounded billing joins.

H6 characterization coverage protects extracted hotspot seams: public-page
projections retain every required alias, while the business analytics hook
preserves summary normalization, initial loading, and reset behavior.

Repository tests protect the persistence seams for analytics reads, business
administration, and billing. They assert tenant and
publication constraints, bounded pagination inputs, and the identifiers used
to target cache invalidation. Service characterization tests continue to
protect response mapping and transaction orchestration.

Authorization tests verify that Linktree creation uses the public-page quota
and that the quota query reads the tenant-owned Linktree table.

Module-boundary tests keep the global-module allowlist limited to PostgreSQL
and Redis and assert the explicit auth, billing, and observability imports of
their consuming domains.

Public-read tests protect the subdomain-scoped Linktree lookup and assert that
the removed unscoped legacy method is not exposed again.

Security-gap regression tests verify authentication, tenant isolation, request
validation, rate limiting, and authorization boundaries. CSP tests require a
per-request nonce plus `'strict-dynamic'`, reject
`'unsafe-inline'` from `script-src`, and keep `'unsafe-eval'` development-only.
Retention tests cover the communication-history policy and eligible counts.

## Critical architecture E2E matrix

CI runs the backend E2E suite against disposable PostgreSQL and Redis
services after applying the real migration command. The compact matrix covers:

- public process liveness and complete `AppModule` startup;
- business login for two tenants and the separate platform-administrator
  authentication domain;
- cookie-origin rejection, per-request subdomain binding, and cross-tenant
  resource denial;
- tenant-owned Linktree creation;
- a supported pre-baseline schema fixture being verified and baselined without
  replaying schema SQL;
- a reset fixture proving the whole database is dropped and recreated solely
  from `full_schema.sql`.

The application fixture refuses to run unless `DB_NAME` contains an explicit
`e2e` or `test` segment. The migration fixture uses a generated
`sponsor_krd_migration_e2e_*` database and removes it after the suite. E2E tests
run in band so database setup, worker assertions, and cleanup remain
deterministic.

### Running the e2e suite

The suite loads connection settings through `test/e2e-environment.ts` and selects
a disposable database name. Use a local or dedicated test PostgreSQL/Redis
instance; never point these fixtures at valuable data. The domain and subdomain
policy fixtures create and remove their own generated databases:

```bash
pnpm --filter backend test:e2e -- custom-domains subdomain-policy
```

Process environment values take precedence over `.env`. The shared setup runs
before fixture pools are opened, so connection settings do not depend on Nest's
configuration module starting first.
## Custom domains

`backend/test/custom-domains.e2e-spec.ts` creates a disposable database to verify
baseline/migration reruns, unique hostname claims, tenant-scoped mutations,
ownership loss, lease expiry, HTTPS-gated primary selection and concurrent primary
changes. It also covers out-of-order DNS results, removal during verification,
transient failures preserving leases, expiry clearing primary selection, and
suspension during HTTPS activation. DNS and TLS unit tests use controlled responses. Frontend tests cover
both domain-panel integrations, read-only capability controls and custom-host
routing, private-route rejection, aliases and resolver failures. Real DNS and
certificate issuance require the production checks in [Custom domains](custom-domains.md).

Security regression tests cover forged forwarding headers, nested tenant hosts,
signup-session origin protection, rate-limited availability and HTTPS checks,
missing resolver credentials, and browser attempts to reach internal endpoints
through decoded/dot-segment paths. Shared dialog tests cover duplicate deletion
submission; platform integration tests cover tenant selection resetting nested
domain dialogs.

Session regressions additionally cover immediate revocation with warm Redis
metadata, active business/user/membership checks against real PostgreSQL, cold
cache denial and login issuance after suspension. Cached platform session
revocation is covered separately. Actual Fastify requests verify private cache
headers on successes, encoded paths and errors; proxy regressions verify uncached
errors and platform-only route rejection on both kinds of tenant hostname.

Platform-only domain management regressions check that every former business
management endpoint returns 404, business cookies cannot access the platform
endpoints, and legacy permissions become inactive under repeated migration runs.
Panel and platform-modal tests retain add, DNS verification, primary selection,
refresh cancellation and nested deletion coverage.

## Persisted forms

Forms tests cover guards, validation, normalized uploads, both management scopes and both public layouts. Run `pnpm --filter frontend exec vitest run src/features/forms --maxWorkers=4` and `pnpm --filter backend exec jest --config test/jest-e2e.json test/forms.e2e-spec.ts --runInBand`. The PostgreSQL suite creates/drops only its separate `sponsor_krd_forms_e2e_<pid>` database. See [Forms](forms.md).

## Build dependency preflight

`pnpm test:types` runs the shared runtime dependency checks with Node’s built-in
test runner. It verifies loading from the owning workspace and uses an isolated
temporary package without dependencies to check the failure message and nonzero
exit. Both frontend and backend prebuild hooks invoke that same check. Root
`pnpm test` and `pnpm verify` include these tests; the check never installs packages
or changes the lockfile.

## Custom-domain setup guidance

DomainDnsModal tests cover all three locales, full multi-label hostnames, every
configured address, IPv4-only/IPv6-only deployments, incomplete configuration,
disconnected recovery, read-only access and the DNS-to-primary transition. Panel
and Platform modal integration tests exercise the same records and activation
action. DNS service regressions distinguish a matching TXT with no A/AAAA from a
transient address lookup failure; routing logs never include proof tokens.

DNS resolver regressions cover cached stale proofs, authoritative negatives,
missing addresses, one-resolver timeouts, partial outages and rejection of proof
and routing assembled from different resolvers. Only configured trusted DNS
servers participate; a complete proof and routing result is always required.

## Public mobile performance regression checks

`PublicImageGallery.spec.tsx` verifies stored intrinsic dimensions, a stable
carousel frame and manual public versus automatic preview behavior.
`LinktreeBanner.spec.tsx` exercises all six templates, including lazy image
viewers. `TemplateActionButton.spec.tsx` preserves native and modified-click
navigation without a forced new window. Public form and management integration
tests cover the shared renderer and Business/Platform adapters.

The disposable PostgreSQL `test/linktree-analytics.e2e-spec.ts` also checks
banner metadata for both Linktree and Form sources in business and platform
workspaces, rejecting dimensions belonging to another owner.

The measured live baseline and physical TikTok acceptance procedure are in
[the mobile performance audit](mobile-performance-audit-2026-10-30.md).
Browser unit tests do not measure CLS, INP or real in-app-browser compatibility.

## Linktree mutation regression coverage

Shared frontend mutation tests cover Business/Platform request routing, full editor saves in one request, explicit description clearing, normalized failures, pending approval outcomes, and cache invalidation only after applied writes. Dashboard integration tests exercise both actual dashboard entry components and verify approval notices without successful-save feedback or local published-state changes. Shared analytics, collection, and Forms component tests protect the neutral presentation integrations. Backend regression tests cover the shared transaction boundaries, media ownership, combined edit authorization, approval execution, link identity/metadata preservation, and canonical WhatsApp changes.

Run the database regressions with `pnpm --filter backend exec jest --config test/jest-e2e.json --runInBand linktree-mutations linktree-analytics`. Each suite creates and drops only its own guarded `sponsor_krd_*_e2e_<pid>` database; neither modifies the configured application database. The mutation fixture forces a link-write failure with a fixture-only trigger to verify rollback of page fields and questions.

## Dashboard installation checks

Manifest, metadata, launch-handler and proxy tests cover both dashboard scopes, valid/expired/absent sessions, outage handling, custom-host relative URLs and production console configuration. Run `SEO_SMOKE_DASHBOARD_INSTALL_ONLY=1 pnpm --filter frontend test:seo` (set the environment variable using the current shell syntax). The fixture checks real rendered HTML contains exactly one scope-specific manifest, fetches both manifests without cookies, exercises Business launch redirects, verifies protected Platform launch, and rejects cross-host dashboard manifests without writing application data. Manually verify Add to Home Screen and cold launch on iOS Safari and Android Chrome after deployment, including logout/session expiry and each tenant's selected custom domain.

## Linktree sponsor regression coverage

Shared runtime and backend tests cover defaults, strict config validation, safe URLs, image formats, foreign assets, baseline registration and Business/Platform save paths. The guarded PostgreSQL mutation fixture checks sponsor save/reload, action identity preservation, destination changes, hiding/re-enabling, migration rerun and cross-owner rollback. Frontend tests exercise localized editor toggles/name/wordmark/link controls, all template renderers, attribution ordering above legal links, preview exclusion, and engagement-only click tracking. Run the sponsor, Linktree drawer, media ownership, public tracking and pixel-placement tests plus the existing Linktree mutation PostgreSQL fixture.

Sponsor refinements test editable/empty introductory text, hidden wordmark names, destination selection, international WhatsApp/phone normalization and incomplete-number rejection. The PostgreSQL mutation fixture verifies nameless-wordmark/contact persistence in both scopes and rerunning the contact migration without replacing analytics action IDs.

TikTok delivery notice tests use `tiktok-notices.e2e-spec.ts` with its guarded
`sponsor_krd_notices_test_<pid>` PostgreSQL database. They verify migration reruns,
latest-attempt projection, recovery, durable dismissal, concurrent new attempts,
tenant isolation and preserved history. Shared frontend tests cover Business and
Platform endpoints and avoid reporting healthy delivery after notice dismissal.
