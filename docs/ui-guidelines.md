# UI Guidelines

## Purpose

This document defines the UI standards for Sponsor.krd.

The goal is to ensure every page, component, and interaction feels like part of the same product while keeping business and platform administration implementations properly separated.

General development principles are defined in `AGENTS.md`. This document focuses on the visual system and UI architecture.

---

# Design Principles

Shared CustomSelect list menus use subtle neutral hover and selection backgrounds
in light and dark mode; icon-card menus keep the dashboard accent. The portaled menu carries the
trigger's theme variables and local light/dark appearance across the portal, so
drawer dropdown menus remain readable when their theme differs from the page.
Selected list rows use the menu's light/dark text palette (or explicit inherited
appearance), rather than the root theme text token, to preserve text/check contrast.
Custom and Personal question Add menus and both
dashboard surfaces use the same tenant/platform accent. Hover does not select
an item or add a colored outline. List rows use compact heights and reduced-motion
aware opening transitions.

Enabled buttons, links, expandable section headers, switches, selection actions,
and upload controls use the native pointer (hand) cursor through the shared root
stylesheet. Form section toggles also declare `cursor-pointer` explicitly.
Disabled and busy controls retain their native not-allowed/wait feedback;
crop frame edges and corners explicitly override the global button cursor with
directional resize cursors through the shared `data-crop-edge` selectors.
reorder handles retain grab/grabbing, including while dragging across other
controls. Text inputs keep the normal text cursor. Do not restore custom cursor
assets or colored focus outlines. During drag only, the shared ReorderHandle
marks the held item with a theme-tinted header and solid border, and the current
drop target with a lighter tint and dashed border. These states clear on release,
cancel, lost pointer capture, or unmount.

Every interface should prioritize:

- Consistency
- Clarity
- Simplicity
- Accessibility
- Responsiveness
- Reusability

Users should not feel like they are switching between different applications.

## Typography

Forms reuse `StatCardGrid`, `StatCard`, `DashboardSurface`, `PageHeader`, and
`ManagementTable`, `ManagementGrid`, and `ManagementCard`. Forms and both Linktree
surfaces reuse `ManagementToolbar` for search, Active/Archive selection, grid/table
switching, refresh, and create actions. `ManagementSearchModal` owns their search
presentation, result selection, and dialog keyboard behavior. The editor uses
`ManagementDrawer`, an end-side presentation of
`ManagementModal`, sharing its theme, focus trap, Escape handling, and focus
restoration. The drawer slides horizontally from the right edge toward the left,
with 32px rounded exposed left corners matching the sign-in preview card,
full viewport height, and no modal zoom. Opening and closing use a 900 ms
transform with a gradual start and finish; the dimmed backdrop fades over 600 ms with a small static blur. Reduced-motion users receive an
immediate transition. It fills mobile screens and leaves part of the dashboard
visible on desktop. Its header/footer remain visible.
Form editing keeps one mounted drawer from its loading skeleton through the
loaded editor, so fetching the definition does not restart its entrance. Form
editor and analytics drawers retain their surfaces until exit animation finishes.
The overlay uses `overflow: clip`, and initial/restored dialog focus uses
`preventScroll` so the browser cannot scroll a translated right-side panel into
view before its entrance completes. Keep scrolling within the drawer body.
Unsaved-change confirmation uses the existing confirmation dialog above the drawer.
Interface copy supports Kurdish,
Arabic, and English. Keep domain-specific form controls under `features/forms`.
New forms first show `FormLayoutChooser` in the drawer using two native radio
cards in the product's light/dark theme, with Form layout selected by default.
Next is enabled immediately and opens the shared form editor.
Selected layout cards use an explicit theme-colored border and neutral tinted
surface so solid and gradient business themes both retain a visible outline.
Keep one selected-card border; keyboard focus belongs on the radio control via
`focus-visible`, avoiding a second outline around the card after mouse clicks.
Back preserves the draft. Saved forms open directly in edit or preview mode.
The layout choices sit centered horizontally and vertically in the drawer body;
auto margins keep them scrollable on short screens. This step uses only a compact
Next action aligned to the physical right of the footer, with the header close
button for dismissal. Shared modal body layout and footer sizing own these options.
The Form layout editor has two tabs, Content and Final page. Keep its content
sections compact and collapsible, with downward chevrons, one primary section
expanded at a time, small typography, and localized input placeholders without
helper descriptions beneath section headers. Preserve
native scrolling when content exceeds the viewport. Desktop uses a height-contained
drawer body with independently scrolling editor and preview panes. Keep the preview
on the physical right for all interface languages and its preference buttons above
the scrolling form. Mobile stacks a bounded, internally scrolling preview below the
editor and preserves drawer-body scrolling. Preview appearance/language are
independent of dashboard preferences. Form fields use compact 36px controls, 12px
desktop copy, 16px preview headings and tight readable spacing; mobile preview
inputs retain 16px text to avoid focus zoom. Header and footer stay visible.
Banner and Introduction use shared icon-only visibility switches with accessible
names and tooltips; keep visibility separate from accordion expansion. Center the
preview introduction's logo, headline, description and slogan. The banner is 144px
tall. Send (or Next for card steps) stays in the preview's bottom footer outside
the scrolling content; its HTML form association preserves native validation.
Final-page CTA links use the same fixed footer.
The preview preference row uses two equal-width text buttons, Language and Theme,
with shared select menus and no labels above them or preview-response notice.
Card layout opens Welcome page, Questions and Privacy accordions with the same
Content/Final page tabs and preference controls as Form layout. A readable scrim
over the full-height background supports welcome/final text; question panels use
the selected preview appearance, with progress and fixed footer navigation.
`ModalStepActions`
keeps compact Back and Create/Save buttons together on the right, with neutral
slate styling for Back and the theme accent for Create/Save,
without Cancel. The header X still dismisses the drawer. Form layout omits the
separate name field and derives its dashboard name from the headline or a localized
Untitled form fallback; unsafe links show inline errors and block save requests. Consent and Send stay together
in the preview footer. The logo overlaps an enabled banner by half its height.
With both Banner and Introduction off, use a minimal surface, top fade and underline
fields. The preview's scoped palette must remain independent of dashboard theme,
including input backgrounds, placeholders, borders, focus rings and buttons.
The form drawer header reuses `DashboardAppearanceControls` and the existing
business language selector in compact 36px sizing, ordered language, theme, close.
Theme changes use the dashboard's controlled state; language changes use its saved
preference and permissions. Neither action resets the draft or changes its authored
content language. The global business and platform headers share the same controls.

Scrollbar visuals are hidden globally on public pages, both dashboards, dialogs,
drawers, tables, pickers, and nested preview documents. Keep native overflow and
wheel, touch, and keyboard scrolling; do not hide overflow to hide a scrollbar.
The floating custom page scrollbar and themed thumb styles have been removed.

Linktree verification badges use the shared `VerificationBadge`: a rounded
blue seal (`#00A3EE`) with a solid white checkmark and square ends, matching
the supplied visual reference. Keep it a transparent SVG beside the page name,
sized at `0.8em` so it stays within each template's heading height. Group the
name and badge in an inline flex row with centered items and a `0.2em` gap,
keeping even space above and below the badge rather than using baseline alignment.
The editor uses the same icon beside its name input as an icon-only button:
grey when disabled, blue when enabled. Preserve its accessible label,
`aria-pressed` state, keyboard activation and visible focus outline. The badge
toggle and color-reset icons use the shared localized tooltip on hover and focus.

Management grid actions reuse `GridCardActionButton` for responsive height,
rounded tinted surfaces and flexible widths. Business cards use equal-width
actions on one line; Analytics and Edit retain labels that truncate when space
is tight, while the other actions use compact icons with accessible names and
tooltips. Analytics, edit, domains, sessions, dashboard and delete use distinct
sky, amber, cyan, emerald, indigo and red accents. Primary Linktree grid actions
reuse the same button. Long labels truncate within the card instead of expanding it.
Business table actions and mobile table cards use transparent colored hover
backgrounds in dark mode. Grid actions explicitly keep light icon/text contrast
on hover; dark hover states must never fall back to pale light-theme backgrounds.

Language toggle buttons use the shared `LanguageToggle` on root and tenant home
pages, authentication/sign-up pages, dashboard headers and onboarding dialogs.
The active language is shown as EN, AR or KU, with Latin text direction even in
RTL interfaces. All controls share one rounded button, neutral hover states and
localized action tooltip. The size matches neighboring theme controls: authentication uses 40px, public
headers and compact drawers/dialogs use 36px, and dashboard controls share the
header action padding and responsive icon frame through an explicit size prop. No PNG flags are rendered.
Adapters own their existing language cycle, permissions and preference persistence.
Platform sign-in updates only its locale cookie; account preferences are saved only
after authentication. Settings language dropdowns retain readable names. Public
Linktree pages do not receive a visitor language toggle.

Rabar is the product-wide typeface and must be inherited by public pages,
dashboards, dialogs, notifications, form controls, and generated interface
labels. Responsive headings and content cards must allow long Latin and Kurdish
text to wrap without clipping glyphs, truncating meaningful content, or causing
horizontal page overflow. Use comfortable line height and responsive gaps that
account for Rabar's metrics.

---

# One Product, Multiple Permission Domains

The application contains multiple permission domains:

- Business Dashboard
- Platform Administration
- Public Pages

Although their functionality differs, they should share the same visual language.

Business and Platform Administration code remain dependency-isolated (see `docs/architecture.md`), while shared visual patterns belong in neutral reusable components.

Never duplicate UI simply because it belongs to a different permission domain.

## Public business homepages

Public business homepages are customer-facing. Use the shared tenant navbar,
public shell, theme behavior, and footer. The content consists of a concise
hero with mobile template mockups. The homepage does not list published Linktrees
or show gallery links in its navbar or footer. Individual published Linktree URLs
remain accessible directly. Keep contact in the shared navigation action and
footer. Do not show dashboard controls, private data or empty page placeholders
to anonymous visitors.
The AR/KU visitor switch belongs in the shared navbar and must not reuse the
authenticated Dashboard preference. Translate fixed interface labels while
preserving business-authored content exactly as published.

---

# Component Ownership

The Sponsor.krd root marketing website and tenant business websites share the
neutral `PublicMarketingSiteShell`. Surface-specific shells are thin adapters:
they may supply branding, navigation, actions, footer content, and explicit
capabilities, but must not duplicate navbar behavior, theme handling,
backdrops, scrolling, or page chrome. Root marketing presentation lives in
feature files under `features/public-site`; shared pieces remain reusable across
the remaining root marketing routes.

The root homepage is intentionally minimal: the shared Sponsor.krd navbar, one
viewport-height hero, and the shared Sponsor.krd footer. It has no announcement
placements, product preview, supporting sections, or sibling marketing routes.

Marketing previews must demonstrate the real product category without
pretending that mock people, revenue, traffic, endorsements, or pricing are
real. Use clearly illustrative templates and interface states. Keep all copy
and repeatable data in the centralized marketing content module so a future
platform content manager can replace the source without replacing the UI.

Sponsor.krd marketing prose and primary calls to action default to Kurdish;
root visitors may switch presentation text to Arabic or English without changing
direction. Product names and authored content are not translated automatically.
Marketing primary CTAs use the fixed
Sponsor.krd cyan-to-red brand gradient rather than the configurable platform accent. Visible
marketing sentences do not use terminal full stops.

Business landing pages, Sponsor.krd marketing pages, and business advertising
pages share `PublicMarketingHero`, `PublicHeroAccentBackdrop`,
`PublicSection`, `PublicSectionHeading`, and `PublicCallToActionSection`.
Responsive spacing, heading scale, light/dark surfaces, action hierarchy, and
tablet/mobile behavior belong to those primitives. Each surface supplies only
its copy, accent, actions, decorations, section data, and permission-specific
behavior. Advertising editor statistics and public-section visibility controls
also live in standalone feature components rather than inside the editor page.

Shared UI belongs in:

- `frontend/src/components/ui`
- `frontend/src/components/shared`

Business-specific presentation belongs in:

- `frontend/src/components/business`

Public-facing presentation belongs in:

- `frontend/src/components/public`

Visual templates belong in:

- `frontend/src/components/templates`

If multiple areas require the same component, move it into the shared layer instead of copying it.

---

# Reuse Before Creating

Before creating a new:

- layout
- page section
- card
- table
- form
- button
- dialog
- badge
- modal
- navigation element
- filter
- loading state

Search for an existing implementation.

Extend existing components whenever practical.

New UI patterns should only be introduced when no existing pattern solves the problem.

## Shared Components Only

Never define reusable UI inline or as local components inside a page file.

Every modal, dialog, form section, card, button group, and other reusable block
must be its own component file:

- Cross-feature generic UI goes in `components/shared/`.
- Feature-specific components go in `features/<feature>/components/`.

For new features that share functionality with an existing feature, create a
shared component instead of duplicating markup or state logic. When a local
component already exists in a page file, extract it into a component file at the
first opportunity.

Management dialogs must use `components/shared/ManagementModal` so dialog
semantics, focus entry, focus trapping, Escape behavior, and focus restoration
remain consistent. Custom overlay shells are reserved for interactions that
are not management dialogs or cannot satisfy the shared primitive's contract.

## Business and platform UI parity

The business and platform dashboards use one implementation for every shared
component and workflow. A change to shared layout, editors, forms, validation,
cards, tables, grid views, dialogs, buttons, loading skeletons, empty states,
analytics controls, uploads, previews, or public rendering applies to both
surfaces and must be checked in both contexts.

Business and platform route components remain thin adapters. Differences such
as endpoints, ownership scope, public paths, branding, analytics sources, or
available actions are supplied through typed configuration and capability
props. Do not copy a shared component or patch only one adapter to change
shared presentation or behavior.

A platform-only control is permitted when the operation is genuinely reserved
for platform administrators or its permission is unavailable to business
users. Gate that control with an explicit permission or capability and keep
the surrounding layout, state handling, feedback, and reusable UI shared.
Permission differences must not cause the two surfaces to drift.

## Inline field validation

A field reports its own problem under itself, in the field's own colour
language, and never only through a toast on submit.

- **Red** is a blocking error: the save will fail. Reserve it for rules the
  server actually enforces. The linktree editor's name and slug floors come
  from `chk_lt_name` / `chk_lt_seo_name` and the DTO's `@MinLength(2)`, not
  from taste â€” a form that accepts less produces a 400 with nothing pointing at
  the field.
- **Amber** is an advisory warning: the save will succeed, but the reader may
  not want it to. A duplicate page name is the example; it is legal and stays
  out of the submit gate.
- **Grey** is work in progress â€” "Ù¾Ø´Ú©Ù†ÛŒÙ†ÛŒ Ù†Ø§Ùˆ..." while an availability request
  is in flight, so an empty space does not read as "no problem found".

Validators live in `features/link-editor/components/validation.ts`, not inside
the modal, so the rule that has to match a DTO or a CHECK constraint sits in one
testable place. Debounced availability checks need a `cancelled` flag as well as
a cleared timer: clearing the timer only stops a request that has not been sent,
and a slower earlier response would otherwise paint an error for a value the
field no longer holds.

## Modal header controls

A modal's header controls are one visual set: every icon-only button is a 40px
square (`h-10 w-10`) and a labelled one is the same 40px tall, all with `h-4
w-4` icons. Mixing `p-2.5` with `px-3 py-2.5`, or 16px icons with 20px ones,
puts the buttons at different heights on the same row.

Every modal panel carries `role="dialog"`, `aria-modal="true"`,
`aria-labelledby` pointing at its title, `tabIndex={-1}`, and the `dialogRef`
that `useModalKeyboard` needs for focus entry, trapping and restoration.
Dismiss on backdrop fires on `mousedown`, not `click`: a click event fires on
the common ancestor, so a drag that starts inside the panel and ends on the
backdrop would close the dialog. `components/shared/ManagementModal` is the
reference implementation; `BusinessPageAnalyticsModal` and the platform admin's
`BusinessAnalyticsModal` both follow it.

A list inside a modal sorts through a pure exported comparator, not an inline
one. Both analytics modals had the same two defects while the comparator was
inline: no tie-break, so equally scoring rows reshuffled on every refresh, and
in the platform-admin one a pinned-row test that returned `-1` whenever `a` was
pinned without looking at `b` â€” not a valid comparator, and self-contradicting
for a pair of pinned rows. Extracting it makes both testable.

Analytics surfaces use one Sorani vocabulary from
`components/shared/analytics-terminology.ts`: `Ø¨ÛŒÙ†ÛŒÙ†` for views and `Ú©Ù„ÛŒÚ©` for
clicks. Totals and unique-person labels must reuse that contract; do not mix in
alternatives such as `Ú©Ø±ØªÛ•` for the same event.

---

## Modal forms and shared fields

Modal field markup lives in one shared system so every dialog looks identical:

- `features/link-editor/modal-input-styles.ts` exports `modalInputClass`,
  `modalTextareaClass`, and `modalChoiceButtonClass` â€” the single source for
  input, textarea, and select-style button styling. Use these classes instead
  of inline input styling.
- `components/shared/EditorField` is the label wrapper: an `11px` black-weight
  label, an optional `RequiredMark`, an optional right-aligned hint, and the
  control itself. Prefer it over hand-rolled `label` + `span` markup.
- `components/shared/RequiredMark` renders the required `*` in the tenant
  accent (`var(--theme-primary, #64748b)`). Never hard-code the marker color in
  individual fields; always reuse this component.
- `components/shared/AvatarImageUpload` renders the shared 128px circular
  avatar/logo picker (hover overlay, red remove badge, full-width choose-image
  button) used by the linktree editor and the advertising testimonials modal.
  It exports `DEFAULT_AVATAR_SRC`.
- The tenant-accent action button (publish toggles, create/save/export actions,
  wizard next/submit) is written inline at each call site as a plain `button`.
  Only the accent paint is invariant: `[background:var(--theme-css)]`,
  `text-[var(--theme-ink)]`, `hover:brightness-95`, and `disabled:cursor-wait`.
  Geometry and typography follow the button row the action sits in â€” copy the
  height/padding/text-size/weight of the neighbouring cancel, back, or secondary
  button rather than a fixed pill, and lift the font one weight step for the
  primary action. A row sized by padding (`px-4 py-2.5 sm:px-5 sm:py-3`) keeps
  padding; a row on a fixed `h-10`/`h-11` keeps that height. Standalone accent
  buttons with no neighbours use `flex h-10 shrink-0 items-center gap-2
rounded-xl border border-transparent px-3.5 text-xs font-black`. In-flight
  actions set `aria-busy` and include the busy flag in `disabled` so the wait
  cursor applies. Segmented controls, toggle switches, and circular icon buttons
  keep their own patterns.
- `features/link-editor/BackgroundColorPicker` is the background-color field
  used by the linktree editor. It renders the preset swatch grid plus an
  optional "custom" toggle that opens `ColorGradientModal`. Pass
  `colors={RAINBOW_BACKGROUND_COLORS}` for the simple base-rainbow preset grid
  and `allowGradient={false}` to restrict the custom modal to solid colors
  (both used by the advertising package-category modal). It exports
  `RAINBOW_BACKGROUND_COLORS` for reuse.

Both the linktree editor (`BasicInfoStep`) and the
advertising testimonials modal (`AdvertisingServicePage.tsx`) consume this same
field system so their titles, sizes, placeholder styles, and required markers
stay in sync.

## Required workflow before building a feature

This sequence is mandatory, not advisory:

1. **Search `components/shared/` first.** If a component covers the behavior,
   use it. Do not re-implement it locally with different markup.
2. **If no shared component exists but the pattern is already inline
   somewhere**, extract that inline implementation into a customizable shared
   component, then consume it from both the original site and the new one.
   Extract on the second copy â€” do not wait for a third.
3. **Delete what the extraction orphans** in the same change: unused imports,
   now-dead local helpers, `export` keywords with no external importer, and
   alias indirections such as `const THEME = SHARED_THEME`.
4. **Update this document** when a new shared component is introduced or an
   existing rule changes, so the next feature starts from an accurate list.

Duplicated markup in this repository has repeatedly drifted rather than staying
in sync â€” copied theme maps lost keys, and copied carousel maths only held for
one specific item count. Sharing the implementation is what prevents that; a
convention that both copies "should" match does not.

When two surfaces must look identical, export the single implementation from
the component that owns it and have the other import it, rather than mirroring
its markup. Where behavior genuinely differs (for example a public carousel
auto-advances but its dashboard editor must not), share the theme maps and
layout maths and keep only the differing wrapper separate.

## Destructive actions

Every destructive action must confirm through
`components/shared/ConfirmDeleteModal` before it mutates state. Deleting on the
first click is not acceptable, including for items that only exist in local
editor state.

A surface with several delete affordances should hold one pending-delete slot
in state and render a single `ConfirmDeleteModal`, rather than one modal per
row. See `features/advertising/components/AdvertisingServicePage.tsx`.

## Numeric fields

Use `components/shared/NumberInput` instead of a bare `<input type="number">`
so parsing, clamping, and empty-field handling stay consistent. Pass
`clearOnFocus` for value-entry fields such as prices, so typing replaces the
current number instead of appending digits to it.

---

# Page Structure

Whenever possible, pages should follow a predictable structure:

```text
Page Header

Title

Description

Primary Actions

--------------------

Search / Filters / Tabs

--------------------

Main Content

--------------------

Pagination or Footer
```

Users should not need to relearn navigation between pages.

---

# Dashboards

Business Dashboard and Platform Administration should reuse the same interaction patterns whenever functionality is similar.

Examples include:

- statistics cards
- management tables
- search
- filtering
- pagination
- action menus
- confirmation dialogs
- loading states
- empty states

Consistency is more important than visual variety.

Dashboard and analytics metrics must use the shared `StatCard`. Choose its
variant according to meaning: `standard` for summary KPIs, `funnel` for a
funnel step, `live` for realtime status, `comparison` for paired values, and
`story` for an emphasized narrative metric. Customize the shared component to
preserve a section's intended presentation instead of recreating the card
inline.

A row of stat cards must be laid out with `StatCardGrid`, never a hand-written
`grid` class. It is **two columns on every width below `lg`** â€” phone and
tablet alike â€” and widens at `lg` to the `columns` the row was designed for.
Two rather than one on a phone because a stat card is short and wide, so one
per row wastes the screen and pushes the content below it off the fold; two
rather than three on a tablet because three cramps the value text at that
width. Pass margins through `className`; do not reintroduce breakpoint
classes. `StatCardGrid.spec.tsx` fails if a page grids stat cards itself.

The one exception is a `comparison` pair sharing a `divide-*` rule: it is
already two columns at every width, and the rule between the two cards only
reads correctly with no gap.

---

# Forms

Authentication and invite-only onboarding use the shared
`components/shared/AuthenticationShell` and `AuthenticationCard`. The shell
owns theme controls, responsive split layout, text selection, and the
decorative authentication background. Root authentication keeps normal page
scrolling; business login supplies the tenant name, logo, color, and a
scrollable page whose scrollbar stays hidden when its content overflows.
Signup applications use one complete
form in the same authentication section; do not place this form in a modal or
split it into wizard steps. Google entry uses shared
`GoogleAuthenticationButton`. Signup fields compose `EditorField`, shared input
styles rather than page-local chrome.
Signup uses the card's plain compact variant and does not add another visual
container around the form. Country, city, and social-profile URL fields are
excluded. Logo, favicon, default avatar, brand color, and footer defaults move
to the required first-login setup instead of the signup application. Mark those
setup fields optional and start with the Sponsor.krd color, the neutral person
avatar, and the neutral logo and favicon placeholders. First-login setup asks
for the logo only: pass `lockedAssets` to `BrandAssetStack` there, which closes
the favicon and avatar tiles behind a lock badge because both are supplied
automatically â€” the favicon from the uploaded logo, the avatar from the platform
default. Opening a tile's lock restores its own picker for the rest of that
session, so a business that wants a distinct favicon or avatar is never blocked.
A favicon the owner uploaded is never overwritten by a later logo upload. Logo
and favicon pickers both accept JPEG and PNG (favicon also `.ico`); the tile
markup itself lives in `BrandAssetTile` so a locked tile does not nest a button
inside a label. Sponsor.krd's own assets are platform chrome: use the transparent,
theme-aware `/images/brand/rise.svg` for both visible platform logos and
administrator avatars, and `/images/brand/rise-favicon-white.png` for browser-tab
icons. Platform avatar and favicon are derived from the logo with no independent pickers.
They must never
stand in for a business that has not uploaded its own asset. Resolve every
fallback from `frontend/src/lib/brand/brand-assets.ts` rather than repeating a
path. Show the
verified owner account name and email read-only in both first-login setup and
platform business editing. Render setup as a single locked `ManagementModal`
over the real dashboard: no close control,
no backdrop/Escape dismissal, and mark the dashboard surface inert until the
server records completion. Approved
business login, platform login, and invitation signup all reuse
`AuthenticationMethods`, which composes the shared Google button,
`EmailCodeAuthenticationForm`, and the optional single-line private-device
choice. Selected `SegmentedTabs` use accent background and text without an
accent border; focused dialogs must also keep a neutral outline.
Signup validation errors appear inline through `EditorField`; do not collapse
field-specific failures into only a generic `Validation failed` alert.

Forms should always include:

- labels
- validation
- helper text where useful
- disabled states
- loading states
- success feedback
- error feedback

Platform business management keeps active businesses, pending signup
applications, and invitation creation in one shared management surface. Use
the shared `SegmentedTabs` for the Businesses and Applications views, with each
view implemented as its own feature component. Do not introduce a second
standalone invitation/application card above or below it. Invitation creation
belongs last in the shared header actions, and pending counts belong on the
Applications tab.

Group related fields together.

Avoid unnecessarily long forms.

---

# Tables

Management tables should remain consistent throughout the application.

Support features when appropriate:

- search
- filtering
- sorting
- pagination
- row actions
- bulk actions
- loading states
- empty states

---

# Status Pills

List rows and cards mark record state with pills, never with coloured row
backgrounds or bare text.

Pills for Linktree pages live in `components/business/LinktreeMeta.tsx`
(`LinktreeMetaBadges`) and cover:

- **Ø¨Ù†Û•Ú•Û•Øª** â€” the business default page. Uses the theme primary colour so it
  matches the default-page card in Business Settings.
- **Age tier** â€” derived from the creation date by `lib/utils/record-age.ts`:
  `Ù†ÙˆÛŽ` under 7 days, `Ù„Û• Ú¯Û•Ø´Û•Ø¯Ø§` under 30 days, `Ú©Û†Ù†` beyond that. The
  thresholds live in `RECORD_AGE_TIER_DAYS`; change them there, not in a
  component. The helper is domain-neutral â€” the platform admin ages businesses
  with the same tiers.
- **Ù†Ø§Ú†Ø§Ù„Ø§Ú©** â€” shown only when `status` is inactive. An active page is the
  norm and carries no pill.
- **ÙˆØ§ØªØ³Ø§Ù¾** â€” shown only while `whatsapp_modal_enabled` is true.
- **Template name** â€” resolved through `getTemplateName` in
  `lib/templates/config.ts`.

Every pill is field-gated, so a pill whose field is absent renders nothing.
Fields that cannot be gated (the age tier
reads `created_at`, which every consumer fills) sit behind the
`showLinktreeMeta` prop, which only the Linktree dashboard sets.

The business default page is always sorted first
(`sortLinktreesForDashboard`), and optimistic list updates demote the previous
default so exactly one Ø¨Ù†Û•Ú•Û•Øª pill is visible at any time.

## Platform-admin business pills

The business directory uses the same pill pattern with its own set, in
`features/platform-admin/components/BusinessMetaBadges.tsx`:

- **Ú†Ø§Ù„Ø§Ú© / Ú•Ø§Ú¯ÛŒØ±Ø§Ùˆ** â€” the business `status`. Both states are shown here,
  unlike the Linktree list: a suspended tenant is what an admin scans for, and
  the contrast only reads if the active state is labelled too.
- **Plan** â€” `getBusinessPlanLabel` / `getBusinessPlanBadgeClasses`.
- **Page allowance** â€” `max_linktrees`, with `âˆž` for the `-1` unlimited
  sentinel.
- **Age tier** â€” the shared `record-age` tiers, so a business registered this
  week is visible without reading a date.
- **Ø¨ÛŽ Ø³Û•Ø¨ Ø¯Û†Ù…Û•ÛŒÙ†** â€” a business with no subdomain cannot be reached at its own
  address, so it is flagged rather than left to an empty cell.

The grid card, table row and mobile card all render this one component; the
status and plan markup used to be written out three times.

---

# Feedback

Every user action should provide feedback.

Examples:

- success notifications
- validation errors
- confirmation dialogs
- loading indicators

Avoid silent operations.

---

# Loading States

Never leave users wondering if work is still happening.

All animated loading feedback uses the shared Motion primitives. Use
`MotionSpinner` for compact operations, `MotionPulse` through the shared
skeleton compositions for predictable content, and `MotionPing` for a live
status marker. Do not introduce CSS keyframes, Tailwind `animate-*` utilities,
or component-local spinner and pulse implementations. The application-level
motion provider supplies consistent timing and reduced-motion behavior.

Use consistent:

- skeletons
- spinners
- progress indicators

Avoid layout shifts while loading.

Use a skeleton when content with a predictable final shape is waiting for data
or for a lazy frontend bundle. The placeholder must mirror the real card,
table, form, modal, or management-page footprint and use the shared
`components/shared/Skeleton.tsx` compositions. Do not replace already visible
content with a skeleton during a background refresh.

Skeleton parity is a UI contract: reserve the same header actions, statistic
count and variants, tabs, responsive table columns or cards, form fields,
modal frame, and list density that will replace it. Do not render speculative
sections, generic cards, or fewer controls than the resolved state. When a
resolved layout changes, update its shared skeleton and parity test in the same
change. Full-page, embedded-panel, and modal fallbacks may need separate shell
compositions even when they share the same data body.

Use a compact spinner or progress treatment only for an explicit operation
whose result is not replacement content, including save, upload, destructive
confirmation, refresh, link resolution, and location lookup. Keep the affected
content visible, disable duplicate submission, and label the busy control.
Global dashboard refresh controls must update shared and active-page data in
place, deduplicate overlapping requests, expose an accessible busy state, and
provide success or failure feedback. They must preserve navigation and local UI
state and must never overwrite unsaved form or editor input.

Data-heavy dashboard routes must reserve the complete visible page structure,
not only their metric cards. Compose `SkeletonDashboardShell` with the exact
page skeleton from `SkeletonPageLayouts`, and use the corresponding modal or
communication composition for lazy-route and initial-request loading. Nested
sessions, activity, messages, chats, search results, and notification inboxes
use their dedicated row skeleton locally without replacing already loaded
surrounding settings. Template catalogs use `SkeletonTemplatePage`; deferred
phone and monitor previews use the base shared `Skeleton` rather than
standalone pulse markup.
An intentionally empty preview is a stable product state and must not animate
like loading or announce itself as pending.

Authentication route transitions use `SkeletonAuthenticationPage`, which
reserves the shared split-screen shell and sign-in card instead of flashing the
public-home skeleton. Short indeterminate operations such as invitation-link
validation and authentication handoff exchange use the shared `LoadingState`.
It supplies one accessible announcement, consistent dark-mode contrast, and
reduced-motion-safe animation. Do not use it for predictable replacement
content; use the matching skeleton composition in that case.

Every public route owns a route-level skeleton. Marketing pages preserve the
shared navbar plus their actual cards, pricing, article, form, or template body.
The root loading boundary detects platform versus business hosts so tenant
requests receive the business landing composition. Public Linktree,
invitation, and results routes reserve their own renderer or
branded client-access shell.

## Dashboard notification bell

Business and platform headers use the same `NotificationBell` presentation and
`useNotificationInbox` behavior. Bell geometry, unread badge, dropdown header,
item density, unread treatment, action icons, skeleton, empty state, keyboard
behavior, and detail modal must change together on both surfaces. Clicking an
inbox item marks it read and opens the shared detail modal; navigation or reply
actions are offered from that modal rather than replacing the detail view.

Endpoint paths, action-route normalization, theme color, and platform pending
approvals are adapter configuration. Pending approvals remain platform-only
because approval review requires platform permissions, but they are rendered
as an extension of the shared dropdown instead of forking it. Notification
action URLs accept root-relative paths or HTTPS only; protocol-relative and
unsafe schemes must never be opened.

Stat-card loading must use `SkeletonStatCard` or `SkeletonStatCards` with the
same variant and layout as the resulting cards. The base `Skeleton` primitive
and the shared table, grid-card, form, modal, and management-page compositions
should be extended when their corresponding real component changes. Introduce
new compositions only alongside a real loading state rather than guessing
future layouts.

---

# Empty States

Every empty state should explain:

- why there is no content
- what the user can do next

Include a call to action whenever appropriate.

---

# Inline Request Errors

Recoverable 400, 409, 413, 415, and 422 responses stay within the component
where the action occurred. Use the shared `InlineRequestError` alert rather
than a toast, browser alert, or full-page error. Preserve the user's entered
data, place the alert next to the affected controls, use `role="alert"`, and do
not display raw server, parser, storage, or database messages.

---

# Responsive Design

Every interface must function correctly on:

- mobile
- tablet
- laptop
- desktop

Layouts should adapt gracefully without losing functionality.

---

# Accessibility

All interfaces should support:

- keyboard navigation
- visible focus states
- semantic HTML
- sufficient color contrast
- accessible labels

Accessibility should be considered during implementation, not added afterwards.

---

# Visual Templates

Current supported visual options:

### Linktrees

The Linktree editor is a shared domain feature. Business and platform-admin
screens must use the same wizard, validation, templates, link mapping, upload
states, and availability checks, while providing their own API endpoint set.
The platform-admin list also reuses `LinktreesGrid` and `LinktreesTable`; its
public path prefix is `/linktree` on the root domain. Its `Ø¦Ø§Ù…Ø§Ø±` action opens
the shared business page analytics modal in summary-only mode, loading current
lifetime totals through the platform-scoped API; action details remain hidden,
while the standard loading skeleton, refresh, and
clear-analytics confirmation stay consistent with business pages.
The list-level clear-all action uses the same shared rose analytics button and
confirmation modal as the business Linktree list; it is disabled when no
platform Linktree analytics exist.

- 6 selectable Linktree templates
- Registered through the template registry
- Availability depends on the business subscription

Every Linktree template presents the owner-editable button title as its primary
label and the catalog-owned English platform name as a smaller secondary label.
The secondary label is static UI metadata and must not use the editable link
description.

Branch Signal (`branch-signal`) is the Ultra-only premium network template.
Its platform link buttons use translucent glass gradients with backdrop blur
and saturation, adapting the tint and text contrast to light or dark backgrounds. It
must support every shared Linktree background color, gradient, uploaded image,
and pattern, with readable text derived from the selected surface. Soft
paths connect alternating cards directly and follow the saved subtitle color,
falling back to the tenant website color. Platform colors
stay inside icon tiles, while the subtitle-derived accent owns the network, card edge,
arrow, glow, and footer. It must not add share, theme, navigation, badge, or
header controls that are not part of the Linktree data contract.

---

# UI Review Checklist

Before completing any UI work, verify:

- Existing components were reused where possible.
- Shared UI was not duplicated.
- Page structure matches similar pages.
- Business and Platform Administration remain visually consistent.
- Loading, empty, and error states exist where needed.
- The interface is responsive.
- Accessibility has been considered.
- No unnecessary UI patterns were introduced.

Every new screen should look like it naturally belongs within the existing Sponsor.krd product.

## Platform Administration Theme

Platform-administration surfaces use the shared Sponsor.krd theme contract from
`frontend/src/lib/sponsor-krd-theme.ts`. The persisted accent value is expanded
once into the `--sponsor-krd-brand-*` and `--sponsor-krd-accent-*` variables;
pages, portals, dialogs, and loading boundaries must not maintain independent
copies of those colors.

Legacy platform records containing only the original `#25F4EE` first stop are
normalized at the backend branding boundary to the canonical gradient value.
This prevents old data from silently turning an otherwise shared platform
theme back into a flat cyan fill.

- Use `sa-gradient` with `sa-gradient-hover` for primary platform actions,
  selected controls, and progress emphasis.
- Use `theme-fill` for shared tenant/platform controls that read `--theme-css`.
  It guarantees one centered, non-repeating fill across the complete control,
  including rounded and circular edges.
- Use `theme-soft` for subdued selected states in shared controls. It overlays
  one uniform tint on the same complete theme fill, so gradients remain
  continuous and tenant solids remain tenant-owned.
- Use `theme-soft-hover` when the same full-gradient border treatment is only
  needed on hover; do not rebuild that layered background in a component.
- Every dashboard color field opens the single shared
  `components/shared/ColorGradientModal`. Feature folders may expose a
  compatibility re-export, but must not implement another color dialog. The
  shared modal uses `theme-fill`, `theme-soft`, and `theme-input-focus`, so a
  platform gradient and a tenant-owned solid or gradient follow identical UI
  behavior.
- Use `sa-soft`, `sa-soft-border`, and `sa-focus` for supporting emphasis and
  focus treatment. A gradient is not a substitute for hierarchy.
- Preserve semantic success, warning, and destructive colors. These communicate
  meaning and must not be recolored to match the platform identity.
- Compact action controls in management grids and tables keep their established
  distinct action colors (for example analytics, edit, duplicate, sessions,
  and delete) for fast scanning. They are an explicit exception to platform
  gradient fills; page-level primary actions and selected navigation still use
  the platform gradient.
- Platform loading boundaries opt into `data-platform-admin-theme`; the shared
  `Skeleton` primitive then supplies the branded loading treatment. Do not
  create page-specific shimmer colors or animations.
- Platform dialogs use the shared `ManagementModal` Sponsor.krd mode. Tenant
  editors pass an explicit accent and continue to use the tenant theme.
- All surfaces use native browser cursors. Drag controls use grab before pressing
  and grabbing while held; the shared reorder handle keeps grabbing active until
  drop, cancellation, or unmount. Custom cursor painting and preloading are disabled.

Interaction outlines and focus rings are disabled globally at the owner's request,
including keyboard, mouse, touch, focus-within wrappers and form drag targets.
Keep normal control borders, selected states and validation styling separate from
these interaction effects. Drag cursors and keyboard actions remain functional.

Form and card previews share FormPreviewSurface, FormPreviewHeader and
FormPreviewButton. Their avatar, introduction and completion typography,
color variables and field styles must remain shared. FormIntroductionEditor owns
common branding controls. Card-specific grouping/navigation stays in FormCardPreview.
Card pages keep their full-screen blurred background with a white/light or black/dark
scrim, while form pages use an inline banner. Shared header configuration suppresses
the inline banner for card pages without duplicating fields or buttons.

CustomSelect list and grid menus share keyboard focus entry/trapping/restoration
and modal-stack dismissal; arrows navigate enabled choices. Search is opt-in.


Form choice authoring uses shared image-first answer cards with numbered labels,
a visible option count, per-row removal and one full-width Add option action.
Conditional CSV answers reuse the shared CustomSelect without a search field, including
preview appearance inheritance and viewport-bounded menus. Shared CustomSelect triggers
retain neutral borders while open, hovered or focused; option hover and selected fills
remain unchanged. Conditional display is
configured per question without a global Logic settings switch.


FormPreviewNavigation shares compact previous/next icon buttons above both preview
frames, with disabled boundaries and localized labels. No page counter is displayed.
These authoring controls browse pages without submitting or clearing answers; the
in-preview Start/Back/Next/Send controls retain their usual validation.


CustomSelect popup shells and search fields retain neutral light/dark borders,
without focus outlines or rings. Preview menus inherit --preview-border rather
than the focused trigger's computed accent border. Selected/hovered options retain
their existing fills, and the menu retains its normal elevation shadow.

## Persisted forms

Form and Card public flows reuse the editor preview fields, buttons, calling-code selector and privacy/footer components. Public navigation follows validation; successful submissions alone reveal the final page. Shared business/platform management shows explicit loading/error states and locks pending saves. See [Forms](forms.md).
