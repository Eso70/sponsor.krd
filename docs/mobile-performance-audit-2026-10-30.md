# Mobile performance and TikTok browser audit — 30 October 2026

## Scope and evidence

Page A is [Ali Network Linktree](https://alinetwork.net/linktree/alinetwork). Page B is [Mimoge form](https://alinetwork.net/form/mimoge). These are independent examples of a multi-tenant Sponsor.krd platform, not a single business-wide campaign. The inspected repository uses Next.js 16.3, React 19, NestJS/Fastify and PostgreSQL. Platform engineering can change code; tenant owners can change page content and destinations. Infrastructure access was not verified.

Assumptions: Iraq-based mobile visitors, primarily Sorani Kurdish, then Arabic, occasionally English; test slower mobile connections, not only Wi-Fi. Actual device/network distribution and Iraqi carrier latency were not supplied.

Evidence collected: live server HTML, rendered DOM, script/font/image/link attributes, console logs, response headers and network requests; source code inspection; separate PageSpeed Insights mobile runs on 30 October 2026 at 14:42 GMT+3. Lighthouse 13.6.0 emulated Moto G Power, Slow 4G, HeadlessChromium 153.0.8010.36. These are single-run baselines, not a median or a guarantee of real-device performance.

The supplemental browser capture used a 412 × 823 viewport, DPR 1.75 and disabled cache. It was **not bandwidth/CPU throttled** and was not the real TikTok app. Its transfer sizes, request counts and timings must not be confused with the Lighthouse simulated load metrics. Capture location was not established. No real lead, order, call or message was submitted.

## 1. Executive summary

Top five problems:

1. **A and B: incorrect banner space reservation.** Shared markup used `width=400 height=144` regardless of uploaded image proportions. A displayed a roughly 16:9 banner; B displayed nearly square images. B's introduction moved by a Lighthouse CLS contribution of 0.273.
2. **B: automatic carousel movement during initial loading.** Public banners advanced every three seconds, and Lighthouse's eventual LCP element was a lazy/auto-priority slide. LCP was 5.7 seconds. Rotation is a plausible contributor, not a measured attribution of all 5.7 seconds.
3. **A and B: unnecessary new browsing contexts.** A's action anchors used `_blank`, with `window.open` in the handler. B's optional completion links and both pages' legal links also used `_blank`. These can cause popup handling or context changes; they do not invariably open an external browser.
4. **A and B: substantial JavaScript and render-blocking CSS.** Lighthouse estimated 215 KiB / 173 KiB unused JavaScript and 890 ms render-blocking opportunity respectively. These estimates overlap and are not promised savings. A had 260 ms total blocking time.
5. **A and B: a 97.1 KiB font plus incomplete page-specific field evidence.** Rabar is self-hosted and uses swap, but has no preload and a revalidating URL. PSI has only origin-level INP; claiming either individual page passes real-user Core Web Vitals would be incorrect.

Top five actions:

1. Feed existing upload dimensions into the shared banner renderer and reserve the first slide's proportions. **Implemented locally**, including tenant isolation.
2. Make published carousels manual; retain swipe/dot controls. **Implemented locally.** Use a single hero image for B when the extra slides do not help conversion.
3. Use the current browsing context for A's primary links and B's completion links. **Implemented locally.** Keep intentional WhatsApp/calling handoffs user-triggered.
4. Defer image-viewer code until opened and remove the form gallery's dependency on the complete Linktree header. **Implemented locally.** Further CSS/font/bundle work remains recommended below.
5. Validate after deployment: repeated mobile runs, page-specific field monitoring and physical iPhone/Android TikTok tests. **Not yet verified.**

Changes are uncommitted and undeployed. All live measurements below are **before** these changes. No production score improvement has been measured.

Local verification: frontend/backend production builds, TypeScript and lint passed. Focused tests passed: 110 frontend tests (including Forms management Business/Platform integrations), 28 backend public/form tests and 4 disposable PostgreSQL tests. The database check includes both page types and verifies that one owner's media dimensions are not returned for another owner. This is targeted regression coverage, not a claim that every repository test was rerun or that physical TikTok behavior was tested.

## 2. Speed reports

### Page A — Linktree

[Saved mobile PageSpeed report](https://pagespeed.web.dev/analysis/https-alinetwork-net-linktree-alinetwork/sqy6ms6knn?form_factor=mobile).

| Metric | Current measurement | Target | Assessment |
|---|---|---|---|
| Lighthouse performance | 83/100 | ≥90, engineering target | Below target; score is not a Core Web Vitals pass |
| LCP | 3.5 s, simulated mobile lab | ≤2.5 s | Needs improvement |
| INP | Not available for this URL | ≤200 ms at p75 | Cannot certify this page |
| CLS | 0.103, lab | ≤0.1; aim ≤0.05 | Just outside good |
| FCP | 0.9 s, lab | ≤1.8 s | Good in this run |
| TTFB | 0.129 s, supplemental cold browser navigation | ≤0.8 s | Good in this capture; not throttled/Iraq field data |
| Total blocking time | 260 ms, lab | ≤200 ms | Needs improvement; **not INP** |
| Total transfer | 747 KiB, Lighthouse | ≤600 KiB initial engineering budget | Above proposed budget |
| Initial HTTP(S) requests | 39 during first 10 s, supplemental capture | ≤35 initial engineering budget | Above proposed budget; not a Google threshold |

Largest Lighthouse transfers: TikTok `main.MTJjYzk1MmQ1OQ.js` 127.6 KiB; `/fonts/KurdishFont.woff` 97.1 KiB; application `0vdrfl_moz9wv.js` 72.4 KiB; `0jdhf37ctfzbo.js` 64.8 KiB; global CSS `0wlrdd_2crnfl.css` 45.2 KiB. File hashes are deployment-specific. The unused-JS audit uses slightly different byte accounting; do not mix its sizes with transfer totals.

Slowest supplemental requests: TikTok `events.js` 1,463 ms; app chunk `0jdhf37ctfzbo.js` 373 ms; a TikTok event POST 292 ms; `1qyey63y3m3c2.js` 287 ms. Slow third-party response does not mean the page was blocked for that full time. Lighthouse separately modeled the global CSS request at 900 ms and the 10.8 KiB CSS chunk at 600 ms. Do not add concurrent request durations.

### Page B — Form

[Saved mobile PageSpeed report](https://pagespeed.web.dev/analysis/https-alinetwork-net-form-mimoge/d14oywhn5g?form_factor=mobile).

| Metric | Current measurement | Target | Assessment |
|---|---|---|---|
| Lighthouse performance | 65/100 | ≥90, engineering target | Below target |
| LCP | 5.7 s, simulated mobile lab | ≤2.5 s | Poor |
| INP | Not available for this URL | ≤200 ms at p75 | Cannot certify this page |
| CLS | 0.274, lab | ≤0.1; aim ≤0.05 | Poor |
| FCP | 0.9 s, lab | ≤1.8 s | Good in this run |
| TTFB | 0.127 s, supplemental cold browser navigation | ≤0.8 s | Good in this capture; not throttled/Iraq field data |
| Total blocking time | 30 ms, lab | ≤200 ms | Good; does not establish typing INP |
| Total transfer | 835 KiB, Lighthouse | ≤700 KiB initial engineering budget | Above proposed budget |
| Initial HTTP(S) requests | 47 during first 10 s, supplemental capture | ≤40 initial engineering budget | Above proposed budget |

Largest Lighthouse transfers: TikTok main script 127.7 KiB; Kurdish font 97.1 KiB; app chunk `2d881gwtkdvuf.js` 82.1 KiB; `0vdrfl_moz9wv.js` 72.4 KiB; global CSS 45.2 KiB; largest reported optimized images 39.7 KiB and 19.7 KiB. Images are already relatively small; replacing the entire image pipeline is not the first priority.

Slowest supplemental requests: TikTok `events.js` 949 ms; app chunk `2d881gwtkdvuf.js` 426 ms; `0vdrfl_moz9wv.js` 413 ms; `34dbc52wifpc1.js` 388 ms. Lighthouse modeled the global CSS request at 900 ms and estimated 890 ms render-blocking opportunity overall.

### Field data: shared origin, not separate page measurements

Both PSI reports disabled “This URL” and fell back to **alinetwork.net origin** data for the latest 28-day mobile period: LCP **2.8 s**, INP **346 ms**, CLS **0.01**, FCP **2.6 s**, TTFB **0.7 s**. Origin assessment: **failed**, with LCP/INP above good thresholds. This is not TikTok-specific, not necessarily Iraq-only, and cannot be assigned to either page separately.

Google's good Core Web Vitals thresholds are LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1 at the 75th percentile. FCP ≤1.8 s and TTFB ≤0.8 s are useful diagnostic targets, not additional Core Web Vitals. A single Lighthouse run cannot establish a field pass. Sources: [Web Vitals](https://web.dev/articles/vitals), [FCP](https://web.dev/articles/fcp), [TTFB](https://web.dev/articles/ttfb), [Lighthouse scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring).

## 3. Findings — Page A

“Expected improvement” below states the intended effect, not an observed after-change result.

| Page | Problem | Why it matters | Severity | Exact fix | Expected improvement |
|---|---|---|---|---|---|
| A | Banner advertises 400×144 while rendered image is roughly 16:9 | Wrong reserved height moves buttons; lab CLS 0.103 | High | Local fix: read dimensions from `uploaded_media_assets`, join to the public page's owner, pass through `PublicImageDimensionsProvider` to `PublicImageGallery`. Verify every published banner has dimensions; repair missing legacy inventory through the normal maintenance workflow | Removes this source of image-load shifting where dimensions exist; target CLS ≤0.1 |
| A | Main links force `_blank` / `window.open` | Popup policy may interrupt taps; catch-only fallback misses a silent blocked popup | High | Local fix: native same-context anchors and synchronous `location.href` after shared tracking. Preserve modified-click behavior and the registered-action redirect | Removes forced secondary windows; no guarantee of retaining external app links inside TikTok |
| A | 215 KiB estimated unused JS, 260 ms TBT | Parsing/hydration can delay response to taps | Med | Local fix: lazy fullscreen viewer and standalone header style constants. Next: inspect production treemap/Coverage, split optional widgets and large dependencies; retain only the selected template, which is already dynamically imported | Less initial JS work; exact byte/TBT gain requires deployment measurement |
| A | Four render-blocking CSS files, 59.1 KiB in the relevant audit | Extends rendering critical path | Med | Move dashboard-only CSS out of the root stylesheet into dashboard layouts; use existing CSS modules. Inline only a small, measured critical public shell with CSP-compatible handling, not all 45 KiB of global CSS | Lighthouse estimated up to 890 ms opportunity, not guaranteed or additive |
| A | Rabar WOFF 97.1 KiB, no font preload, `max-age=0` | Delays final typography; repeat visits revalidate | Med | Generate WOFF2 preserving Kurdish/Arabic shaping and Latin glyphs; use `next/font/local`, `display: 'swap'`, one route-appropriate preload and metric-compatible fallback. Fingerprint filename before immutable caching | Smaller font transfer and fewer revalidations; measure font-swap CLS |
| A | Snapchat `/t/Ju1ILFZJ` is a share-link hop; legal links also `_blank` | Additional redirects or new contexts can interrupt browsing | Med | Owner: replace Snapchat share URL with the canonical profile URL after confirming the username. Platform: offer legal content in an accessible in-page panel or intentional same-context navigation | Fewer avoidable hops/context switches; final app handling stays OS-dependent |
| A | Kurdish content has `lang=en`, `dir=ltr` at page/root | Screen readers and mixed-direction text may behave incorrectly | Med | Fix automatic locale selection or expose the existing tenant locale as authoritative; use `lang=ckb`, RTL for Kurdish prose and local LTR/bidi isolation for handles/numbers. Verify mixed English brand names do not override Kurdish body language | Better language/accessibility behavior; no promised speed gain |
| A | No page-specific INP or real TikTok compatibility evidence | Origin averages can hide slow buttons on this page | Med | Add page/tenant-scoped, consent-appropriate aggregate Web Vitals measurement; physically test chooser, app handoff and Back on Android/iOS | Reliable diagnosis and acceptance evidence |

The banner is already eager/high priority and responsive. At the 412 CSS-pixel test width, the browser selected a 750-pixel variant. This is reasonable at DPR 1.75; `sizes=100vw` is correct for the current full-width banner. Do not replace it with a fictitious fixed width. Keep below-fold media lazy. For an owner wanting the lightest hub, turn the banner off or use one compact image and put WhatsApp/contact first.

## Findings — Page B

| Page | Problem | Why it matters | Severity | Exact fix | Expected improvement |
|---|---|---|---|---|---|
| B | Square banner images reserve 400×144; introduction shifts 0.273 | Form moves while a visitor reads/taps; total CLS 0.274 | High | Local fix: stored dimensions set intrinsic image size and first-slide aspect ratio; subsequent slides use `object-contain` in the stable frame. Verify metadata coverage before rollout | Addresses the dominant recorded layout shift without cropping product content |
| B | Three-second autoplay changes initial hero; eventual LCP slide lazy/auto | New large paint can arrive late; lab LCP 5.7 s | High | Local fix: public carousel is manual, first slide remains eager/high priority. Owner can select single-image mode. Keep dots/swipes and lazy secondary images | Stabilizes first-screen content and avoids automatic late hero replacement; rerun to quantify LCP |
| B | 173 KiB estimated unused JS; image viewer/header dependencies on initial route | Extra code competes with input hydration | Med | Local fix: lazy viewer, detached header style constants. Profile `2d881gwtkdvuf.js` before splitting further; lazy-load optional components, preserve immediate validation and phone support | Less initial transfer/execution; current 30 ms TBT is already good |
| B | Five blocking CSS files, 60.4 KiB | Longer rendering critical path | Med | Separate dashboard/root CSS as for A, with independent B regression screenshots in Kurdish/Arabic and both form layouts | Estimated 890 ms opportunity; not a measured guarantee |
| B | Same 97.1 KiB font and missing preload | Font transfer consumes a meaningful share of the 835 KiB page | Med | WOFF2 + Kurdish/Arabic-safe coverage + `next/font/local`; preload only the needed font; retain instant fallback | Reduced payload and more predictable typography |
| B | Name/address have no autocomplete hints; phone already uses tel, numeric mode and tel-national | Visitors type more than necessary | Low | Map known personal-information purposes to `autocomplete=name`, `street-address`, `email`; leave arbitrary custom questions unset. Retain 16px mobile input text and the existing country-code control | Faster completion; typing latency reduction is unmeasured |
| B | Legal popover links use `_blank`; optional completion actions did too | Context switches can abandon an unfinished form | Med | Completion actions fixed locally to same context on public pages. Next: show full legal text in an accessible overlay preserving answers; avoid navigating away mid-form. Do not store personal answers in persistent storage just for this optimization | Fewer abandoned contexts and preserved form state |
| B | Real submission/keyboard/storage behavior inside TikTok untested | Desktop automation cannot prove iOS WebView compatibility | High | Use a dedicated test form/tenant on physical phones; test validation, slow/failed POST, one accepted submission, success state, retry identity and Back. No live customer submission was made in this audit | Prevents false confidence before ad spend |

Already working: input text measured **16px** on mobile; phone is `type=tel`, `inputmode=numeric`, `autocomplete=tel-national`, `dir=ltr`. The form wrapper is Kurdish/RTL even though the HTML root is LTR. Preserve that isolation and consider aligning the root direction for a fully Kurdish form. Submission uses an asynchronous request, a duplicate-click lock and an in-page success state after acceptance; no success-page reload is required. Successful submission duration was **not measured**.

## 4. Delivery and in-app browser behavior

### Delivery findings applying independently to both pages

Both direct HTTPS landing URLs returned 200 without a navigation redirect. Observed first-party delivery supports HTTP/3; HTTP/2 appeared on other requests. HTML and JS/CSS responses used gzip; Brotli was not observed. Optimized images were served as AVIF. Static build assets had `public, max-age=31536000, immutable`; optimized images had a one-year lifetime with `Vary: Accept`. HTML was private/no-store. No console warnings/errors appeared in the inspected sessions. Both server HTML documents already contained their main content.

These are working features, not defects to “fix.” CDN vendor, origin location and Iraqi-carrier latency were not verified. HTTP/3 does not prove a particular CDN. If investigating delivery further, inspect the hosting/reverse-proxy configuration and run regional tests; do not move servers on the basis of these fast non-Iraqi measurements alone.

| Page | Problem | Why it matters | Severity | Exact fix | Expected improvement |
|---|---|---|---|---|---|
| A | Font URL revalidates; HTML is private/no-store | Repeat visits still require requests | Low | Fingerprint/cache font first. Only consider public HTML caching after validating Host/tenant, locale, published state, nonce/CSP and invalidation behavior; retain live authorization/entitlement checks | Faster repeat visits without leaking tenant content; no assumed first-visit gain |
| B | Font URL revalidates; HTML is private/no-store | Same repeat-load cost; cached form revisions can become stale | Low | Fingerprint/cache font. Keep form revision validation; any public-content cache must invalidate on edit/pause and never cache submissions or private responses | Faster repeat loading while preserving valid submissions |
| B | PSI suggested TikTok preconnect, estimated 260 ms | DNS/TLS setup can delay the asynchronous SDK | Low | Test one consent-aware preconnect to `https://analytics.tiktok.com` only on allowlisted marketing pages with an enabled owner pixel. Do not add it to dashboards/root pages | Possible connection-start improvement; PSI estimate is not proven LCP gain |
| A | No page-specific preconnect opportunity reported | Unnecessary hints can compete with hero resources | Low | Keep image/font same-origin; add no speculative social-domain preconnects before a user chooses a destination | Avoids waste; no claimed reduction |

Next.js recommendations: real image dimensions and accurate `sizes`, eager/high priority for the visible hero, lazy loading for lower content; do not blindly combine every preload/priority mechanism. Next.js 16 documents `preload` in place of deprecated `priority`, while eager loading/fetch priority remain options. Keep the current nonblocking TikTok loader and its tenant guards; do not delay conversion tracking until after the visitor has left. Sources: [Next Image](https://nextjs.org/docs/app/api-reference/components/image), [lazy loading](https://nextjs.org/docs/app/guides/lazy-loading), [fonts](https://nextjs.org/docs/app/getting-started/fonts), [LCP](https://web.dev/articles/optimize-lcp), [CLS](https://web.dev/articles/optimize-cls). Installed 16.3 documentation was also checked; online docs now describe a newer release, so verify version-specific APIs before adopting additional options.

### What opens inside TikTok

Normal website destinations commonly open in TikTok's in-app web view. TikTok explicitly documents webview URLs for TopView; do not generalize that format's restrictions to every ad format. Bio-link handling and exact outbound behavior must be tested in the current iOS/Android app, region and account. I did not find official documentation establishing a universal advertiser setting that forces every website/bio visit to remain in-app. A page cannot lock the browser, override the user's external-browser choice or guarantee how an installed app handles a universal link. [TikTok TopView specifications](https://ads.us.tiktok.com/resources/help/article/tiktok-reservation-topview).

Use the final HTTPS landing URL directly in the ad. Avoid intermediate link shorteners, automatic app redirects, `intent://` hacks, timed app-open loops and popup-dependent navigation. `target=_self` removes the page's request for a new window; it does not prohibit TikTok or the OS from handing a destination to another app.

### Outbound inventory — Page A

* **WhatsApp button:** `https://wa.me/9647504336180?text=…`. Opens the question chooser first. The final selection uses a registered-action first-party tracking hop, then WhatsApp. Keep the chooser in-page; only hand off on the final tap. Sending a WhatsApp message necessarily involves WhatsApp/web WhatsApp, so keeping that entire action inside TikTok is not a compatible requirement. Offer a visible number/Copy number fallback and, where suitable, a tenant contact form. Do not label a click as a sent message.
* **Instagram:** `https://www.instagram.com/ali_karem090`. Same-context HTTPS is the best web fallback; Instagram/TikTok/OS can still open an installed app. Offer a copyable handle.
* **Snapchat:** `https://snapchat.com/t/Ju1ILFZJ`. Replace the share-link hop with the verified canonical profile address where possible; username was not verified, so none is invented here.
* **TikTok:** `https://www.tiktok.com/@ali_karem090`. May return to TikTok's native profile UI; that is an intentional destination, not an external-browser bug. Website code cannot guarantee native routing or a follow.
* **Phone:** `tel:+9647504336180`. Intentionally invokes calling UI; use direct user-gesture navigation and a copyable number. No tracking redirect for native schemes.
* **Privacy/Terms footer:** external `sponsor.krd/legal/...` links with `_blank`. Still pending: an in-page legal panel or deliberate same-context route; preserve navigation/accessibility.

The first-party route `/api/public/analytics/open/{pageId}/{actionId}` resolves registered destinations server-side. It is intentional measurement and open-redirect protection. Do not delete it merely to save a hop without replacing reliable delivery/deduplication. Its end-to-end latency and downstream social redirect chains were not exercised in this audit; opening those would create real contact/action tracking. Measure with a test tenant and a preserved network log.

### Outbound inventory — Page B

The initial form has no primary outbound anchor; filling and submitting can remain in the current page. The privacy help reveals platform policy links using `_blank`. Optional success actions support website/app destinations and previously opened new windows; the public completion links now use the current context locally. A source-return control is also explicit, not automatic. This example's completed state and configured final destinations were not reached because no production lead was submitted. Use a test submission to inventory each final URL and any app-store redirect.

No install-banner metadata or forced `intent://` redirect was found in either fetched HTML document. No file/camera input is present in these two examples. That does not certify future tenant forms with different features.

### Cookies, storage and forms

Source inspection confirms visitor/session storage has an in-memory fallback when local/session storage throws. This improves resilience, but IDs may change after a WebView closes and third-party cookies are not dependable. Neither page requires visitor login to render. Keep form submission independent of pixel availability and preserve the server acceptance/idempotency path. Test storage disabled, tracking blocked, interrupted connections, background/foreground and app return on physical devices; desktop Chromium success cannot certify TikTok's WebView.

For a future file/camera feature: request access only after an explicit user gesture, use a normal file picker fallback and test each OS/app version. Those capabilities were not tested because these pages do not use them.

### TikTok-native alternatives

**A:** An Instant Page can present a focused offer or small choice of buttons inside TikTok. It is not a way to keep WhatsApp itself inside TikTok. The current official creation guide lists eligible campaign objectives and specifically excludes Lead Generation; verify current account eligibility instead of assuming it can be added to a Contact campaign. Native page views/interactions are not automatically your website's first-party events, and website Pixel events start only when the website is visited. [Instant Page documentation](https://ads.tiktok.com/resources/help/article/create-instant-page).

**B:** Lead Generation → Instant Form is the native alternative for contact collection. It can reduce website loading friction and prefill supported details, but your custom conditional questions/product options may require the website form. Sync leads to the correct tenant's CRM/system and retain the TikTok Lead ID; don't manufacture a website `SubmitForm` for a native submission. Compare qualified-lead and sale rates, not only cheapest lead. Verify Kurdish copy/rendering, available question formats, consent text and country/account availability in the builder. [Instant Form setup](https://ads.tiktok.com/resources/help/article/set-up-lead-generation-with-instant-form?lang=en&redirected=1), [CRM signal postback](https://ads.tiktok.com/resources/help/article/about-lead-quality-optimization-and-crm-signal-postback).

For both pages, compare TikTok clicks with **Landing Page Views** when available. TikTok defines LPV as an ad click followed by successful landing-page loading; it is distinct from advertiser-sent PageView/ViewContent events. A load-speed change cannot guarantee CPA improvement. [LPV documentation, updated September 2026](https://ads.tiktok.com/resources/help/article/landing-page-view).

## 5. Control boundaries

**Tenant owner:** banner on/off; single image versus carousel; concise copy; question count/order; final destination URLs; canonical social links; ad destination and supported TikTok-native format. Do not share one tenant's pixels, audiences or lead integrations with another.

**Platform engineering:** shared media rendering, dimensions payloads, default link targets, CSS/JS/font loading, mobile field hints, legal overlay, validation, submission retries and per-page performance instrumentation. All six Linktree templates and both owner dashboard integrations must use the shared implementations.

**Hosting operator:** CDN rules, compression, origin location, HTTP protocols, cache invalidation and deployment. The repository alone does not establish current control-panel access.

**TikTok/OS/user:** in-app browser implementation, external-app prompts, universal-link routing, storage lifetime, permission prompts and browser choice. No HTML tag or ad setting identified here guarantees control over these.

## 6. Implementation and rollout order

1. **Completed locally:** reuse stored dimensions through one owner-scoped query and one shared provider; reserve banner geometry; keep published carousels manual; defer fullscreen viewer; remove gallery's full-header dependency; same-context main/completion navigation. No schema migration or new tracking mechanism.
2. **Before deployment:** verify stored dimensions exist for the published banners. Missing/legacy records retain the old fallback rather than inventing dimensions. Backfill with the existing storage driver/validated metadata pipeline in an approved maintenance operation; do not read/decode full images on every page request. Metadata must remain owner-scoped.
3. **Deploy through the owner's normal release process.** No git operations or deployment were performed here. Keep existing analytics fixes in mind when reviewing the full uncommitted working tree.
4. **Retest A and B separately:** three fresh PSI mobile runs each, report median and range; compare raw LCP/CLS/TBT and transferred bytes, not just scores. Confirm first image is discoverable in server HTML and does not lazy-load. Confirm banner still looks correct in all six templates and both form layouts.
5. **Next performance increment:** WOFF2/font caching and public CSS separation; use bundle attribution before removing code. Leave the asynchronous owner Pixel intact. Enable Brotli only if the hosting layer supports it and measured compressed sizes improve.
6. **Next journey increment:** legal overlay that preserves form answers, copy-number/handle fallback, canonical Snapchat destination and known-purpose autocomplete. These recommendations are not implemented in this patch.
7. **Physical TikTok acceptance test and field monitoring** before scaling ad spend. Compare page-specific p75 by device and relevant geography when sample size is sufficient.

## 7. Final verification checklist

On **one iPhone and one representative Android phone**, use the current TikTok release and record OS/app versions. Test Wi-Fi and a real Iraqi mobile connection, plus a slower connection where practical. Use the actual ad preview/test delivery and the profile bio path separately; pasting the URL into Safari/Chrome is a useful comparison, not an in-app test.

- [ ] A and B open from their final HTTPS URLs with no unexpected external-browser prompt, blank page or redirect loop.
- [ ] Record screen video from tap to usable content; note that stopwatch/video timing is not a substitute for LCP instrumentation.
- [ ] Banner space is reserved from first render, font swaps do not move controls, and manual slides retain one stable frame.
- [ ] Kurdish/Arabic shaping, punctuation, numbers, RTL order and long labels are correct; no missing glyphs.
- [ ] A: every button responds to one tap; question chooser opens/closes; selection hands off once; cancel/Back returns cleanly. Test with WhatsApp installed and unavailable. Confirm fallback number/handle behavior.
- [ ] B: phone keypad, country selection, name/address entry, keyboard scrolling, validation and consent controls work. No keyboard hides the focused field or submit action.
- [ ] B: on a dedicated test form, submit once, double-tap, retry after a dropped response and confirm one stored response and one deduplicated conversion. A slow request preserves entered answers and gives clear feedback.
- [ ] B: success appears in-page only after server acceptance; final links and return action are deliberate and behave correctly inside TikTok.
- [ ] Blocking TikTok requests or denying storage does not prevent navigation/submission. Verify attribution separately; never equate a successful form with guaranteed pixel receipt.
- [ ] Refresh, background/foreground, close/reopen and app return have documented state behavior. Do not promise persistence of unsent form data across WebView destruction.
- [ ] Run PSI three times per page; target LCP ≤2.5 s, CLS ≤0.1, FCP ≤1.8 s and TBT ≤200 ms. Use field p75 INP ≤200 ms when available.
- [ ] For exact request totals/slowest files: DevTools Network → mobile viewport → disable cache → clear log → reload → capture first 10 seconds → sort by Size and Time. Export a sanitized HAR without cookies, tokens, answers or tracking identifiers. Use a local Lighthouse navigation run or WebPageTest when you need a downloadable throttled waterfall.
- [ ] For page-specific INP: collect Web Vitals over real interactions with route/tenant scope; use DevTools Performance while tapping/typing for lab diagnosis. Do not rename TBT as INP or reuse the origin's 346 ms as both pages' result.
- [ ] Validate with Events Manager after navigation changes: one intended action, correct owner Pixel, same event ID for Pixel/API. Retain shared tracker/action registration.

Physical TikTok tests, production submission latency, regional network tests, post-deployment scores and page-specific real-user INP remain unverified. This report does not claim those checks passed.
