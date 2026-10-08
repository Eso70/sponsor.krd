# Domain and signup audit — 8 October 2026

Scope: blocked-name management, signup availability, customer hostname validation,
DNS ownership/routing, verification leases, automated maintenance, HTTPS activation,
tenant routing, internal endpoints, and the shared business/platform domain UI.
This reviews the repository; it does not certify the running production server.

## Fixed findings

| Finding | Change | Regression coverage |
| --- | --- | --- |
| Older DNS work could overwrite a newer revocation or activation | Compare the PostgreSQL row version before applying the result; changed/removed records return a conflict | Real PostgreSQL checks in both completion orders, plus removal during DNS work |
| Lease renewal could silently restore an expired primary domain | Preserve primary selection only while the previous active lease is still valid | Expiry returns to default; renewal requires explicit primary selection |
| The Next.js forwarding route could lend its internal credentials to browser requests | Block internal endpoints in both Proxy and the forwarding handler, including decoded separators and normalized dot segments | Root, default and custom host requests; encoded and normalized paths; no upstream fetch |
| Forwarded/nested hostnames could influence business authentication | Use the shared single-label parser on preserved Host; explicit tenant headers still require the internal secret | Forged forwarding headers and nested-host rejection |
| Signup-session mutations were omitted from same-origin protection | Include signup_session in frontend and backend cookie recognition | Cookie recognition and cross-origin signup proxy rejection |
| Manual HTTPS checks and signup availability reads lacked specific limits | Limit HTTPS checks to ten per business/minute and availability to 120 per user/minute | Rejection occurs before TLS or database availability work |
| A suspended business could become primary while HTTPS work was pending | Recheck active business status under its transaction lock; verify only active businesses | Suspension during TLS, inactive verification, no hostname resolution |
| Missing proxy credentials could make default routing silently bypass canonical resolution | Missing resolver credentials throw and public routing returns unavailable | Missing-credential resolver regression |
| Add-domain appeared enabled with no configured origin addresses | Reuse one configuration predicate for management availability and maintenance | Disabled response and no maintenance work |
| Existing manual blocks could duplicate new permanent reservations | Reserve extension for the platform service and hide duplicate removable rows | Immutable reservation and list deduplication |
| Fast repeated confirmation could duplicate a deletion | Guard the shared confirmation's pending promise synchronously | Repeated clicks issue one action |
| Platform business changes could retain another tenant's DNS dialog | Remount the shared panel for the selected business ID | New tenant clears the previous record and nested dialog |

## Boundaries retained

One custom hostname per business is enforced by PostgreSQL as well as the service.
Global hostname uniqueness, exact TXT ownership, configured-origin A/AAAA checks,
HTTPS certificate validation and scoped management permissions remain in place.
The subsequent selected-host change serves both public and dashboard routes on
the primary custom domain and returns uncached 404 on the inactive address.
Removal disconnects the custom hostname and
restores the default address. DNS failures preserve the existing lease until its
expiry. DNS work never fetches customer URLs; TLS probes use configured origin IPs.

The short DNS snapshot comparison uses PostgreSQL's
[row-version transaction identifier](https://www.postgresql.org/docs/current/ddl-system-columns.html).
It is not a stored identity or a long-term revision counter.

## Production follow-up

Deploy the updated applications. These audit fixes introduce no new schema or
environment variables. The original domain migrations and Caddy setup still apply
if they have not already been deployed. Keep application/database ports private;
check the actual production Caddy configuration, DNS and issued certificates.
Credentials previously pasted into chat must be rotated in production and at their
providers. Plan encrypted-data re-encryption before changing APP_ENCRYPTION_KEY;
do not replace that key blindly. No production credentials were changed by this audit.

## Verification

- All 180 frontend test files passed: 955 tests.
- All 113 backend unit test suites passed: 699 tests.
- Both disposable PostgreSQL domain/subdomain suites passed: 22 tests.
- Workspace TypeScript checks and lint passed.
- Frontend and backend production builds passed.
- Real Next.js HTTP checks passed for two tenants, tenant-isolated HTML and SEO,
  redirects, error statuses, hostile hosts, and blocked internal endpoints.

Live customer DNS and Caddy certificate issuance were not changed or provisioned
by these repository checks.

## Selected-host dashboard update

The selected customer domain now serves business login, dashboard and private
tenant APIs as well as public pages. The previous address returns 404 without
redirecting. Removal restores the default address. The preserved HTTP Host is
resolved against the live database mapping before business authentication;
registered Fastify route names enforce the platform/internal boundary even for
encoded URLs. Host headers with a valid port resolve normally, while domain
assignment still rejects ports. Host-only cookies are unchanged. OAuth and
administrator handoffs bind the exact destination host and reject replay on
another authority. A failed Redis handoff write returns service unavailable.
Cookie-authenticated browser reads also reject cross-origin requests.

Verification passed for the frontend suite (976 tests), backend suite plus
affected domain/authentication regressions, 23 disposable PostgreSQL tests,
actual Fastify HTTP authentication, real Next.js custom-host login/public pages,
TypeScript, lint, and both production builds. Business/platform panel tests
verify that only the owner's dashboard changes host after activation; the
platform console stays on root. No new environment variables or schema changes
are required. Deploy frontend and backend together. Google retains the existing
fixed callback and returns directly to the selected customer hostname.

## Follow-up authentication audit

- Cached business sessions now recheck PostgreSQL session expiry, business
  status, user status and membership status on every authenticated request.
  Deleted sessions cannot survive in Redis. Impersonation requires a live
  administrator, and cached platform sessions also recheck their durable session.
- Business session issuance applies the same active-principal predicate inside
  the insert. A login handoff issued before suspension cannot create fresh access.
- Platform, signup, internal and root Google callback APIs are blocked on
  default tenant subdomains as well as custom hosts, including encoded routes.
- Certificate permission rejects forwarded public requests even if the reverse
  proxy connects from loopback. Direct Caddy permission requests still work.
- Private backend API responses, including errors, override caching with
  `no-store, private`. The frontend API proxy also prevents response caching.

Real PostgreSQL regressions cover business, user and membership suspension,
durable-session deletion, warm and cold cache paths and denied fresh issuance.
The real application suite uses active owner memberships rather than legacy
unbound session fixtures. No new schema or environment settings are needed.

Follow-up verification passed: 181 frontend files (976 tests), updated API proxy
regressions, 117 backend suites (734 tests), and three PostgreSQL/application E2E
suites (31 tests). Workspace TypeScript and lint passed, both production builds
passed, and real Next.js HTTP checks confirmed custom-host login/public pages,
inactive-host 404 without redirection and automatic default-host restoration.
