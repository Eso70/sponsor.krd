# Business custom domains

Customer domains serve the same business and published pages as its Sponsor.krd
subdomain. No second installation, database, or per-customer release is created.
Content and deployed application updates apply to every connected address.

## Management

Business Settings > Custom domains and the globe action in the platform business
directory use one `features/domains/components/BusinessDomainsPanel`. The panel
uses the shared compact ManagementTable, ManagementModal, ModalTextInput,
ModalFooterActions, copy fields, and deletion confirmation. Kurdish, Arabic,
and English copy is centralized. Each business can connect one custom hostname;
choose the root domain or its `www` hostname. Adding a domain opens its DNS
instructions. To replace it, remove the existing domain and add the new one.

Business routes derive the business ID from BusinessGuard's authenticated session,
and require `business:domains:read` or `business:domains:manage`. Platform routes
require PlatformAdminGuard and the existing business read/update capabilities.
Every domain mutation is scoped by both business and domain ID. The migration
initializes plan access from each plan's existing settings-page permission;
denied or approval-only settings access does not become direct domain access.
The platform permission editor can subsequently grant or deny the new permissions.
Domain mutations do not change the business's profile-editing quota or cooldown.

## Security and lifecycle

- Domain names are normalized to lowercase ASCII (IDNs use punycode). Reject
  URLs, ports, paths, credentials, wildcards, IPs, local names, and Sponsor.krd
  itself or its descendants. PostgreSQL enforces global unique ownership.
- An unpredictable 256-bit token is stored for the domain. The owner must keep
  `_sponsor-verification.<hostname>` TXT equal to
  `sponsor-verification=<token>`. Joined TXT chunks are supported.
- Verification also requires every resolved A and AAAA address to belong to the
  configured platform origin addresses. Stale AAAA and mixed routing fail. Queries
  are DNS-only with bounded retries; the system never fetches customer URLs.
- Each business can connect one custom hostname, which can be explicitly selected
  as primary. Many businesses can each connect their own domain to the same
  platform. PostgreSQL enforces unique hostname ownership and one domain per
  business, including concurrent assignments. Unverified claims expire after seven
  days; adding an expired hostname releases the old claim and generates a new
  token. Verified claims are removed explicitly by their owner or administrator.
- Automatic verification checks new pending domains without a dashboard action,
  retrying failed checks after five minutes until the seven-day claim expires.
  Disconnected domains retry after fifteen minutes and reconnect only after
  both ownership and routing pass; primary selection is not automatically restored.
  Suspended businesses and expired pending claims are excluded from this work.
- Cluster-safe database work claims recheck active domains every six hours in
  batches of fifty (one batch per minute, at most five concurrent checks per
  process). Overlapping maintenance runs in one process are skipped. These are
  eligibility intervals; backlog and DNS propagation can delay activation.
  Ownership or routing mismatch
  disconnects the domain and clears primary selection. Transient DNS failures do
  not immediately revoke it, but its 48-hour verification lease expires closed.
  Removing a domain, suspending/deleting a business, or lease expiry immediately
  stops domain resolution; active mappings are not persistently cached.
- Caddy asks the loopback-only `/api/internal/domains/tls` endpoint before issuing
  a customer certificate. Only active, verified domains for active businesses
  are allowed. Edge configuration blocks all `/api/internal/*` routes and strips
  incoming tenant/proxy headers. The resolver additionally authenticates its
  internal caller with the existing proxy secret. Enable strict SNI/Host matching.
- Making a domain primary first probes HTTPS against a configured origin IP with
  SNI and normal public certificate-chain/hostname verification. It never connects
  to an arbitrary customer-provided IP. If issuance is still in progress, retry.
- Customer domains expose public pages and `/api/public/*` only. Login, signup,
  platform administration, private analytics, uploads and business-management APIs
  remain on Sponsor.krd addresses. Visiting `/business*` on a custom domain
  redirects to the original business workspace entry. Host-only dashboard
  cookies and Google callback configuration are unchanged.
- Public aliases redirect to a verified primary domain with a temporary 307,
  preserving path and query. Temporary redirects avoid permanently cached
  redirects after disconnection or primary changes. Canonicals, sitemap and share
  images use the verified primary origin. Public tracking keeps the existing
  page/business identity and the existing TikTok placement boundaries.

## One-time production setup

Enable the feature and configure the origin once for the entire platform.
Every subsequent customer domain is added through the dashboard: no environment
edit, Caddyfile entry, deployment, or server restart is needed per domain.
Caddy automatically obtains and renews certificates for verified domains.
The client must still add records at their DNS provider once for each hostname;
the application has no access to their DNS account and cannot safely edit it.
While pending or disconnected domains exist, the shared dashboard panel refreshes
status every fifteen seconds while visible, without overlapping requests or
polling during mutations. Manual verification remains available for immediate checks.

Deploy the code and run the normal additive migration command `pnpm db:migrate`
before starting the new backend. The migration is
`2026-10-07_custom_business_domains.sql` and the retry index in
`2026-10-07_custom_domain_automation.sql`, plus the one-domain constraint in
`2026-10-07_single_custom_domain_per_business.sql`; fresh installs include
`baseline/92_business_domains.sql` and the permission rows in `99_data.sql`.
Do not reset the database for this feature. Review any older pending migrations
as part of the repository's normal deployment process.

Configure these server-only values in the root environment:

```dotenv
CUSTOM_DOMAINS_ENABLED=true
CUSTOM_DOMAIN_TARGET=domains.sponsor.krd
CUSTOM_DOMAIN_IPV4=<your public origin IPv4 address>
CUSTOM_DOMAIN_IPV6=
```

Use comma-separated addresses when there are multiple origin addresses. IPv6 is
optional; configure it only when that address actually serves Caddy. Point
`domains.sponsor.krd` at these addresses with **DNS-only** A/AAAA records. This is
the stable CNAME target shown in the dashboard. Customer CDN proxies are not
supported by this first version because verification checks the actual origin
addresses, rather than a shared CDN network's addresses.

Reload the updated Caddyfile after validating it with the production Caddy binary
(which must include the existing Cloudflare DNS module). Keep Caddy's certificate
storage persistent and writable. Ports 80 and 443 must reach Caddy; ports 4000,
3011, PostgreSQL and Redis must remain private. Outbound DNS and ACME access and
customer CAA records must permit certificate issuance. The backend must be able
to reach its configured public origin IP on port 443 for the HTTPS readiness
probe. Ensure the same internal proxy secret is configured in frontend/backend.

For Wafaye, add `wafaye.com` in its domain panel. At the client's DNS provider:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | Configured origin IPv4 |
| TXT | `_sponsor-verification` | Exact generated `sponsor-verification=...` value |

If using IPv6, add only the configured AAAA value. A root CNAME to the target
is an alternative when the provider supports apex flattening. Preserve MX and
other email records. If choosing `www.wafaye.com` instead, use its CNAME to
`domains.sponsor.krd` and its generated TXT at `_sponsor-verification.www`.
The business connects one of these hostnames. Verification happens automatically after DNS
propagation; Verify DNS optionally checks immediately. Once verified, select
Make primary for `wafaye.com`. Public requests to
`wafaye.sponsor.krd` then redirects to `wafaye.com`;
the original Sponsor.krd dashboard still works.

Live DNS, public HTTPS issuance, CAA policy, and Caddy's production configuration
must be checked after this manual setup. Repository tests use a disposable
PostgreSQL database and stub external DNS/TLS; they do not provision a real
customer certificate or modify client DNS.
The default `domains` label is system-reserved for new business assignments.
If an existing installation already assigned that label, choose another unused
platform-owned target name before configuring its DNS record.

The one-domain migration never deletes customer records automatically. If a
previous deployment connected several domains to one business, remove the extra
domains through its dashboard before applying the constraint. The migration
stops with a clear error until each business has at most one domain.
