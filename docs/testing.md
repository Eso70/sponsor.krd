# Testing and verification

For SEO changes, `pnpm --filter frontend test:seo` starts an isolated Next
preview with a disposable fixture API, without database writes. It tests raw
HTML, two tenants with identical slugs, robots/sitemaps, share images, real
anchors, noindex, crawler agents and HTTP status/redirect behavior. See
[SEO verification and live deployment checks](seo.md).

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
