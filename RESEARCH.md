# Research: Hiding Google's "Upgrade" Gemini CTA

## Background

Google has started showing a solid-blue "Upgrade" pill button in the top
navigation bar of Gmail, Docs, and Sheets. It links to
`one.google.com/dynamic-plans` to upsell a paid plan (Gemini/Workspace
premium features). It sits between the app's primary action (Compose/Share)
and the Gemini sparkle icon, just left of the account avatar.

Investigated live via Playwright against a real, logged-in Google account
across three surfaces:

- Gmail: https://mail.google.com
- A sample new Google Doc: https://docs.google.com/document/d/1pKZxkoMjY478IJGrEcwFuVs6LSM2GmezRo8Xqps9q5A/edit?pli=1&tab=t.0
- A sample new Google Sheet: https://docs.google.com/spreadsheets/d/1UVvbZrnBE8ASmwWOcUYtUb7PtBRbuB2TWV3UjqHSkbw/edit?gid=0#gid=0

## What the DOM actually looks like

Two distinct rendering paths were found — Docs and Sheets share one, Gmail
uses another. (Drive was verified separately — see the Drive addendum below,
since it turned out to use a third layout mechanism. Not yet directly
verified on Calendar/Chat/Keep, but see "Scope" below for why the same
approach should cover them.)

### 1. Gmail — the shared "gb_" universal top bar

```html
<div class="gb_v gb_ye bGJ">
  <!-- universal top bar -->
  <div class="s1rbBe" data-pep-id="global-pep-gmail">
    <!-- "pep" = promo entry point -->
    <span
      class="iTvTg"
      jscontroller="GcrEAe"
      data-action-behavior="...one.google.com/dynamic-plans?...utm_campaign=upgrade_ogb..."
    >
      <span data-is-tooltip-wrapper="true">
        <div data-is-touch-wrapper="true">
          <button
            role="link"
            class="FOBRw-I FOBRw-I-ql-ay5-ays ... u0fKN HmMgZe"
            data-tooltip-enabled="true"
            aria-describedby="tt-c3"
          >
            <span class="FOBRw-anl">Upgrade</span>
          </button>
        </div>
      </span>
    </span>
  </div>
</div>
```

Key finding: the `FOBRw-*` classes are Google's compiled/obfuscated CSS
classes — they are **not stable** (they vary by build and are effectively
hash-like). The one reliable marker is the ancestor
`data-pep-id="global-pep-gmail"` attribute — a semantic, human-readable
attribute Google uses internally to tag these promo widgets. The button
itself is `role="link"` with the exact visible text `Upgrade`, and its
tooltip reads "Upgrade for premium features".

### 2. Docs / Sheets — the Workspace editor framework

```html
<div class="appsElementsWorkspaceRecommendationCtaButtonContainer">
  <div class="mdc-touch-target-wrapper">
    <button
      role="link"
      class="javascriptMaterialdesignGm3WizButtonFilledTonal-button ...
                                workspacepepbutton
                                docsRecommendationsPepPersistentEntryPointEditorPepButton
                                appsElementsWorkspacePepGlobalRecommendationPepGlobalTextButton
                                appsElementsWorkspaceRecommendationCtaButton"
    >
      <span
        class="javascriptMaterialdesignGm3WizButtonFilledTonal-button__label"
        >Upgrade</span
      >
    </button>
  </div>
</div>
```

This markup was byte-for-byte identical in structure between the sample Doc
and the sample Sheet (both are the same "Workspace editor" JS framework), so
whatever handles Docs should handle Sheets, Slides, and Forms for free.

Here the class names are semantic rather than obfuscated, and consistently
contain the substring `Pep` (their internal name for "Persistent Entry
Point").

The full ancestor chain from the button up to the toolbar row (abbreviated,
with each element's own `display` and the number of children its _parent_
has):

```
button.appsElementsWorkspaceRecommendationCtaButton   (role=link, "Upgrade")
  div (no class)                                       — parent has 1 child
    div.appsElementsWorkspaceRecommendationCtaButtonContainer
      div (no class)                                   — parent has 1 child
        div.appsElementsWorkspacePepGlobalRecommendationPepGlobalContainer
          div.docsRecommendationsPepPersistentEntryPointContainer   ← min-width: 108px (!)
            div.docs-titlebar-buttons  [display: flex, 9 children]  ← the real toolbar row
```

**Bug found after initial implementation:** the first version hid
`appsElementsWorkspaceRecommendationCtaButtonContainer` (matched via the
`Pep`-containing class name, then `.closest('[class*="CtaButtonContainer"]')`).
That div did disappear, but a visible gap remained where the button used to
be. Inspecting computed styles live showed why:
`docsRecommendationsPepPersistentEntryPointContainer` — three levels further
up, and _not_ hidden by that logic — has `min-width: 108px` baked into
Google's CSS. A `min-width` applies to a rendered box regardless of what its
(now-empty) children look like, so that wrapper kept reserving 108px of
width in the flex row even though its contents had collapsed to nothing.

### Common signal across both — and the corrected hide-target rule

Class-name matching (`data-pep-id`, `Pep`-containing classes) is still how we
_find_ the button, but it turned out to be the wrong basis for deciding
_what to hide_ — Google's own wrapper divs can carry hard-coded sizing at
any level, and there's no way to know from a class name alone which wrapper
that applies to. The reliable, product-agnostic signal instead is
structural: walk up from the matched button, and stop at the first ancestor
whose own **parent** is the actual multi-item toolbar row — i.e. the parent
has more than one child and is laid out with `display: flex` or `grid`.
That ancestor is the true flex/grid item slot; setting `display: none` on it
removes it from flow entirely, so the row's flex/grid algorithm reclaims the
space regardless of any `min-width` on wrappers further in.

Verified against live DOM that this lands on exactly the right element for
both products:

- Gmail: `div.s1rbBe[data-pep-id]` — its parent (`div.gb_v`) has 5 children,
  `display: flex`.
- Docs/Sheets: `div.docsRecommendationsPepPersistentEntryPointContainer` —
  its parent (`div.docs-titlebar-buttons`) has 9 children, `display: flex`.

Confirmed live: forcing `display: none` on that element shrank
`docs-titlebar-buttons`'s rendered width from 493px to 378px — exactly the
115px (108px button + margin) reclaimed, no residual gap.

## Scope: which sites to run on

The button is rendered by code Google itself ships as part of two shared
subsystems:

1. The "gb_" universal top bar — loaded on effectively every logged-in
   Google product (Search, Gmail, Drive, Calendar, Keep, Photos, Contacts,
   etc.), not just Workspace apps.
2. The Workspace editor promo framework — loaded on Docs, Sheets, Slides,
   Forms (all under `docs.google.com`).

Since both only ever load on Google's own origins, scoping the content
script to `*://*.google.com/*` is both sufficient ("all sites that show this
button") and much better for privacy/performance than a true `<all_urls>`
injection that would run on every website the user visits.

## Implementation plan

1. **Detection** (`src/utils/hideUpgradeButton.ts`): query for
   `button, [role="link"], [role="button"]`, filter to elements whose
   trimmed `textContent` is exactly `"Upgrade"`.
2. **Hide target selection**: walk up to 12 ancestors; return the first one
   whose own parent has more than one child and a `flex`/`grid` display —
   i.e. the actual item slot in the shared toolbar row. Falls back to
   hiding the button itself if no such ancestor is found within the depth
   limit, so any future rendering shape still gets _something_ hidden
   instead of silently no-oping. See "Bug found after initial
   implementation" above for why this replaced the original
   class-name-based target selection.
3. **Hide mechanism**: `element.style.setProperty("display", "none",
"important")` plus a `data-upgrade-hidden` marker attribute to make the
   scan idempotent (avoids re-processing on every mutation).
4. **Keeping up with SPA rendering**: Gmail/Docs/Sheets are heavily
   client-rendered and mutate continuously after initial load, so a single
   scan at page load isn't enough. A `MutationObserver` on
   `document.documentElement` (subtree + childList), throttled to one scan
   per animation frame, re-scans as new DOM is inserted.
5. **User control**: reuse the template's `chrome.storage.sync` +
   `useSyncStorage` pattern for a single popup toggle ("Hide Upgrade
   button"), defaulted to on, so the user can disable it without
   uninstalling.
6. **Manifest**: single content script entrypoint
   (`hide-upgrade.content`), `matches: ["*://*.google.com/*"]`,
   `runAt: "document_start"` (safe because the logic only touches
   `document.documentElement`, not `document.body`, so it doesn't need to
   wait for the body to exist).

## Verification

- Unit tests (`src/utils/hideUpgradeButton.test.ts`) cover both markup
  shapes above using DOM fixtures copied from the real inspected structure
  (including realistic multi-child flex toolbar rows and the multi-level
  single-child wrapper chain), a negative case (`"Upgrade your plan"`,
  `"Share"` — must NOT be hidden), idempotency, and restore/re-hide via the
  popup toggle.
- Live-verified against the real, logged-in Gmail/Docs pages via Playwright:
  injected the actual detection + hide-target algorithm and confirmed
  `docs-titlebar-buttons`'s rendered width dropped from 493px to 378px
  (exactly the button's own width) with zero residual gap, and took a
  before/after screenshot showing the Gemini icon sitting directly next to
  Share.
- Still needed: load the built unpacked extension in Chrome (rather than
  hand-injecting the algorithm via devtools) and confirm end-to-end via the
  popup toggle, and spot-check Calendar (untested here) since it shares the
  same gb_ bar as Gmail. (Drive was spot-checked separately — see addendum;
  it does _not_ share Gmail's flex-based gb_ bar layout.)

## Addendum: hiding the Gemini entry-point button

The Gemini "star"/sparkle icon sits immediately to the left of the Upgrade
button in the same shared toolbar row on both surfaces, so the exact same
structural hide-target rule applies unchanged. Verified live via Playwright
on Gmail, a sample Doc, and a sample Sheet.

The one real difference: this button is icon-only (no visible text), so it
can't be matched on trimmed `textContent` like "Upgrade" — it's matched on
`aria-label` instead:

- Gmail: `<button aria-label="Ask Gemini" class="VYBDae-JX-I ...">`, parent
  chain `span[data-is-tooltip-wrapper] > div.Zmxtcf.ADOx3c > div.gb_v` (same
  `gb_v` toolbar row as the Upgrade button, 5 children, `display: flex`).
- Docs/Sheets (identical structure on both, same Workspace editor
  framework): `<button aria-label="Try Gemini"
class="...appsElementsSidekickAuroraEntryPointButton">`, nested under
  `div.appsElementsSidekickAuroraEntryPointRoot`, several single-child
  wrappers up, then `div.docs-titlebar-buttons` (9 children, `display:
flex`) — the same toolbar row the Upgrade button lives in.

Implementation (`src/utils/hideGeminiButton.ts`) matches `aria-label` against
an exact set (`"Ask Gemini"`, `"Try Gemini"`) rather than a loose substring
match, for the same reason the Upgrade button uses exact text: avoids
accidentally hiding unrelated Gemini-labeled controls elsewhere on the page
(e.g. in-canvas "Help me write" affordances) that don't share this toolbar
structure. The shared ancestor-walk and hide/restore mechanics were factored
out into `src/utils/toolbarButtonHider.ts` so both features (and any future
one) reuse the same verified logic instead of duplicating it.

Live-verified: on Sheets, hiding the button shrank
`docs-titlebar-buttons`'s rendered width from 493px to 449px (exactly the
icon button's width) with no residual gap; on Gmail, a before/after
screenshot confirmed the sparkle icon disappears and Settings sits directly
next to Upgrade.

Same locale caveat as the Upgrade button: `"Ask Gemini"` / `"Try Gemini"`
are English-locale specific.

## Addendum: adding Google Drive — a third, table-cell-based layout

The manifest's content-script match pattern (`*://*.google.com/*`) already
covers `drive.google.com`, so both buttons were technically live there
already. Verifying Drive specifically surfaced a real bug: Drive's "gb_"
top bar does **not** use flex/grid at all. Verified live via Playwright
against `https://drive.google.com/drive/my-drive`.

```
div.gb_v.gb_ye.Hb-ja-Na   [display: block, 5 children]  ← the toolbar row
  div.a-OkO9ve-gAsIFc     [display: table-cell]           (icon)
  div.gb_Ae.gb_ze         [display: table-cell]           "Help / Training / ..."
  div.gb_Ae.gb_ze         [display: table-cell]           (unlabeled)
  div.gb_Ae.gb_ze         [display: table-cell]  <button aria-label="Try Gemini">
  div.Iu19ad-...          [display: table-cell]  <button role=link>Upgrade</button>
```

Each toolbar item sets `display: table-cell` on **itself**; the row
(`gb_v`) that contains them is not `display: table` — it computes as plain
`display: block`, relying on the browser's anonymous-table-box generation
to lay the `table-cell` children out side by side. The original hide-target
rule only inspected the **parent's** `display` for `flex`/`grid`/etc., so on
Drive it never found a qualifying ancestor and walked all the way up,
returning `gb_v` itself — hiding the _entire_ row (Help + the unlabeled
button + Gemini + Upgrade together), not just the one control. Confirmed
this against the live, unpatched algorithm before fixing it.

Fix (`src/utils/toolbarButtonHider.ts`): in addition to checking the
parent's display, also check the **candidate node's own** display for
`table-cell` (still gated on the parent having more than one child). That
resolves to the individual `div.gb_Ae.gb_ze` / `div.Iu19ad-...` cell on
Drive, exactly mirroring what the flex/grid check already does for Gmail
and Docs/Sheets — without changing behavior on either of those, since
neither uses `table-cell` items.

Live-verified after the fix: hiding both buttons shrank `gb_v`'s rendered
width from 262px to 88px, with the Help button and the other cell
untouched and still `display: table-cell`; before/after screenshots
confirmed the Help icon, Settings, and account avatar are all still
visible and correctly spaced.

### Follow-up: a real race, and a guard that was initially too strict

The table-cell fix alone wasn't the end of it. Live-testing an in-app route
change on Drive (opening a folder, then navigating back — no full page
reload, so the extension's `MutationObserver` stays attached across it)
reproduced a second, real bug: for one `MutationObserver` tick mid-transition,
a per-item wrapper's `display: table-cell` was transiently unset — Google's
JS was still reattaching styles/classes to the freshly re-rendered node — so
the walk kept going past the real per-item slot and matched `gb_v`'s own
_parent_ as a flex container instead, returning the whole `gb_v` row. That
target got permanently marked hidden (the hidden-attribute check makes later
scans skip it), which is exactly the "buttons flash briefly, then the whole
toolbar vanishes and stays gone" symptom reported after the first fix shipped.

Guard added: a correct per-item target must contain exactly one _visible_
interactive control — the button being hidden. If the best candidate also
contains another visible button/link, it's too broad; fall back to hiding
just the raw matched element instead of guessing further up (walking further
would only broaden the match, never narrow it). Verified live: instrumented
the actual `MutationObserver`-driven hider and stress-tested it through
repeated in-app folder navigation on Drive — `gb_v` was never hidden across
23+ scans, versus reproducing on effectively every route change beforehand.

That guard then caused its own (smaller) regression: it counts _any_ other
button inside the candidate, but Google renders a second, narrower
`aria-label="Upgrade"` button (icon-only, for smaller viewports) inside the
same per-item wrapper as the visible one — already `display: none` at normal
widths. The guard saw that hidden duplicate as "another control" and always
fell back to hiding just the raw `<button>`, which doesn't reclaim the
wrapper's table-cell width — reproduced live as a persistent gap where the
Upgrade button used to be, even though the button itself was correctly
hidden. Fixed by having the guard skip controls that are already
`display: none` (`hasOtherVisibleInteractiveControls` in
`toolbarButtonHider.ts`): they're not something the user would actually
lose by hiding the shared wrapper. Re-verified live afterward that `gb_v`'s
width correctly drops from 262px to 88px (both buttons' space fully
reclaimed) while the race-condition stress test above still holds (`gb_v`
never wrongly hidden across repeated navigation).

## Known risks / things that could break this later

- The structural hide-target rule now recognizes two layout mechanisms
  (parent `display: flex`/`grid`, or the candidate node's own `display:
table-cell`) — true today across Gmail, Docs, Sheets, and Drive, but a
  future redesign using a third layout primitive (e.g. CSS `subgrid`, or a
  non-flex/non-table row) could require extending the rule again the same
  way Drive's table-cell layout did.
- If Google ever renders the label via an icon-only button (no visible
  "Upgrade" text) or changes the tooltip pattern, exact-text matching would
  stop firing. Worth revisiting if the button reappears after an update.
- Exact-text match on `"Upgrade"` is English-locale specific; a
  non-English UI would need per-locale label matching (not currently
  handled).
- The fallback (hide the bare button when no qualifying flex/grid ancestor
  is found within 12 levels) reintroduces the original gap bug for any
  product that doesn't fit the observed structure — acceptable as a
  last resort, but worth flagging if it ever triggers in practice.
