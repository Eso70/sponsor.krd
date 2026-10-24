# Dashboard data audit

Audited 2026-10-24. This covers code paths and automated fixtures, not a comparison
with a production database or an advertiser's external TikTok account.

## Sources and scope

| Surface | Authoritative source | Display contract |
| --- | --- | --- |
| Business / Platform Linktrees | Owner-scoped list and analytics summary | Collection count from the whole returned owner list; exact distinct visitors/clickers from retained events, additive totals from daily aggregates. Search/archive pagination does not replace overview totals. |
| Business / Platform Forms | Owner-scoped Forms list and stats endpoints | totalForms is the whole-owner count, never the current 15-row page length. Responses come from accepted durable submissions. Completion has its own labelled 14-day session period. |
| Analytics drawers / shared reports | Shared page summary/actions and Form report projections | Same components/data ordering. Failed summary requests clear the old range's summary and show unavailable values, not zeros. |
| Templates | Static catalogue and owner template-access endpoint | Catalogue size is known locally; entitlement failures cannot be described as zero available designs. Form catalogue availability remains independent. |
| Business Settings | Authenticated settings and access manifest | Real tab count. Profile editing status reflects cooldown and permission, not business account suspension. Template IDs resolve to catalogue names. Failed loads disable the editable surface. |
| Platform directory | Server pagination and directory-wide summary | Pagination/search use the latest request only. Deletion reloads both list and summary. Missing/failed summaries are unavailable. |
| Platform Settings | Settings, sessions, retention and media endpoints | Actual settings-section count; sessions.length only after a successful session read. No hardcoded session count. Retention/media stay unavailable until loaded. |
| TikTok settings / delivery | Saved Pixel groups and owner-scoped health/errors | A token only counts with a configured Pixel ID. Missing/malformed health is unavailable. Errors endpoint failures cannot become an empty error log or a healthy status. |
| Billing / access control | Guarded server overview endpoints | Failed/missing summaries show unavailable values. Late responses cannot overwrite a newer filter/search request. Global header refresh reloads the mounted page. |
| Communications | Server overview and conversation/announcement projections | Failed initial loads or polling cannot report real zero activity; keep existing rows with an explicit unavailable notice. |
| Campaign catalogue | Browser-local saved drafts | Draft count and configured budgets are local data. There is no live reporting feed. Performance values in cards, grid, table and detail view are unavailable, not local sample numbers labelled live. New video metadata is unknown until actually obtained. |
| TikTok ad account cards | Returned account fields | Missing balance, spend cap or Pixel identity is unavailable. An actual zero remains zero. Amounts use the account currency. |

## Correctness boundaries

`useLatestRequest` prevents an older request from publishing data, errors or final
loading state after a newer request or unmount. It is shared by directory,
Linktree, settings, template access and reporting readers. Existing Forms and
analytics readers retain their abort/sequence guards.

`readFormMetrics`, `readAnalyticsTotals` and `readTikTokSummary` reject malformed
aggregate responses rather than filling in missing counts. A genuine server zero
is different from unknown. The Forms compatibility contract still permits a
missing totalForms field, but the UI renders it as unavailable.

TikTok reconciliation now counts distinct underlying conversion events rather
than destination deliveries, so multiple Pixels cannot inflate accepted conversions.
Delivery totals remain per destination.

No production records, analytics, schemas or access policies are rewritten by
this audit. Backend owner predicates, bot exclusion and session completion
queries remain intact. Regression coverage checks stale-response ordering,
failed requests, genuine zero, missing totals, session counts and local campaign
reporting boundaries, alongside the existing management/report suites.
