# UI Guidelines

## Purpose

This document defines the UI standards for Sponsor.krd.

The goal is to ensure every page, component, and interaction feels like part of the same product while keeping business and platform administration implementations properly separated.

General development principles are defined in `AGENTS.md`. This document focuses on the visual system and UI architecture.

---

# Design Principles

Linktree grid Open and Delete actions use GridCardActionButton, matching the
Analytics, Edit and Share controls and shared table actions. Keep their neutral
and destructive tones while reusing responsive sizing, borderless surfaces and
rounded corners; do not reintroduce inline action button styles.

CountrySelector uses the searchable CustomSelect list presentation directly,
starting with search and omitting the title/close row. It shares dropdown radius,
option spacing, hover and tenant selection colors. Search uses the shared soft
control surface with a pill radius and leading icon. The search wrapper is
transparent and only the option list scrolls, keeping moving options entirely
below the search field. Escape, outside clicks and selection dismiss it;
keyboard search and focus restoration remain available.

Color, pattern, template and date/time pickers share the borderless 20px popup
surface. Shared picker controls use 16px corners and visual choices use 18px
corners, neutral hover and tenant selection accents. Color tab groups have no
extra background layer; pattern/template previews and selection indicators avoid
nested surfaces. Compact calendar/time actions keep 12px corners and spaced
options. Popup headers and action footers stay outside their scrolling content;
time-column labels remain above their independently scrolling choices.

Dashboard header and sidebar branding rows share the responsive `headerRow`
geometry from `dashboard-chrome.module.css`, including their bottom divider.
Business, Platform, collapsed navigation and loading frames use the same height
and divider colors. Short viewport adjustments must not shrink the branding row
independently of the global header.

Pages and Forms use PageManagementSection in both dashboards. Its compact
heading, full-width toolbar strip and collection body share one rounded surface.
Search has room to show the current query; archive filters, view controls and
actions form clear groups that wrap naturally on small screens. Tenant/platform
accents remain on selected filters and Create. ThemeProvider emits its palette
as inline variables on a display-contents scope from the server render, so
loading controls keep the same business color before hydration. The root effect
continues to supply portals; skeleton data placeholders remain neutral. All existing permissions and
actions remain available. Existing grid card renderers are unchanged; tables keep
their responsive card fallback. Both views use 15 items per collection page.
Pending sections reuse the same shell and PageManagementToolbarSkeleton geometry.
Management grids, tables and their loading frames share management-collection
rounded surfaces. Tables use a soft neutral header, quiet row dividers and bounded
horizontal scrolling. Both views use the same borderless soft pagination controls
as the toolbar; card contents and action colors are preserved. Card and row hover
transitions respect reduced motion and do not promote every item to a GPU layer.
Refresh appears only in the global dashboard header for these sections. Its
shared coordinator updates the current screen's registered data without
resetting filters, pagination or drafts. The section toolbar and its loading
placeholder contain no duplicate refresh button.
Pages expose per-record checkboxes in both views to users with analytics-clear
permission. Bulk controls appear only after selecting a page. Select all includes
all records in the current search/archive collection, across its pagination;
changing the search or archive filter resets selection. Deletion confirms the
selected count, clears only their analytics, preserves pages/links, and reloads
real totals even after partial failure. Failed attempts retain selection for retry.
The main toolbar orders Search, Active/Archive, text-only Grid/Table tabs, then
Create. Contextual selection actions use a second compact row that transitions
its intrinsic height in both directions through shared CollapsibleRegion.
Collapsed controls are inert and hidden from assistive technology; reduced-motion
preferences disable the transition. Loading view tabs reserve text-sized space.

Filled primary action buttons (theme-fill, sa-gradient and sa-bg) use white text
and icons, matching selected sidebar navigation. This is a foreground-only rule:
retain original backgrounds, gradients, borders, spacing and hover treatments.
Neutral controls retain their original readable foregrounds on pale surfaces.

Form and Linktree edit drawers share EditorPageActions and the same action-icon
tones as analytics sharing. Pause uses amber, Archive violet, Duplicate blue,
and Resume/Restore green icons. Sharing's primary actions retain the tenant color. Neutral button surfaces and
readable labels remain consistent in light and dark mode. Semantic icon colors
are defined once in shared action-icon-tones.

AuthenticationShell uses one AuthenticationHeader across sign-in, sign-up,
invitations, code entry, loading and related error screens. Back, language, theme
and refresh controls share DashboardHeaderActionButton's soft neutral surface and
HEADER_ACTION_SIZE_CLASS (40px). Existing locale adapters retain their own
preferences; screens without one receive a working cookie-based language control.
Platform loading screens explicitly select the platform preference. Theme and
language remain available in light/dark and pending states. All authentication
screens share the original full-size split composition: overlay controls and a
colored right column reaching the top, bottom and right edges, without outer
margins, with 32px top-left and bottom-left corners and a flush right edge.
The dynamic viewport is a minimum height, so
short screens scroll naturally and tall forms can grow. No negative panel margins
or independent viewport-height minimums are used. Authentication layout, cards, forms, preview copy and consent text always use LTR
direction in Kurdish, Arabic and English; changing language only changes copy.
Form response tables and loading states share rounded frames with bounded internal
horizontal scrolling, readable detail-column width and isolated mixed-direction answers.
Response and source-performance tables reuse form-report-styles for frames and rows.
Their shared surface overrides legacy global row backgrounds, with a subtle neutral
header and hover tint in both themes. Shared reports show the owner business logo
beside the truncated business name. The report name uses the existing overview or date-range row, adding no extra header row. DashboardHeaderFrame provides one full-width,
sticky navbar surface and responsive height for Business, Platform and shared
reports; report controls remain LTR and on one row.
Language changes keep analytics/report chrome and column order LTR, matching the
Business/Platform drawers. Authored text uses automatic direction where needed;
changing copy does not reverse control groups. Shared icon actions use inline flex
centering so SVG baselines cannot shift mobile response toggles.

The remembered-device checkbox and its skeleton are removed from authentication.
Google links and email verification bodies contain no persistence preference;
the backend applies the remembered preset for normal sign-in.

Authentication preview logos use one rounded image without an additional color
plate, padded frame, border, ring or shadow. AuthenticationShell shares this
treatment across Business/Platform sign-in, invitations, onboarding and analytics
share access/error pages. Transparent and opaque uploaded logos keep their own
appearance in light and dark modes; no second background is added behind them.

Form and Linktree carousel banners share PublicImageGallery. Multiple-image
banners advance every 3 seconds, pause during hover/focus/touch or full-image
viewing, and stop while the document is hidden. Horizontal touch swipes move
one image and wrap around; vertical scrolling and pinch zoom remain native.
Swipes suppress the following image-open click. Automatic changes do not report
engagement; manual arrows/swipes use the existing media action callback.
EditorBannerControls keeps carousel thumbnails unobstructed, with replace/crop/
remove actions below each image and no visible drag grip. Holding the image for
250 ms starts mouse/touch ordering; ordinary clicks open its preview. The shared
useReorderGesture powers both thumbnail holds and visible row ReorderHandles with keyboard
ordering. Thumbnail drag feedback applies only to the image: the drop target
gets a stronger tenant-color rim and soft tint, with no outline around the action
buttons beneath it. Row editors retain their existing drag feedback. Stable
thumbnail keys preserve focus and duplicate image URLs. Empty
upload slots are not drop targets, and uploads disable reordering. The ordered
image array updates previews and persists through existing Form/Linktree saves.

WhatsApp question dialogs use WhatsAppQuestionPanel in the published page and
the editor's phone viewport: a compact heading, soft question rows, and no
decorative numbering or gradient borders. They follow the page's light/dark
appearance and tenant accent. Opening the editor's WhatsApp questions section
shows the live draft dialog; preview choices never navigate or report analytics.
The drawer uses shared fields, compact errors and LinktreeQuestionCard for
question/message pairs. Published dialogs trap focus, close with Escape and
restore the prior scroll lock; Enter alone never chooses a question.
Recognized built-in WhatsApp headings and subtitles are localized when saved
config loads and when the drawer language changes. Custom or explicitly edited
content stays authored; capitalization/outer whitespace in old built-in text does
not prevent localization.
WhatsApp question cards use the shared ReorderHandle for mouse/touch dragging
and Arrow Up/Down keyboard moves. Stable question IDs preserve messages and
validation; the ordered array drives the live preview and existing saved config.
Each question has an optional Video link field inside the Message group, above
the message textarea, with a localized placeholder and accessible name in place
of a visible label. SHARED_INSET_CONTROL_CLASS gives this nested field a subtly
stronger neutral background in either appearance. The shared soft surface groups the outgoing text and URL;
each input retains its own accessible name and validation.
Valid HTTP(S) links are appended on a separate line in the click-to-chat message.
The application does not download or embed third-party videos. WhatsApp controls
link previews; a website link is not a native video attachment. Public and editor
previews use the same message composer. Video labels/errors support EN/CKB/AR.

Shared color, design/pattern, language/theme, drawer-close and footer action buttons use
SHARED_SOFT_BUTTON_CLASS: borderless fills with neutral hover/open feedback.
ColorPickerMark shows solid/gradient values inside a neutral button; primary
footer actions retain the tenant theme fill and readable ink.
Authoring placeholders repeat a concise localized field name, such as Headline,
Description, Phone number, Link or Unit price. Avoid example values, URLs,
phone numbers and instructions inside placeholders. FormEditorInput derives
its placeholder from the label; platform fields use one localized field-name
resolver. Public tenant-authored question placeholders remain authored content.
Shared text inputs, textareas, choice controls and dropdown triggers use
SHARED_CONTROL_CLASS from shared-control-styles.ts. Appearance tokens in
globals.css own their soft surfaces, text and muted colors; shared-control.module.css
owns borderless styling. Focus preserves the same surface. Errors retain accessible descriptions and a subtle error fill. Link destination
errors sit inside the input: empty fields use the error placeholder, while
nonempty invalid fields keep their value with a compact caption. Button text
never inherits destination errors. Shared controls have a 14 px radius and subtle
surfaces (#f3f5f7 in light mode and #20262e in dark mode), with slightly stronger
neutral hover feedback. Linktree platform choices and authoring actions reuse
these controls; sections and nested cards use 16 px corners and faint neutral
boundaries. Selected choices retain their accent tint and primary actions retain
the tenant color.
Shared dropdown triggers use the same soft, borderless surface as popup search;
menus retain subtle neutral boundaries. Search fields blend into their parent
surface and retain identical styling when focused or unfocused.
Page design and Background pattern use PickerPopup and PickerOptionCard:
three-column visual galleries with miniature page/pattern previews, captions
below the image, subtle selection checks and visible disabled locks. They share
the picker palette/header and bounded placement; cards never scale or stagger
on opening. Template access rules and stored identifiers remain unchanged.
Icon, country and color pickers share PickerPopupHeader and one popup surface
palette: white/#f3f5f7 in light mode and #161b22/#20262e in dark mode.
Their portal appearance comes from the nearest drawer/public-page appearance,
with neutral controls, soft selected states and the same 180 ms reduced-motion
aware transition. Color swatches and channel tracks preserve the actual colors.
List options have a 4 px gap so neighboring hover/selected surfaces stay separate.
Shared CustomSelect list menus use neutral hover backgrounds and a subtle tenant
accent tint for selected options, with an accent checkmark in light and dark mode;
selected text retains the readable neutral palette. Icon-card menus keep the dashboard accent. The portaled menu carries the
trigger's theme variables and local light/dark appearance across the portal, so
drawer dropdown menus remain readable when their theme differs from the page.
Selected list rows use the menu's light/dark text palette (or explicit inherited
appearance), rather than the root theme text token, to preserve text/check contrast.
Custom and Personal question Add menus and both
dashboard surfaces use the same tenant/platform accent. Hover does not select
an item or add a colored outline. List rows use compact heights and reduced-motion
aware opening transitions.

Enabled buttons, links, expandable section headers, switches and upload controls
share a white hand cursor with a tenant-colored outline, matching the normal
arrow. Validated SVG data URLs and static public/cursors fallbacks are supplied
through createCursorVariables by server host branding and live Business/Platform
theme providers. Public pages, authentication and dashboards use the owner color.
Text inputs, disabled/busy controls, crop resize handles and reorder controls
retain their native interaction cursors. Root CursorGlow adds one decorative,
soft radial halo with a short, frame-rate-independent trailing movement. It never
replaces or delays the actual cursor, intercepts clicks, or stores pointer data.
It stops rendering frames when settled and hides during dragging, editing,
window exit and reduced-motion/touch interaction. Its listeners and frames are
cleaned up on unmount. Keep this shared implementation across all surfaces.
During drag only, the shared ReorderHandle
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
full viewport height, and no modal zoom. All drawers use the same transform-only
320 ms eased entry and shorter 220 ms exit from `drawer-motion`; their backdrop
fades over 200 ms with a small static blur. Reduced-motion users receive an
immediate transition. It fills mobile screens and leaves part of the dashboard
visible on desktop. Its header/footer remain visible.
Form editing keeps one mounted drawer from its loading skeleton through the
loaded editor, so fetching the definition does not restart its entrance. Form
editor, Linktree, analytics and sharing drawers retain their surfaces until exit
animation finishes through shared DrawerPresence boundaries.
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

Loading skeletons belong to the route whose content they represent. There is no
global homepage loading fallback, and routes without a matching skeleton wait for
their actual content without fabricated placeholders. Existing Public Linktree,
Form, invitation, and results boundaries reserve their own renderer or branded
client-access shell. Short indeterminate operations reuse LoadingState.

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
- All surfaces share the branded normal arrow and pointer hand; specialized interaction cursors stay native.
  Drag controls use grab before pressing
  and grabbing while held; the shared reorder handle keeps grabbing active until
  drop, cancellation, or unmount. CursorGlow is decorative only; the native cursor image remains immediate.

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

## Sidebar active states and collapsed plans

The shared Business/Platform DashboardSidebar marks active navigation with
aria-current="page". Broad dark list-hover overrides exclude that active state;
its accent background and readable theme ink remain unchanged on hover.
Collapsed desktop plan controls remove their label flex boxes with md:hidden,
so the remaining crown icon is centered. Mobile and expanded sidebar labels
remain visible; upgrade and support behavior is unchanged.
## Shared time choices

DateInput, DateTimeInput and TimeInput use the neutral shared control surface and PickerPopup for local
light/dark appearance and viewport-aware placement. TimeColumn keeps choices in
stable order with separate hover surfaces, a subtle tenant accent for selection,
and arrow/Home/End keyboard navigation. Legacy dark list overrides exclude shared
controls so their neutral hover and selected colors remain consistent. Date/time
popups are compact (280px date, 248px time, 440px combined, bounded by the viewport).
The entire field opens the popup, aligned to its start edge, while retaining
manual input focus. These editable anchored popups do not trap focus away from
the field. Calendar cells and time choices use 28px rows, neutral hover surfaces,
and soft selected fills in both appearances. Internal calendar controls, time
choices and picker actions use a soft 9px corner radius instead of pill shapes;
the shared control radius token keeps this scoped to date/time popups. Month/year
and navigation controls have 4px gaps so adjacent surfaces remain distinct.

## Shared page actions

Forms and Linktrees use `features/shared/i18n/page-action-copy.ts` for common action and lifecycle names in English, Kurdish, and Arabic. Both dashboard adapters, list controls, editor footers, duplicate titles, submit/progress labels, and status labels resolve through this catalog. Use the same short Create, Save, Edit, Delete, Open, Pause, Activate, Archive, Restore and Duplicate labels; keep feature-specific content field names where the underlying meaning differs.

Shared report header contents align with the centered report width. Its solid background matches the report body in both themes; only the divider separates them.

Form and Linktree collection cards use ManagementCard media for an edge-to-edge saved banner above their existing details. PageListBanner serves Business and Platform grid covers only; desktop and mobile tables omit banners. It shows the first enabled banner image in saved order, never autoplays, and uses the same neutral tenant-tinted placeholder for absent, disabled or failed images. Grid loading cards reserve the same cover ratio. LinktreeListBanner adapts saved Linktree configuration to the same PageListBanner surface; PageListCardHeader centers the logo halfway over the lower banner edge and centers the title, badges and description beneath it. Grid traffic cells share the same centered alignment. Existing Linktree table logos remain visible.

Linktree and Form collection grids, tables and mobile cards omit blank optional text (including whitespace-only slogans/descriptions) instead of rendering dash placeholders. Text blocks and their spacing disappear; table cells remain aligned with their headers. Missing optional creation dates omit their card metadata label and leave table cells empty. Real zero traffic values remain visible.

Shared StatCard variants render their label and optional supporting context through StatCardCaption in one bounded row beneath the value. Context uses smaller muted text after a separator; narrow cards truncate text without introducing a third line. Hover or keyboard focus exposes the complete caption through the shared Tooltip. All stat-card skeletons use StatCardFrame to reserve the same two-line metric layout. Callers keep their existing subtitle/description values and localization.

Grid pin controls sit at the physical top-right of the banner through PageListCardMedia, as an icon without a background in default, hover and pinned states. Form cards omit absent/disabled logos and their overlap spacing. Linktree collection logos fall back to the business default avatar, never the system default avatar or business logo. Legacy DefaultAvatar placeholders count as unset; without owner media no image is rendered.

Analytics share management groups credential and lifecycle actions in one responsive toolbar. Icons use tenant, warning and destructive accents; labels appear when the card container is at least 560px wide, while smaller cards retain 36px icon buttons with localized accessible names and shared tooltips. Metadata sits in one compact row above the toolbar. Language, theme and close follow the analytics drawer order with 36px controls; changing drawer language updates copy and newly created link locale without altering existing grants.

Linktree category fields and Search & page details are shown only with advancedSeoAllowed. Business access comes from a live Max subscription; the internal Platform workspace keeps advanced authoring. Lower plans retain automatic page SEO and the existing headline/description/logo editor. Hidden paid data remains in the saved draft on unrelated edits and is excluded from lower-plan previews.


App light/dark switches share a short whole-page crossfade rather than staggered
control animations. Use `useAppTheme` for app appearance; do not create local theme
state or persist preferences from React state updater callbacks. Preserve tenant
accent colors and authored public page palettes. Respect reduced motion, keep
focus in the existing control, and animate colors rather than layout geometry in
the compatibility fallback.


Stat cards use one horizontal Linktree-inspired layout everywhere, including
nested settings and campaign metrics. Customize color, icon, action, context and
compact size through StatCard props; do not create alternative metric shells.
StatCardFrame and shared color tokens are the single design source for resolved
cards and SkeletonStatCard. Pending icon, value, caption, context and action
slots all use shared skeleton primitives and have identical dimensions in both
states. Skeleton grids use StatCardGrid with the actual count and desktop column
configuration. Avoid per-card hover scaling, geometry transitions, or custom
loading colors. A pending card is noninteractive and its loading owner announces
status once; loaded cards retain readable zero values and bounded long text.


Dashboard Website navigation lives in DashboardSidebar's shared footer, with a
localized label and globe icon, and opens the current host's homepage in a new
tab. It is absent from DashboardHeader. Footer support/settings and Website rows
reuse DashboardSidebarAction, keep accessible names when collapsed, and
close the mobile navigation on activation. The business plan is a single compact
clickable row with current-plan text and an inline tenant-colored upgrade cue;
Max retains plan details without an upgrade cue. Do not nest a second button or
wrap the plan row in another card surface.


ManagementDrawer owns its controlled open/close presence through ManagementModal
and ManagementDialog. Conditionally rendered feature drawers must be wrapped in
DrawerPresence at their owner; do not return null before a controlled false open
prop reaches the shell. The shared DrawerSession spans lazy skeleton/content
handoffs so the actual editor does not slide in a second time. Keep the same
owner key during that handoff. New independent drawers get independent sessions.
The retained dialog owns keyboard trapping and document scroll locking through
its exit, ignores duplicate dismissals, and restores focus only after removal.
useDocumentScrollLock is reference-counted so overlapping overlays can close in
any order. Focus restoration never steals focus from a newer overlay and can
follow a removed parent dialog back to its original opener. Motion owns temporary
transform promotion; drawer surfaces do not permanently reserve compositor layers.


Dashboard navigation and footer rows share DashboardSidebarAction and scoped
sidebar styles: 46px targets, 15px corners, quiet neutral hover, bounded labels
and no hover scaling or layout animation. Header actions and sidebar rows compose
the same dashboard-chrome control styles, including keyboard focus, disabled and
reduced-motion states. Menu, refresh, notifications, language and theme
controls share 40px targets and 15px corners, with a subtle neutral background
and a slightly stronger hover/open fill in both themes. Header icons remain 16px
without hover scaling, with tighter mobile spacing. The profile trigger retains
its original responsive size and edge-to-edge image rather than an inset image.
Dashboard headers use the sidebar's
solid light/dark surface and a divider; shared reports retain their page-matched
surface. The shell skeleton reuses DashboardHeaderFrame and matching controls.
DashboardSidebarSkeleton reuses sidebar brand/navigation/footer classes, row icon
slots and the real plan-row geometry, including short-viewport and collapsed
states. Business loading reserves five navigation rows plus plan/support/Website;
Platform loading reserves nine rows plus administrator settings/Website, with
the visible permission-filtered count supplied when available. Header loading
uses the actual button surfaces with 16px icon placeholders, a language-code
placeholder and the original responsive profile image size. No arbitrary extra
actions, decorative blocks or alternating label widths are added. These loading
controls are non-interactive and hidden from assistive technology; the page body
provides the single loading announcement. SkeletonBlock owns the shared pulse
primitive independently of the shell to avoid circular component imports.
Selected navigation and the plan cue
use white ink on the tenant's solid primary color; light colors are darkened only
for selection to preserve readable contrast. Gradient themes use their first stop
here to avoid text crossing incompatible backgrounds. Selected icons have no
separate background. The plan row has a soft brand tint with a gold crown;
its shared 28px icon slot, 12px gap and horizontal padding align its text with
the Website and Help and support actions, including collapsed navigation.
Support and Website icons use green and blue. The sidebar uses the dynamic
viewport height with compact spacing on short screens and safe-area footer padding.
It has no separate navigation scroller; unusually short/zoomed screens retain
whole-sidebar overflow so no controls become inaccessible.
Sidebar variables are computed from explicit Business/Platform branding props,
independently of light/dark appearance. readableInk uses sRGB contrast and selects
white, dark slate, or black to achieve at least 4.5:1 on valid solid colors.
Disabled rows keep native disabled semantics and their reason tooltip; hidden
items remain absent, collapsed labels retain accessible names and mobile labels
stay visible even when the saved desktop sidebar is collapsed.


Management collection responsiveness is based on the section/card's available
width, including space consumed by the sidebar. The desktop toolbar retains its
single row; narrow sections place Search/Create above Active/Archive and
Grid/Table. These are the same controls, labels, colors and rounded surfaces,
with 36px phone, 38px compact and 40px desktop toolbar heights. Scoped minimums
prevent the legacy global 44px mobile rule from overflowing segmented groups.
Selected actions wrap into a two-column row on phones with a full-width delete
action. PageListMobileCard places optional selection/avatar beside a wrapping
headline and puts actions below details, shared by Forms and Linktrees. URLs
and pagination can wrap without widening the page. Narrow grid cards retain
all actions and show the two labeled actions above icon actions. Loading states
reuse the same responsive toolbar and stacked table-row structure.


Forms and Linktrees use PageCollectionSkeleton for grid and table loading, plus
SkeletonPageManagement for route-level loading. These delegate to the real shared
ManagementCard/GridLayout and SkeletonTable frames, preserving responsive action
wrapping, banners, overlapping logos, URLs, metadata and optional selection slots.
Skeletons contain no disabled fake action buttons. FormsStats passes loading into
the same StatCard component used for its settled values, matching LinktreeStats;
failed data requests show unavailable values rather than invented zero counts.
Public form previews and submission reports retain their domain-specific loaders.

Forms and Linktrees table actions use the same three-column action layout on
mobile, tablet and desktop, wrapping after every third visible button. Table and
grid actions share GridCardActionButton tones, rounded surfaces and responsive
32/36px targets; grid cards retain their labeled primary actions and each
resource retains its own capabilities and action order.
Collection action buttons use borderless, low-opacity semantic fills with
slightly stronger hover fills in both themes, 14/16px corners and consistent
1.75px icon strokes. Only colors transition; controls do not scale or move on
press. Keyboard focus remains visible, and reduced-motion preferences disable
transitions. Both presentations share one base style in GridCardActionButton.

Spotlight template links center both label lines within the full button width,
using balanced icon-side columns so the icon cannot offset the text. Bounded
label columns truncate long titles and identities without overflowing phone
previews. Icons inherit the platform/custom-color foreground. Template search
highlights follow the dashboard accent, and scrolling/card motion honors reduced
motion preferences in the shared Business/Platform catalogue.

SearchModal and ConfirmDeleteModal share soft-modal.module.css for centered,
viewport-bounded panels, 24px corners, neutral surfaces, quiet dividers and
borderless 14px controls in both themes. Search and accent confirmations inherit
the active dashboard palette rather than forcing platform branding into business
portals. Destructive confirmations keep a soft red semantic action. Both use the
shared modal keyboard/focus trap and document scroll lock; search restores input
focus after clearing and only its result list scrolls on short screens.
ManagementSearchModal is a data/result adapter over SearchModal, including Forms
and Linktree searches in both dashboards; it owns no separate portal, overlay,
input or keyboard implementation. Its Enter key opens the first matching result
and its close control dismisses without selecting. All destructive confirmation
dialogs use ConfirmDeleteModal, which owns its pending state and prevents repeat
submissions or dismissal while a mutation is pending, even when a caller does
not supply an external loading flag.

The template catalogue uses PageManagementSection, ManagementGridLayout,
ManagementCard, EmptyState and the same ManagementSearchModal result adapter as
Pages and Forms. ManagementSearchTrigger is shared by collection toolbars and
the catalogue. TemplateCatalog owns only template preview configuration; each
preview continues to use the real PhoneMockup and DynamicTemplate renderer.
SkeletonTemplatePage reuses the section/card/phone frames, matching three metric
colors, category tabs and the full-width search control without fake actions.
Pages and Forms use shared SegmentedTabs, including keyboard navigation.
The template category tabs occupy a standalone full-width row above the content,
matching Business and Platform Settings; they are not nested in the search toolbar.
SegmentedTabsFrame owns the shared surface for tabs and their loading placeholders.
SegmentedTabs inherits tenant theme variables by default, including saved solid
colors and gradients. Explicit saved color values override both primary color and
fill; the default emits no self-referencing CSS variable. The Business catalogue does
not force platform branding. Only the Platform catalogue sets that boundary.
Search and metrics follow the active category; switching categories clears the query.
Forms currently shows one localized Default preview using createForm/FormPreview,
with sample copy confined to preview rendering and no persistence, submission or
tracking callbacks. The form renderer loads only when its preview is needed.
Catalogue forms pass viewport="device" to the shared preview renderer. This
reuses the public responsive surface, full viewport height and mobile field sizes
inside PhoneMockup's real 390px viewport, without enabling public behavior or
removing sample copy. It hides editor browsing controls, removes the inset card
frame and starts the banner behind the phone status overlay without a top strip. Embedded editor previews keep
their compact layout; published pages keep their existing presentation semantics.
CustomSelect, PickerPopup and their positioning/focus hooks use the trigger's
ownerDocument/defaultView. Menus rendered inside PhoneMockup stay within its
390px document and use that viewport for bounds, scrolling and dismissal.
The Forms catalogue fixture demonstrates all eight question types and all eight
content-block types, sample media/carousels, conditional choices, product prices,
privacy consent and completion actions in all three languages. Its local demo
images include their SVG source; fixtures never initialize saved forms or send
responses/tracking events.
Public and device form surfaces use white primary-action text/icons while
retaining the saved fill. Shared input/picker tokens are scoped to the form's
appearance, with soft borderless fills and 16px corners. Product rows and totals
use quiet surface/accent tints. Choice questions compose shared RadioField,
which styles a native radio while retaining grouping, keyboard interaction,
required validation and high-contrast fallback. Appointment fields reuse the
shared DateInput (localized calendar plus manual entry), including native custom
validity for invalid typed dates. Consent continues using shared CheckboxField.
Help popovers share the picker surface and use their trigger's document.

Settings → New page defaults uses the editor's shared design, pattern and
Light/Dark/Custom appearance controls, including the anchored custom-color popup.
New Linktree drafts honor these saved preferences in Business and Platform editors.
When preferences are absent, Dark (`#161b22`) and 45-degree grid are used.
Explicit `none` remains a valid saved pattern; editing and duplication retain the
page's own appearance. Existing pages without a pattern continue to render without one.

CustomSelect uses the shared picker popup palette for both plain and titled menus.
Menu shells have 20px corners; list and grid options use 16px corners. List rows
have a 6px gap and inset so hover and tenant-colored selection remain distinct.
Search surfaces keep the same appearance while focused and unfocused.

CustomSelect menu edges are transparent in both appearances, including inherited
and titled menus; the shared soft shadow separates them from surrounding content.

Non-searchable CustomSelect menus support letter/prefix navigation from the
trigger or open list. Repeated letters cycle enabled matches; a 700ms pause
starts a fresh prefix. Typing moves focus without committing a selection.
Searchable menus retain their editable prefix filtering.

Public Linktree templates share LegalLinks for small,
centered Privacy/Terms footer navigation, with quiet inherited text, a dot
separator, accessible keyboard focus and responsive wrapping. URLs use the
configured platform origin and English legal-document language, never a
tenant-controlled host. Legal navigation does not dispatch marketing actions.

LinktreeLegalFooter is fixed to the bottom of the real/device viewport in every
Linktree template. The layout reserves 56px plus the device safe area so final
links are not covered. Only English Privacy/Terms links are shown, directly over
the page body without a background, blur or ownership label. Legal URLs request
English regardless of page language. Forms are unchanged.

Linktree headers keep profile identity and introduction above the primary links.
Extended service details and hours are rendered after the links in
PublicLinktreeBusinessDetails, a compact native details/summary disclosure. Empty business objects render nothing; content remains in the document
and can be expanded by pointer or keyboard in every template and preview.

PublicLinktreeBusinessSummary keeps category and location visible as compact,
soft icon facts in the profile header. Extended services, cuisine, service area
and hours remain in a disclosure below primary actions, using aligned label/value
rows. Empty summaries and disclosures are omitted. Both respect the page palette
and language direction and are shared by all templates and previews.

Business Settings uses the same PageManagementSection as collections, with its
active-tab heading and save action in one surface. Shared SegmentedTabs sit above
that surface, matching Templates and Platform Settings; loading mirrors this placement.
Profile, defaults and messages render flat content without nested section headers.
Branding uses three upright BrandAssetTile controls with captions; disabled upload
permissions remain on the actual file inputs. Settings inputs use the shared soft
control surface in Business and Platform, and idle save buttons use the shared
neutral button surface. Platform settings sections reuse PageManagementSection.
The four Business overview cards use StatCard.loading, with a real tab count.
Settings loading mirrors the three branding tiles, color action, six profile
fields, separate three-tab navigation and one Save slot, at the same responsive breakpoints.

## Management-page parity

Use PageManagementSection and the existing management control components for
collection pages on both dashboards. Primary and secondary toolbar actions share
SettingsActionButton sizing, soft radius, keyboard focus and busy behavior;
ManagementViewToggle always shows Grid/Table text in the selected locale. Use an
explicit tenant/platform accent rather than inferring it inside resource markup.
Use PageListActions for grid footers/table action rows and PageListDescription for
optional authored descriptions. Preserve native content direction with dir=auto.
Route loading must match its page and owner palette through DashboardLoadingShell;
DashboardPageLoading selects the matching composition or a simple shared progress
state. Do not substitute a business-directory skeleton for Settings or Billing.


Grid card URL and traffic details use the shared soft, borderless control surface
through PageListUrl and PageListTraffic, with one compact link/copy row. The
shared collection skeleton mirrors this geometry for Forms and Linktrees.
CheckboxField keeps its label surface neutral when selected; only the checkbox
indicator uses the accent, with a white checkmark.

DashboardSidebar animates both CSS translate (mobile) and width (desktop/tablet)
with the same 300ms easing. Its persistent backdrop fades on close, mobile closed
navigation is inert, and keyboard focus/Escape use the shared modal keyboard hook.
Reduced-motion preferences disable these transitions.

Anchored picker and dropdown placement share anchoredPopupPosition and account
for visualViewport offsets and keyboard resize/scroll. Popups shrink to available
space instead of imposing a minimum height. Icon/color popups portal into the
trigger document so phone previews retain their own bounds, focus and theme.
Icon selection is search-first like CountrySelector, with fixed search/actions
and a separately scrolling grid; upload, libraries and clear remain available.
Date/time columns stack only when the actual popup content is too narrow.


Selection toolbars distinguish amber analytics deletion (chart icon) from red
page/form deletion (trash icon), with matching warning/danger confirmation tones.
Both controls appear only after selection, reuse the same responsive action row,
and clearly describe whether submitted answers and contact details are preserved
or deleted. Select all/deselect remain neutral; default Linktrees cannot be deleted.


PageListCardMedia owns a single banner-overlay controls row for Form and Linktree
grids and their skeletons. Selection stays left and Pin stays right, centered in
equal 32px slots on the same row in every language and at every breakpoint.


Management status/view toggles and Settings/Templates tabs share SegmentedTabsFrame
and segmented-control.module.css. Use SegmentedControl for text-only pressed
choices and SegmentedTabs for tab panels. Both use borderless soft surfaces,
rounded options, theme-colored active states and the same hover/focus treatment.
Management skeletons reuse the frame and option styles; primary toolbar/save
buttons share the management radius token (18px desktop, 16px compact).


## System design tokens

Global utility radii and shared component modules use --ui-radius-control,
--ui-radius-compact, --ui-radius-card and --ui-radius-popup. Defaults are
18/14/24/20px; small screens use 16/12/20/18px. This applies to nested controls,
loading frames, dashboard/authentication UI and public renderers. Keep intrinsic
circles (avatars, switches, radio indicators, color swatches) and the compact
calendar geometry explicit. Do not force ordinary button geometry onto them.
Shared action geometry preserves tenant and semantic fills. Neutral buttons,
file controls, add actions, crop controls and authentication fields use the shared
soft surface. Editor groups and detail/session cards use shared-surface-styles;
nested surfaces remain slightly lighter than their fields. Existing authored
public-page colors, event handlers, permissions and tracking remain unchanged.


Linktree grid, desktop table and mobile table identities share PageListName and
the existing VerificationBadge when template_config.verification_badge is exactly
true. The badge remains visible beside long/truncated names and uses localized
accessible copy. Forms do not acquire this page appearance setting.
Analytics share-link deletion uses ConfirmDeleteModal above the sharing drawer.
Only confirming calls the existing owner-scoped DELETE endpoint; cancellation
preserves access, and failed deletion leaves the confirmation available for retry.
Successful deletion removes the link and any revealed code from local state.
