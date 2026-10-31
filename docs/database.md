# Database

`business_defaults.homepage_linktree` is a non-null boolean, default false.
Apply `2026-10-30_business_linktree_homepage.sql` through `pnpm db:migrate`
before deploying the homepage switch. The additive migration preserves existing
settings and pages; fresh baselines include the column. Business settings reads,
partial updates, approved updates, and business backup export/import preserve it.
Older backups restore with the switch off. Switching it off restores the usual
homepage without removing or renaming any Linktree.

Linktree profit tracking is retired. Apply `2026-10-15_retire_linktree_profit.sql` through `pnpm db:migrate` during deployment to remove its obsolete records table, including that table's indexes and triggers. This deletes only the retired profit records; Linktrees, links, Forms, responses, analytics, subscriptions and billing records remain intact. The retired table is absent from the fresh baseline. This migration has not been applied automatically. Editable Forms duplication uses existing columns and needs no schema addition.


WhatsApp question video links use the nullable `whatsapp_questions.video_url`
column. Apply `2026-10-14_whatsapp_question_video.sql` with `pnpm db:migrate`
before deploying this release. It only adds a column and preserves existing
questions/messages; no reset or data rewrite is needed. Fresh baseline installs
include it. Page edits, duplication, public reads and business backup export/import
retain the optional URL.

## Business deletion and immutable billing audits

Apply `2026-10-11_immutable_audit_entity_deletion.sql` using `pnpm db:migrate`
before retrying a production business deletion. Audit `business_id`, `plan_id`
and `plan_configuration_id` are historical identifiers rather than foreign keys
that change when their parent is removed. The old `ON DELETE SET NULL` constraints
conflicted with the immutable audit trigger and could turn an authorized deletion
into HTTP 500. The migration removes only those three constraints, retains every
audit record and original identifier, and leaves the immutable trigger enabled.
The fresh baseline uses the same design; operational tenant data keeps its existing
foreign keys and cascade rules.

Custom-domain automatic verification uses `business_domains_retry`, a partial
index on pending/disconnected check timestamps. Apply
`2026-10-07_custom_domain_automation.sql` through the normal migration
workflow; the fresh baseline includes it. Maintenance claims batches atomically
with `SKIP LOCKED` so clustered workers do not process the same due claim.
`2026-10-07_single_custom_domain_per_business.sql` adds a unique business-owner
index alongside global hostname uniqueness. It refuses existing duplicate
assignments without deleting data; remove extra domains through the dashboard
before applying it. The fresh baseline includes the same index.

The consolidated baseline part `92_root_public_slugs.sql` provides the
concurrency-safe root public slug registry for platform-owned Linktrees.

## Fixed public marketing routes

Businesses receive a Home route identity. The platform workspace receives Home, Join, and Application identities. These collect first-party analytics only.

## Business identity and applications

`platform_blocked_subdomains` stores custom exact-label reservations, their
creating administrator, and creation time. Permanent system reservations remain
in `common/business-subdomain.ts`. Baseline part `91_subdomain_policy.sql` and
forward migration `2026-10-07_blocked_subdomains.sql` install the same policy.
Apply the forward migration with `pnpm db:migrate` before running this release;
no reset is required.

Database triggers reject blocked names during business creation/renaming and
active signup application writes. Adding a block rejects existing businesses
and active application reservations. Per-name transaction advisory locks
serialize assignments against new blocks, including concurrent requests.
Rejected/deleted applications do not reserve names. Block/unblock changes are
recorded atomically in `billing_policy_audit_events`.

`users.preferred_locale` stores each person's dashboard language (`ckb`, `ar`, or
`en`, database default `ckb`). New invitation-signup users explicitly start in
English, and their application form can select another initial language. Existing
users keep their saved choice. It is not business branding and does not change
public page content. The 2026-09-22 forward migration adds the column after the
baseline on both fresh and existing installations; the 2026-09-28 forward
migration expands its check constraint to permit English.

`platform_admins.preferred_locale` independently stores each administrator's
console language (`ckb`, `ar`, or `en`, default `ckb`). The
`2026-09-28_platform_admin_preferred_locale.sql` forward migration adds it to
existing installations; `2026-09-29_platform_admin_english_locale.sql` expands
the allowed values to English. The consolidated baseline includes all three
values for fresh installations.

`2026-10-01_platform_admin_email_identity.sql` repairs the earlier seed's
duplicate-email failure: for each case-insensitive email, the oldest admin row
keeps the address and later rows keep their IDs and related history with their
email set to `NULL`. It normalizes stored addresses to lowercase and adds a
unique index on `lower(email)` for non-null addresses. The deployment seed now
matches the existing account by email, so an edited username cannot create a
second account on the next migration run.

Business onboarding uses `users`, `user_identities`,
`business_memberships`, `business_signup_invitations`,
`business_signup_applications`, and
`business_signup_application_events`. Partial uniqueness reserves active
application subdomains without permanently blocking rejected requests. OAuth
state, signup sessions, and tenant handoff codes are temporary Redis records;
they never replace durable application or membership state.
An approved application is closed as `deleted` when its business is removed;
the owner identity and review-event history remain, while the old subdomain and
branding references are released. The `2026-09-30_deleted_business_signup_reapply.sql`
forward migration closes approvals already orphaned by earlier deletions.

`businesses.onboarding_step`, `businesses.onboarding_version`, and
`businesses.onboarding_completed_at` enforce the required first-login setup.
Approved signup businesses start at step 1; explicitly administrator-created
businesses are marked complete. The `remembered` flag on business and platform
session rows records the session-lifetime choice while user agent, IP, and
timestamps provide revocable device history.

PostgreSQL is the durable source of truth. Redis is disposable acceleration
and must not contain the only copy of application data. For the enforced
boundary between the two, see [docs/architecture.md](architecture.md#data-and-migrations).

The consolidated baseline is split across:

```text
backend/src/database/migrations/baseline/*.sql
```

It is recorded in `schema_migrations` under the compatibility ledger name
`full_schema.sql`.

It requires the PostgreSQL `pg_trgm` and `pgcrypto` extensions.

The baseline must contain only session settings understood across supported
deployment PostgreSQL versions. In particular, do not copy
`SET transaction_timeout` from a PostgreSQL 17+ `pg_dump` preamble: it is not
part of the schema and makes fresh installs fail on older servers.

Dated forward-migration SQL files must not include their own `BEGIN`, `COMMIT`,
or `ROLLBACK` wrapper. The migration runner owns that transaction and records
the migration in the same commit, ensuring a failed migration leaves both the
schema and its ledger unchanged.

## Schema groups

The active schema is grouped as follows:

## Schema decisions carried in the baseline

These were delivered as dated forward migrations and folded into
`full_schema.sql` by the 2026-08-24 rebaseline; the files are gone, so the
reasoning lives here. Everything below is simply how the baseline is now.

**CRM and Advanced Analytics retirement.** The baseline no longer creates the
CRM tables, retired lead-form settings, Advanced Analytics dimension
rollup, or acquisition-only daily-rollup columns. It also omits the retired
Advanced Analytics permissions, entitlements, and plan grants. Core page/action
totals, exact unique counts, and TikTok delivery data remain. The two dated
removal migrations were folded into the baseline and deleted on 2026-08-24, so
an older valuable database requires an explicitly reviewed backup and database
replacement rather than relying on those removed files as an upgrade path.

**Session impersonation.** `business_sessions.impersonated_by_platform_admin_id`,
`.impersonation_reason` and `.impersonation_started_at` mark a session a
platform administrator opened rather than the owner. Impersonated rows are
excluded from the per-business session cap and listed separately in business
security screens, so both paths filter on the partial index
`business_sessions_impersonated_by_idx`. The
`platform:businesses:impersonate` permission is seeded with them: the
application refuses to boot when a catalog permission is missing.

**No password authentication.** `businesses.password_hash`,
`businesses.password_changed_at` and `platform_admins.password_hash` do not
exist. Sign-in is invite-only Google OAuth or an emailed code; the password
routes were never wired. Three capabilities named for password operations were
renamed in place — `business:security:sessions-revoke`,
`platform:businesses:sessions-revoke`, `platform:settings:sessions-revoke` —
keeping their ids so existing grants and approval rows survived.

These columns must **not** be added to `OBSOLETE_COLUMNS` in
`migration-compatibility.ts`. `assertSupportedSchema` runs against an existing
database before any forward migration, so an entry there would reject a live
database that predates their removal.

**Neutral brand placeholders.** `business_branding.logo` and `.favicon` default
to `/images/business-logo-placeholder.png` and
`/images/business-favicon-placeholder.png`. They used to default to Sponsor.krd's
own `/images/Logo.jpg` and `/favicon.ico`, so a business that skipped the
optional upload rendered the platform's mark on its own public pages.
`platform_admins` keeps the platform mark — that row _is_ Sponsor.krd's console
branding. `business_branding.default_avatar` deliberately keeps
`/images/DefaultAvatar.png`: it is a sentinel other SQL compares against to mean
"still the default", and the artwork behind the path was replaced at the asset
level.

**Profile change cooldown.** `businesses.profile_changed_at` (NULL means never)
drives a 30-day self-enforced lock covering name, username, phone, logo,
favicon, default_avatar and website_color. It replaced platform-administrator
approval of profile changes, so `business:profile:update` is granted with
`access_mode = 'direct'` — `AuthorizationService.evaluate` treats `'approval'`
as approval-required for the whole permission regardless of `field_modes`. It
lives on `businesses` rather than `business_branding` because the window covers
more than the branding columns.

**Linktree template keys.** `spectrum`, `spotlight`, `frost`, `aurora`,
`serenity`, `branch-signal` — renamed from `colorful-pills`, `mobile-spotlight`,
`frosted-outline`, `aurora-pills`, `gentle-flow`. `hero-image` and `dark-card`
were retired. `business_defaults.template_key` and `linktrees.template_key` both
default to `spectrum`. Branch Signal is assigned only to Ultra in the
consolidated baseline; runtime plan checks also reject accidental non-Ultra
assignments.

**Retired link platform.** `website` was folded into `custom`, which already
accepted a bare domain and stored the same `https://…` url. Destination urls
were left untouched: `LinksService.syncLinks` matches a saved link on
platform + url, so rewriting the url would have made every one of these links
look new on the next save and retired the action row holding its clicks.

**One-time data repairs**, which acted only on rows that already existed and so
leave no trace in a fresh database:

- Per-button click history orphaned by the old link-sync behaviour was folded
  back onto the live action. `syncLinks` used to delete and re-insert every
  link, giving each surviving button a new uuid, a fresh `public_page_actions`
  row, and an archived predecessor still holding its `analytics_action_daily`
  rollups — which the breakdown query excludes. Page-level totals were never
  affected: `analytics_page_daily` is keyed by `public_pages.id`. The service no
  longer destroys link rows.
- Business default pages created by `POST /linktrees/default` before the seeder
  filled them in were backfilled with the helper text and starter WhatsApp
  questions the link editor writes.

## Baseline layout

The baseline is one schema split across numbered parts in
`backend/src/database/migrations/baseline/`, applied in filename order inside a
single transaction by both `db:migrate` and `db:reset`:

`src/database/baseline.ts` owns the loading: `baselineFiles` reads the parts
off disk and sorts them, `applyBaseline` runs them, and `readBaselineSql`
concatenates them for the specs that assert against the schema text. Adding a
part is adding a file — nothing enumerates them by hand. The numbering leaves
gaps so a new domain takes its own tens place instead of forcing a renumber.

**The split is sequential.** No statement was reordered when it was made, so
concatenating the parts reproduces the single file they came from. That is what
makes the ordering safe to reason about rather than something to re-derive:
core tables precede their constraints, every foreign key lands after every
table it references, and `99_data.sql` runs last, once the keys exist to
validate it.

Three rules follow, all enforced by `schema-baseline.spec.ts`:

- **Filename order is apply order.** A part that must run late needs a higher
  prefix; nothing infers dependencies.
- **Data goes in `99_data.sql`**, in dependency order. The rows load after the
  foreign keys, unlike a `pg_dump`, which writes data first and constraints
  after — so alphabetical order is not enough (`billing_plan_configurations`
  sorts before `billing_plans` but references it). Anything derived from other
  seeded rows goes last.
  Two singleton bootstraps stay with their own sections because they mean
  "ensure one row exists", not "seed the catalogue".
- **No `IF NOT EXISTS` on tables or indexes, and no post-table `ADD COLUMN` /
  `DROP CONSTRAINT` patch-ups.** Those were migration residue: every column and
  CHECK they re-applied is already declared in the `CREATE TABLE` above them,
  so on an empty database they did nothing but mislead. `IF NOT EXISTS` on a
  baseline that only ever runs against an empty database hides a real name
  collision rather than failing on it. The two `CREATE EXTENSION IF NOT EXISTS`
  statements are the deliberate exception, since a template database may
  already carry them.

The baseline is still recorded in `schema_migrations` under the single name
`full_schema.sql`, deliberately unchanged by the split. The ledger records
_which baseline_ a database was built from, not which files carried it, and
`db-migrate.ts` recognises an already-baselined database by that exact string.

## Platform Linktree workspace

The consolidated baseline carries the durable `businesses.account_type`
ownership discriminator and creates exactly one internal platform workspace.
A partial unique index enforces the singleton.
The same workspace owns platform Linktrees; no
feature-specific owner table or nullable ownership column is introduced.
Existing and future customer rows default to `business`; platform and public
services use explicit account-type predicates so the internal owner never
appears in customer administration, billing, impersonation, authentication,
or tenant public reads.

The workspace deliberately owns ordinary `linktrees`, `links`, `public_pages`,
`public_page_actions`, analytics, tombstones, and uploaded-media rows. Those
tables keep their non-null foreign keys and existing triggers. The normal
post-insert subscription is removed because this is not a billable customer;
platform write policy is enforced by the guarded platform service instead.
`99_data.sql` registers the platform Linktree and TikTok capabilities with
that workspace.

## Baseline consolidation, 2026-09-10

The numbered baseline contains the complete current Sponsor.krd schema and
required catalog data. Linktree subtitle styling, archive
state, current branding, platform ownership, and all active permissions are
declared directly in their owning baseline parts. There are no dated upgrade
files in this reset-only release.

`db:reset` recreates the configured database from this baseline and records
only `full_schema.sql`. `db:migrate` applies the same baseline to an empty
database or strictly verifies an already-current schema. An outdated database
must be replaced with an intentional reset; it is not upgraded implicitly.

The reset E2E test proves that an unrelated sentinel table is removed, the
complete schema is recreated, and the ledger contains only the baseline row.
The unledgered-schema test proves that a complete current schema can be
recognized without replaying schema SQL.

`trg_business_default_subscription` creates a default subscription immediately
after a business row is inserted. Any workflow that creates a business with an
explicit reviewed plan must upsert `business_subscriptions` on `business_id` so
the reviewed plan replaces that trigger-created default. A second plain insert
will violate `business_subscriptions_business_id_key`.

The former `page_views`, `link_clicks`, `analytics_totals`,
legacy public-page analytics tables and `integration_delivery_events` are not
created by the consolidated
schema, and neither are the four legacy analytics helper functions or the
`links.click_count` column. Current code uses the unified analytics and
marketing tables above.

`public_page_tombstones` stores only the tenant, page type, former public
identifier, slug, and deletion time. It contains no deleted page content. Public
lookups consult it only after the active page lookup fails, allowing a
tenant-scoped `410 Gone` response while preserving `404 Not Found` for unknown
or cross-tenant URLs.

The platform-administrator tables are named `platform_admins` and
`platform_admin_sessions`, matching the term used throughout the application
and UI.

## Running migrations

```bash
pnpm db:migrate
```

For an empty database, this applies every numbered baseline part transactionally
and records the single compatibility name `full_schema.sql` in
`schema_migrations`. For an existing database
with the baseline row, the command verifies the required tables, columns,
indexes, removed columns, and required catalog data without replaying the
schema. A complete unledgered schema may be baselined after the same strict
verification. Unknown, partial, or outdated schemas fail closed.

If `DB_NAME` does not exist yet, the migration command creates that database
through `DB_MAINTENANCE_NAME` (default: `postgres`) before applying the
schema.

Application startup does not run migrations.

## Applying schema changes

The repository uses one consolidated schema baseline split across
`backend/src/database/migrations/baseline/` for fresh installs and `db:reset`.
Never edit that baseline for an ordinary schema change. Every schema change
should normally be delivered as a new dated forward migration file in
`backend/src/database/migrations/` (for example
`2026-08-10_add_tiktok_consent.sql`) so existing databases can be upgraded
in place. Apply forward migrations with the same migration command, and
verify existing databases after applying them.

Environments may be reset from the baseline only when complete PostgreSQL and
Redis data loss is explicitly approved. A production reset is a deliberate
replacement, not an in-place upgrade: stop the applications first and follow
the reset-only procedure in `docs/deployment.md`.

The post-migration helpers perform only idempotent seed/data work. They do not
create tables, alter columns, create indexes, or modify constraints.

Archived communication history has administrator-configurable retention.

```bash
pnpm db:reset
```

`db:reset` refuses to run while Sponsor.krd backend connections to `DB_NAME`
are active, then drops the entire
database (thereby removing every table, function, view, extension, and row),
recreates it from `template0`, applies only the numbered baseline, verifies the
result and its one-row `full_schema.sql` schema ledger, reruns the seed helpers,
and executes
`FLUSHALL` on the configured Redis instance. **It
permanently destroys the configured application database and all data in the
configured Redis instance.** Stopping the backend is mandatory by default.
`DB_RESET_REQUIRE_STOPPED_BACKEND=false` is an explicit emergency override
that allows the reset to terminate active Sponsor.krd backend connections.

Use `db:reset` only when complete data loss is intended.

## Seeded data

Production business creation uses approved signup applications. Any business
created by environment seed helpers is an explicitly configured local
development record, not part of public or administrator-manual onboarding.

No demo or fixture businesses are created — every business in a database is a
real one, created through the platform administrator.
## Business custom domains

`business_domains` stores globally unique hostnames, business ownership, DNS proof,
verification leases and primary selection. A partial unique index enforces one
primary per business. The additive `2026-10-07_custom_business_domains.sql` migration
also registers domain permissions and initializes plan access from existing
settings access. Fresh baselines include part 92. The platform-only domain migration retires legacy business domain permissions
as inactive while retaining historical grants and approvals.
See [Custom domains](custom-domains.md).

## Persisted forms

`forms` and `form_submissions` persist owner-scoped form definitions and response history. Form status is `active` or `paused`; separate `is_archived`/`archived_at` columns organize the dashboard without changing public availability. The `2026-10-10_forms_visibility.sql` migration safely converts legacy states and updates the shared analytics publication trigger. Form public-page/action identities join the shared analytics schema. Apply `2026-10-10_forms*.sql` with `pnpm db:migrate`; fresh baseline parts 65/70/75 include the same schema. See [Forms](forms.md).

Product questions reuse forms.definition JSONB; accepted selections reuse form_submissions.answers JSONB. Each product answer stores an immutable server-priced snapshot and searchable value summary. No new table or migration is needed. See [Forms](forms.md#product-selection).

## Linktree content names (2026-10-13)

Optional banners are stored in the existing `linktrees.template_config.banner`
JSON object as `{ enabled, mode, images }`; no content columns or existing rows
are rewritten. Missing configuration means disabled. Saving validates local
upload paths and tenant ownership, including approved edits. Asset retention
already scans template configuration, so active banner uploads remain referenced.
`2026-10-13_linktree_media_actions.sql` (fresh baseline part 97) adds registered
media engagement actions to existing/future Linktree public pages without changing
page content, URLs or analytics history. Apply it with the normal migration runner.

Apply `2026-10-13_linktree_form_content.sql` through `pnpm db:migrate` for existing
installations. Baseline part `96_linktree_form_content.sql` performs the identical
change on fresh installs. The migration renames `name` to `headline`, `subtitle`
to `slogan`, `subtitle_color` to `slogan_color`, and `image` to `logo`. It does not
copy, truncate, delete or rewrite Linktree content. IDs, image paths, `seo_name`,
UIDs, foreign keys, links, root slug reservations, statistics and analytics stay
intact. The public-page synchronization function uses the renamed headline;
permission field catalogs gain canonical keys while legacy keys remain available
for existing clients and pending approvals. Authorization and its simulator resolve
canonical/legacy field aliases to the same plan rule, preserving existing deny and
approval settings without rewriting stored policies. Conflicting old/new columns abort
rather than choosing one and hiding stored content. The migration runner wraps
each forward migration and its ledger entry in one transaction.

Before forward migrations, the schema check also accepts the complete previous
Linktree content columns and their legacy field catalog. It still rejects mixed
renames, ambiguous duplicate columns and unrelated missing schema requirements.
After forward migrations, validation requires the canonical content columns and
catalog. This lets existing baselined installations reach the rename migration
without weakening the final schema check or requiring a database reset.

New canonical requests allocate URLs from the headline inside the existing
per-business transaction lock, adding a numeric suffix on collisions. Platform
pages also consult the root slug registry. Non-Latin headlines use a stable
hashed fallback. Headline changes preserve the stored URL. Explicit legacy API
routes remain compatible, but the updated editors never send them.

Linktree categories, optional business details and search/sharing customization
use the existing `template_config` JSONB under `seo` with numeric `version: 1`.
No new column, baseline change, migration or backfill is required. Legacy pages
remain uncategorized; retired unversioned SEO settings are not resurrected.
Shared validation bounds content and restricts stable category/type IDs. Owner
updates retain the existing transaction, approval, timestamp and cache paths.


## Advertising service retirement

Advertising service routes, APIs, catalogs, seed helpers, and fresh-install tables have been removed. Apply `2026-10-15_remove_advertising_service.sql` through `pnpm db:migrate` on existing deployments. It deletes only the retired service content, service page identities and their dependent analytics, permission grants, entitlement, and tables. Linktrees, Forms, remaining route identities, tenant settings, and immutable audit history are preserved. The migration is idempotent and fresh installs never create the retired service. Historical Forms migration retains compatibility with pre-retirement schemas until the cleanup runs. No database reset is needed.

## Linktree campaign flag retirement, 2026-10-15

The Linktree campaign toggle is removed from the current baseline. Existing
installations apply `2026-10-15_retire_linktree_campaign.sql` through `pnpm db:migrate`.
It drops only the retired flag and its indexes, rebuilds the archive index
without that flag, and removes its authorization catalog and plan field rules.
Pages, content, publication/archive state, analytics and campaign attribution
are preserved. Legacy backup imports ignore the retired flag. The compatibility
check accepts the previous schema so the forward migration can run without a reset.

## Saved page pins, 2026-10-20

Apply `2026-10-20_page_pins.sql` through `pnpm db:migrate` before deploying
this release. It adds non-null `is_pinned` flags (default false) to Forms and
Linktrees, owner-scoped list indexes, and the Linktree `isPinned` permission
field. The fresh baseline includes the same state. Existing pages and analytics
are preserved; no reset is needed. Pins are dashboard preferences shared by
managers of the same owner, rather than public-page settings. Linktree backups
retain pins; newly created and duplicated pages start unpinned.

## Analytics share links, 2026-10-20

Apply `2026-10-20_analytics_sharing.sql` using `pnpm db:migrate` before deploying.
The fresh baseline includes `73_analytics_sharing.sql`. This additive migration
creates `analytics_share_links`, indexed by owner/page, with cascading owner and
canonical public-page foreign keys. Existing data is preserved. `expires_at` is
nullable: links have **no expiration by default**. Owners may choose hour/day/week/
30-day presets or a future date/time, change expiry later, disable, or delete.
Authentication codes use keyed HMAC hashes. Backups do not export share credentials.

`2026-10-20_shared_form_responses.sql` adds `include_submissions` with a false
default, preserving existing analytics-only grants and all saved responses.
The fresh baseline includes the same column. Apply through `pnpm db:migrate`.

`2026-10-20_share_code_reveal.sql` adds nullable `code_reveal_ciphertext` (bytea).
New grants store one encrypted recovery copy, consumed under a row lock. Existing
grants retain their original code/hash and get no recovery copy. No page or
response data changes. Apply through `pnpm db:migrate`; never reset production.

## New-page appearance defaults

Apply `2026-10-24_new_page_appearance_defaults.sql` using `pnpm db:migrate`
before deploying this release. It adds the validated `business_defaults.background_pattern`
preference and the defaults permission field. Existing saved colors, Linktrees,
links and analytics are preserved. Only the database default for future default rows
changes to Dark (`#161b22`); the new pattern preference starts at `grid45`.
Business backups include this preference; older backups receive the new fallback.

## Optional Linktree sponsor actions

Sponsor presentation is stored in the existing Linktree `template_config.sponsor` JSON. `2026-10-31_linktree_sponsor_actions.sql` adds the owner-scoped public-page action registration trigger for existing deployments; fresh installations include `98_linktree_sponsor_actions.sql`. The trigger retains the action ID when labels/destinations change, marks disabled/destination-free sponsor actions hidden, and records engagement-only metadata. Apply through `pnpm db:migrate`; no reset or manual schema update is needed.

`2026-10-31_linktree_sponsor_contacts.sql` updates the sponsor registration function to accept validated telephone destinations and wordmark-only attribution with no separate text name. Action identities and engagement-only classification remain unchanged.
