# Advertising

The former advertising service is retired. Its routes, catalogs and fresh-install
tables are removed; existing deployments use the dated retirement migrations
described in [Database](database.md#advertising-service-retirement).

The platform campaign workspace saves local drafts in the browser. Account
connection, publishing and live synchronization are unavailable. Ads settings
must not collect credentials or treat query parameters as proof of connection.
See [Frontend](frontend.md#campaign-sample-cleanup).

The retired account card, its credential-bearing account type and its exclusive
amount formatter are removed. The settings entry shows the shared unavailable
state; draft campaign editing remains available.

Public marketing measurement follows [Tracking](tracking.md). Pixel and Events
API delivery remain restricted to eligible published Linktree and form pages,
with owner-scoped configuration and registered actions. All new public actions
must use the shared page tracker.
