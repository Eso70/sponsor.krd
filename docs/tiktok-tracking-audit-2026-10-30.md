# TikTok tracking audit and campaign blueprint

Audit date: 30 October 2026. Platform: Sponsor.krd, Next.js/NestJS, tenant-owned public pages and forms.

Page A: [Ali Network Linktree](https://alinetwork.net/linktree/alinetwork). Page B: [Mimoge form](https://alinetwork.net/form/mimoge).

These are examples, not a shared offer or a platform-wide campaign. Recommendations must be configured independently for each business. Iraq is inferred from IQD, +964 phone fields and Kurdish/Arabic usage. Delivery areas, margins, target CPA and account permissions remain unconfirmed.

Evidence labels: **Live** = observed browser/network behavior; **Code** = repository inspection or regression tests; **Verify** = requires the owner's Events Manager/account or a controlled conversion. Local fixes described here are not deployed.

## 1. Executive summary

### Top five issues

1. **Live, High:** Opening Page A's WhatsApp chooser fires `Contact` before any question is selected. Its request has an empty `event_id` and identifies Event Builder rule `10318551`. It cannot deduplicate against the application's separately identified contact event. The rule also sends a product content classification for a WhatsApp action.
2. **Code, High:** The reliable outbound redirect discarded the question ID. When it won the race against the beacon/batch, the click was stored without question attribution and later copies were deduplicated.
3. **Code, High:** Raw event conversion decisions and daily rollups differed. Accepted form submissions and some registered Contact actions could be represented inconsistently across reports.
4. **Code, Med:** TikTok health mixed destination counts with browser events and filtered delivery creation dates rather than the original event's page-local date. Delays and multiple Pixels distorted comparisons.
5. **Code/Verify, High:** A successful HTTP response without TikTok's success code could be marked delivered. Live Events API receipt, destination ownership, match quality and account attribution settings remain unverified.

### Top five actions

1. In the owner account, remove/correct Event Builder rule `10318551` and any overlapping button/URL rules. Keep one application-owned conversion trigger per real action. Review and save Event Builder changes; TikTok notes propagation can take up to 30 minutes. [Event Builder guidance](https://ads.tiktok.com/help/article/how-to-add-or-edit-events-event-builder-and-custom-code?lang=en)
2. Deploy the local attribution, immediate chooser delivery, conversion consistency, reporting and delivery-acknowledgement fixes after review.
3. Validate Page A with `Contact` on the final outbound choice and Page B with `SubmitForm` only after an accepted response. Verify matching Pixel/event name/event ID across channels. [Deduplication](https://ads.tiktok.com/help/article/event-deduplication?lang=en)
4. Keep datasets, tokens and audiences inside their owning business. Separate A/B reporting and campaigns by page/action IDs, even when a single business intentionally uses one Pixel for both.
5. Launch only after a controlled end-to-end test. Optimize against chats/leads and business quality, not combined event totals or unconfirmed revenue.

## 2. Separate page audits

### Page A — Linktree contact hub

Live page: five destinations, WhatsApp, Instagram, Snapchat, TikTok and phone. WhatsApp opens three saved questions. One Pixel loader for `DBEH56JC77U8I4RJ07VG` was observed. One application `ViewContent` per inspected load shared its ID with the first-party `page_view`, whose collector returned HTTP 202. TikTok's separate base `Pageview` also appeared; it is a different event, not another confirmed conversion.

| Page | Problem | Why it matters | Severity | Exact fix |
| --- | --- | --- | --- | --- |
| A | **Live:** chooser open fires Event Builder `Contact`, empty event ID, rule `10318551`. | Counts abandonment as contact; cannot merge with the application's conversion. | High | Disable/correct that owner Pixel rule. Keep chooser open/dismiss first-party only; fire `Contact` after a question selection or direct contact handoff. |
| A | **Code, fixed locally:** redirect omitted `whatsappQuestionId`. | A real selection can appear as zero in question analytics. | High | Pass the bounded saved ID through the redirect DTO and resolve its label against the page-owned configuration. Keep the original event ID on retries. |
| A | **Code, fixed locally:** chooser engagement waited for normal batching. | Quick exits or app suspension can lose opens/dismissals. | Med | Immediate beacon/flush for both events; selection close must not record dismissal. |
| A | **Verify:** Pixel ID loads, but intended ownership and Events API token validity are unknown. | A technically working Pixel can send to the wrong advertiser. | High | Match `DBEH56JC77U8I4RJ07VG` to this business's selected dataset and ad account; verify Server & Browser events and destination token in its account. Never use this example ID as a global default. |
| A | **Code/Live:** buttons have separate registered action identities; outbound links do not automatically carry campaign tags. | Platform click breakdown is possible, but destination-side attribution may be lost. | Med | Retain first-party attribution before navigation. For owned websites, append an allowlist of campaign tags without overwriting destination parameters. Social apps may ignore them; use an approved campaign reference in WhatsApp prefill where useful. Do not forward cookies or raw visitor IDs. |
| A | **Verify:** no real ad `ttclid` was tested. | Cookie presence alone does not prove paid attribution. | Med | Open a real test ad and follow its action in the TikTok in-app browser. Confirm the original `ttclid`, UTMs and `_ttp` reach the event/session and server payload. Do not invent click IDs. |
| A | **Code/Verify:** contact intent, followers and sales are different outcomes. | A profile click is not a follow; opening WhatsApp is not a sent message. | High | Optimize `Contact` only for the defined contact handoff. Keep social outbound clicks separate. Confirm conversations/orders through a trusted downstream integration before reporting those outcomes. |
| A | **Code/Verify:** browser counts, system clicks and Ads Manager results use different units. | One tap can generate first-party, Pixel and server copies without being three results. | Med | Reconcile distinct IDs for the same event, page, date/timezone and dataset. Keep destination delivery counts separate; match attribution windows before comparing ad results. |

The live first-party collector accepted the chooser-open event during inspection. This means zero opens in a dashboard still require checking the selected page, dates, deployed version and owner-scoped report; the browser request alone does not prove the dashboard query or historical record.

### Page B — form submission

Live page: Kurdish product enquiry/order-request form with quantity choices advertised as one item for IQD 8,000 or two for IQD 15,000, color, optional name, required address and required +964 phone. Submit is disabled until valid. Privacy acknowledgement is preselected. The same example Pixel ID loads once. One application `ViewContent` matched its first-party view ID and the collector returned HTTP 202. No GTM/GA4 loader was observed on either page. No production order/lead was submitted during the audit.

| Page | Problem | Why it matters | Severity | Exact fix |
| --- | --- | --- | --- | --- |
| B | **Code, fixed locally:** accepted `form_submit` was missing from the effective conversion decision unless another condition classified it. | The saved response, daily conversion total and TikTok delivery can disagree. | High | Mark transaction-backed successful submissions as conversions and pass that same decision into both rollups. Never trigger from a button tap, validation failure or failed response. |
| B | **Code verified; live success unverified:** submission and analytics/outbox commit together; browser `SubmitForm` uses the same request ID after success. | This is the correct deduplication boundary, but production credentials may still fail. | High | Run an owner-controlled submission using Events Manager testing and an explicitly disposable response; check both channels and the saved receipt. A thank-you URL is optional; the accepted in-page success state is sufficient. |
| B | **Code:** repeated request ID deduplicates; a new ID can submit the same person's details again. | Network retries are handled, but spam and repeated humans can still inflate leads. | Med | Preserve retry IDs and server validation. Add owner-scoped quality screening and duplicate flags for fresh requests; use rate limits and risk-based anti-spam challenges rather than treating every valid phone as a real lead. |
| B | **Live/Code:** privacy acknowledgement is prechecked and tracking is automatic on allowlisted routes. | A form acknowledgement does not demonstrate a separate marketing choice. | High | Review the actual market-specific privacy requirements. Where consent is required, implement a separate explicit marketing choice and enforce it in both browser and server. Do not treat prechecked acknowledgement as marketing consent. |
| B | **Code:** submitted phone/email are not passed from form answers into advanced matching. | Server-side matching lacks potentially useful signals; this is intentional data minimization, not proof of an error. | Med | If approved by the business's privacy policy and lawful basis, add explicit server-side matching from normalized fields, with SHA-256 and no raw answers in analytics. Do not enable arbitrary form-field scraping. |
| B | **Code:** answers, quantities and colors remain first-party; submission has no monetary value. | Form completion is not confirmed revenue; ROAS cannot be inferred from advertised prices. | Med | Keep `SubmitForm` unvalued. Optionally define an allowlisted non-sensitive product/variant ID schema. Send revenue only for a trusted accepted commercial outcome, using a deliberately chosen event and supported currency. |
| B | **Docs:** USD is supported; IQD is absent from TikTok's published currency list. | Relabeling an IQD amount as USD corrupts value reporting. | High if values enabled | Keep IQD in the system. For a real valued event, convert to USD on the server using a recorded rate, source and timestamp; or omit value/currency and optimize for count. Never send 8,000 IQD as USD 8,000. |
| B | **Verify:** no account access, actual submission, Test Events/EMQ or GA4 property was inspected. | Public page inspection cannot establish production server receipt or advertiser attribution. | High | Complete the validation matrix below. Confirm account data-source permissions, token health and diagnostics separately for each business. |

TikTok's current supported-currency list includes USD and omits IQD. Recheck before enabling monetary events. [Parameters and currencies](https://ads.tiktok.com/help/article/about-parameters?lang=en)

## 3. Implementation plan in order

### 1. Establish ownership and remove overlapping triggers

Use the existing tenant-aware integration: browser Pixel plus NestJS transactional outbox. Each business owns its Pixel destinations, encrypted tokens, events and audiences. A single business may use one dataset across its own A/B pages; independent measurement does not require duplicate Pixels. If deliberately using separate datasets, route both copies of each event to the same selected dataset. Current code fans eligible events out to all active groups for that owner, so per-page dataset selection would require an explicit routing feature.

Keep tracking off platform/admin/dashboard/landing surfaces. GTM is unnecessary for this implementation. If a business later uses it, choose a single event owner so GTM and application code do not both fire conversions. Server-side GTM is an alternative forwarding layer, not proof of a successful submission or a replacement for tenant checks. [Events API setup](https://ads.tiktok.com/resources/help/article/events-api?lang=en&redirected=1)

### 2. Use separate event contracts

**A:** `ViewContent` for viewing the Linktree; `Contact` for the final WhatsApp choice/direct contact handoff; distinct content/action IDs for every button. Chooser opens, dismissals and active time stay internal. Existing non-contact buttons use `ClickButton`; confirm its legacy/account support because the current public standard-event list differs. If replacing it with an approved custom outbound event, change the shared registration and both channels together. Do not label a TikTok/Instagram profile click as a confirmed follow.

**B:** `ViewContent` for the form page; internal start; one `SubmitForm` for each accepted response, using its persistent request ID. No `Purchase`, checkout or cart event simply because quantity/color were selected. No second conversion for a thank-you render or retry. TikTok currently documents `Contact` and `SubmitForm` for lead objectives. [Standard event definitions](https://ads.tiktok.com/help/article/standard-events-parameters?lang=en)

Use event ID, occurrence time, canonical page URL and the registered content/action ID. Keep question identity internal. Never pass addresses, free-text answers or message bodies as event properties. Hash authorized email after trim/lowercase; normalize phone to valid E.164, including `+964` and no local trunk zero, then SHA-256 once. Preserve real `ttclid`, `_ttp`, server-observed IP/user agent and a scoped hashed external ID where permitted. Hashing is not anonymization. Check actual Event Match Quality in Events Manager; no numeric score can be established here. [Matching keys](https://ads.tiktok.com/help/article/how-to-set-up-matching-events-with-events-api), [normalization specification](https://business-api.tiktok.com/gateway/docs/index?doc_id=1771100865818625&language=ENGLISH)

### 3. Standardize campaign attribution

Use separate landing URLs and campaign names, for example `iq_ckb_a_contact_2026q4` and `iq_ckb_b_submitform_2026q4`. Suggested query template:

```text
utm_source=tiktok&utm_medium=paid_social&utm_id=__CAMPAIGN_ID__&utm_campaign=iq_ckb_b_submitform_2026q4&utm_term=__AID__&utm_content=__CID__
```

Use `a_contact` for Page A. Validate macro expansion in the account's URL builder, especially upgraded Smart+. UTMs are campaign labels, not a replacement for `ttclid`. Do not duplicate automatically attached parameters. [Official UTM macros](https://ads.tiktok.com/resources/help/article/track-offsite-web-events-with-utm-parameters)

### 4. Validate both pages independently

In Events Manager select the business's dataset, open Test Events and use Pixel Helper on the published URL. For server diagnostics use the dataset's test code; remove it from production traffic. For a conversion compare the dataset, exact event name and exact event ID in browser/server; inspect received/deduplicated events and diagnostics. A browser HTTP 200 or collector 202 alone is insufficient. [Pixel Helper](https://ads.tiktok.com/resources/help/article/TikTok-pixel-helper-2.0), [testing and deduplication checks](https://business-api.tiktok.com/portal/docs/verify-events-setup/v1.3)

- A: page load once; open chooser without `Contact`; dismiss without `Contact`; select once with one identified `Contact`; rapid repeat; another question; phone handoff; failed/offline retry.
- B: page load; first interaction; invalid form; failed request; accepted response; double tap/retry; success render/reload. Only accepted responses convert.
- Both: desktop, Android/iOS TikTok in-app browser, Safari and an ad blocker. Blocking the Pixel may leave the first-party/server copy working, but blocked first-party requests or missing matching data can still cause loss.
- Tenant check: a second business must neither receive the example Pixel nor read the example analytics. Form responses and customer lists must remain owner-scoped.

For GA4, first establish whether a property actually exists. If added, use page views, explicit outbound-contact events and `generate_lead` after successful form acceptance, with no PII. Compare identical event definitions, timezone, window and attribution model. System totals include organic traffic; Ads Manager attributes eligible ad results; GA4 may credit a different channel. Equality is not an appropriate acceptance criterion.

## 4. Audience and campaign blueprint

These are starting hypotheses, not measured performance benchmarks. The examples do not establish every tenant's industry or economics.

### Page A — contact acquisition

- Use Lead generation with Website optimization and the verified `Contact` event if available in that account. A focused offer/contact page is preferable to a five-destination hub for cold conversion ads. Keep the hub for profile traffic, business discovery and retargeting. Do not use a Traffic campaign as a substitute for contact optimization without labeling the different goal.
- Begin with the business's actual service/delivery locations in Iraq, adult buyers and all genders unless the offer justifies a restriction. Use Kurdish creative for Kurdish-speaking service areas, Arabic creative in separate tests; English only for a demonstrated segment. Confirm available location/language controls in the account; do not assume a Kurdish targeting selector exists. Broad geography plus localized creative is a better first test than stacking many interests.
- Keep contact acquisition separate from follower acquisition. For TikTok followers, use Community interaction/Follows and Spark Ads where available, with the native profile destination; website profile clicks do not prove follows. [Community interaction](https://ads-useast2a.tiktok.com/resources/help/article/community-interaction-objective?lang=en)
- Audiences: A visitors without Contact over 7–14 and 30 days; recent video viewers/engagers; exclude recent contacts where repeated acquisition is wasteful. Question-specific retargeting needs supported event-parameter audience rules or an explicitly consented first-party audience; it is not automatically available because the dashboard has question rows.
- Creative tests: Kurdish owner introduction, service/offer demonstration, trust proof, and one clear WhatsApp CTA. Example hook: “Need the price? Choose your question and contact us.” Test Spark and ordinary in-feed creative using the same outcome definition.

### Page B — qualified submissions

- Use Lead generation/Website and `SubmitForm`. This example is a product order request, not confirmed payment. If a future integration validates paid/fulfilled orders, build a separate lower-funnel sales strategy using the then-supported purchase event; do not manufacture it from a form receipt.
- Start with adults in deliverable locations, broad gender and localized Kurdish creative. Test Arabic separately only when budget supports it. For this example, demonstrate the musical item, show how it works and honestly show one-for-IQD-8,000/two-for-IQD-15,000 pricing, battery needs, delivery charges/timing and order-confirmation process. Do not invent shipping promises.
- Retarget B visitors without SubmitForm over 7–14/30 days. Keep A and B URL/event filters separate. Form-start abandonment is currently internal; do not promise a TikTok form-start audience until an approved trackable event is implemented and available.
- Use qualified customers or verified leads as lookalike seeds when sufficiently matched; begin with the available narrow setting and compare against broad targeting. Prefer proven buyers over all site visitors. Exclude recent submitters/customers as appropriate. Customer uploads require the business's own authorized data, never pooled platform tenants. Confirm current lookalike eligibility in the account. Website/custom audience targeting generally requires 1,000 matched users, so avoid fragmenting tiny groups. [Website audiences](https://ads.tiktok.com/resources/help/article/how-to-create-a-website-traffic-audience), [lookalike setup](https://ads.us.tiktok.com/help/article/create-lookalike-audience?lang=en)

### Budget, learning and decisions

Start each business with one primary conversion campaign, one broad prospecting ad group and 3–5 genuinely different creatives. Add an interest comparison or retargeting only when budget/audience size can support it. A/B page roles stay separate even if a business initially funds only one.

Use the actual account minimums. TikTok's current budget guidance lists USD 50 campaign-level and USD 20 ad-group-level minimums; confirm the exact threshold in the account. Where possible, a no-limit campaign with an explicit ad-group cap avoids an unnecessary campaign cap. A planning hypothesis is 3–5 times the affordable CPA per day, subject to the account minimum and a pre-agreed loss limit; this is not a platform guarantee. [Budget guidance](https://ads.us.tiktok.com/resources/help/article/budget-and-bidding-faq)

Allow several days and enough real results to evaluate quality; avoid frequent pauses and large simultaneous edits. Current general TikTok guidance describes volatility easing around 25 results or seven days, rather than a universal guaranteed 50-conversion rule. As an operator heuristic, scale a stable profitable group by roughly 10–20% and reassess after 24–48 hours; that does not guarantee learning will remain unchanged. [Current learning guidance](https://ads.tiktok.com/help/article/learning-phase?lang=en)

For A, monitor landing-to-contact rate, cost per contact, actual chat-start/qualified-chat rate and cost per qualified chat. For B, monitor view-to-start, start-to-accepted-submission, valid-phone/contactable-lead rate, duplicate/spam rate, confirmation/delivery rate and cost per qualified lead/order. Track creative outbound CTR and landing-page arrival rate as diagnostics, not business outcomes.

There is no defensible universal Iraq/Kurdish CPA benchmark from the available evidence. Set targets from contribution margin after fulfilment, delivery, cancellations and returns. If a qualified lead converts to a profitable sale at rate `r`, then maximum affordable qualified CPL is `r × allowable acquisition cost per sale`. Establish each business's own 7–14-day baseline before declaring a creative winner. Never optimize USD/IQD mixed values as one currency.

## 5. Final checklist

- [ ] Business owner verifies intended Pixel ID, ad-account access, destinations and token health independently for A and B.
- [ ] Remove/correct Event Builder rule `10318551`; check every other overlapping rule and wait for propagation.
- [ ] Deploy and smoke-test local fixes; no database reset is needed.
- [ ] A chooser open/dismiss emits no TikTok Contact; final contact shares one event ID across channels.
- [ ] B accepted response emits one SubmitForm; invalid/failed/retried requests do not add conversions.
- [ ] Test Events confirms actual server receipt and deduplication; Pixel Helper confirms browser payloads.
- [ ] Verify real-ad ttclid/UTMs and iOS/in-app navigation; retain correct date/timezone and dataset filters.
- [ ] Confirm privacy choices, advanced-matching policy and owner-scoped audiences; omit raw answers and contact text.
- [ ] Keep IQD local; only send supported, correctly converted monetary values for trusted outcomes.
- [ ] Confirm current objective/event availability, currencies, macros, audience eligibility and budget minimums in each account before launch.
- [ ] Agree on qualified-result definitions, target CPA and a spending limit before creating campaigns.

### Local engineering verification

Frontend and backend production builds, type checks and lint passed. The frontend analytics/drawer/placement run passed 117 tests; queue/question focused coverage passed 29 tests. Analytics/forms unit run passed 183 executable tests, but the unchanged phone-metadata suite could not resolve `libphonenumber-js/max` under Jest. The database run passed the Linktree regressions and 14 form tests; one existing form-pagination test expects 20 items while the current shared page size is 15. Those two broader-suite failures are outside these tracking changes and remain unresolved. No production submission, campaign change, deployment, history rewrite, commit or push was performed.
