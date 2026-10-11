# Plans and subscriptions

Sponsor.krd separates the commercial catalog (`billing_subscription_plans`)
from permission profiles (`billing_plans`). A subscription references its
commercial plan, permission profile and configuration. Platform administrators
manage these through the Billing page; businesses compare the same catalog
through their sidebar's current-plan button.

## Catalog and permissions

Prices are stored in integer minor units. Each plan has monthly and annual
prices, currency, trial length, availability and ordering. The cards show the
configuration's actual entitlements and templates rather than guessed marketing
features. Permission rules remain server enforced, including direct access,
approval, denied access, field restrictions and resource scopes.

The Max migration clones the existing Ultra profile into a separate profile,
sets TikTok pixels to at least 10 and monthly profile changes to at least 30,
preserving higher or unlimited customized limits, and seeds
$60/month or $600/year. It preserves existing subscriptions, annual prices,
nonzero monthly prices and customized Ultra policies. Missing monthly prices
for Basic, Pro and Ultra start at one tenth of the annual price. Administrators
can change all prices and limits before offering them to customers.

Editing a permission profile affects every subscriber on that profile. Changing
a commercial plan's permission-profile assignment updates its subscribers.
Archiving a commercial plan prevents new assignments; existing subscribers can
retain it. Deleting default or assigned plans is rejected server side.

## Access and lifecycle

The Basic Linktree creation allowance is 20 active pages; Pro allows 100.
Creation and duplication enforce `limit.linktrees`, and plan cards display that
same entitlement. Apply `2026-10-11_basic_pro_linktree_limits.sql` through
`pnpm db:migrate` for existing databases; the fresh baseline has the same values.
The migration updates all configuration versions of the default Basic and Pro
profiles, preserving other entitlements and separate custom profiles. Cached
policies and catalog values refresh within their existing cache lifetime.

Paid access requires an active business and a subscription in `trialing`,
`active` or `grace_period`, whose start has arrived and whose end/cancellation
has not arrived. The same time boundaries apply to authorization, public
entitlements and templates. Cached entitlement/template grants recheck their
expiry on each request. Expired subscriptions remain readable through the
authenticated `/api/billing/subscription` recovery endpoint; tenant identity
comes from the validated session and host, never a client-supplied business ID.

Platform administrators can assign plans, renew periods, pause or cancel access,
or schedule cancellation at period end. These changes take effect immediately;
there is no automatic prorating or scheduled downgrade. Assignments lock the
business and subscription, validate periods and plan availability, and record
the acting administrator and before/after values. Policy changes and commercial
plan edits are also audited. Catalog and tenant caches are invalidated on change.
Concurrent page creates/copies share a capacity lock to enforce quotas.

## Payments and deployment

This release does not process payments, create invoices or debit customers.
Choosing a provider requires merchant eligibility in Iraq and a documented
renewal mechanism. FIB's published web-payment API supports customer-approved
payments; automatic recurring charges are not confirmed. Do not present manual
plan assignments as successful online payments or automatic renewal.

After deploying code, run `pnpm db:migrate`, rebuild and restart both services.
Use migrations rather than manual SQL. The forward migration adds Max and a
period constraint. Historical malformed periods are retained for administrator
repair; new inserts and updates must have an end later than their start.

Before enabling payment checkout, require provider-approved credentials and
sandbox testing, server-owned prices/order IDs, authenticated provider
notifications, payment-status reconciliation, idempotent fulfillment,
tenant-scoped billing records, and tested failure/refund/cancellation paths.
Never grant paid access from a browser return URL alone.
