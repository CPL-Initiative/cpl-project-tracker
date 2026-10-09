---
title: "Sierra's page redesign — lessons"
date: 2026-10-08
tags: [lessons, sierra, first-light, accessibility, logotype, veteran-map]
artifacts:
  - sierra/index.html
  - sierra/sierra.css
  - sierra/sierra.js
  - tests/sierra_redesign.test.js
  - a11y.config.js
related:
  - "[[sierra-page-redesign]]"
  - "[[sierra_surface_alignment_lessons]]"
---

# Sierra's page redesign — lessons

## 2026-10-08 (S348 SkyMeadow): the port, and the logo in five rounds

**A port keeps the tests' promises, not their selectors.** Seven Sierra test files pinned the old page's
structure (the navy band, the suggestion pills, the Whitney wordmark). Each changed check was rewritten to guard
its new equivalent (the starter question in the placeholder, the landing folding away, the logo link's new-tab
cue), never dropped. A check that passed vacuously after the port (*starter chips removed*: there were no chips
left to remove) is the sign to rewrite it, not to keep it.

**Measure the painted page at 320px before trusting a flex layout.** The question bar pushed the page 15px
sideways at 320px: an implicit `auto` grid track takes the input's intrinsic width (its size attribute) as a
floor. `grid-template-columns: minmax(0, 1fr)` fixed it; only `npm run a11y` saw it.

**A contrast checker reads a transparent gradient stop as black.** "New question" measured 2.49:1 over the
dock's `linear-gradient(transparent, paper)`. The words already sat on solid paper; giving their row its own
paper background made the measurement match what the eye sees.

**A one-line input truncates a hint; a growing textarea does not.** The phone cut every *Try:* starter
mid-word, and the CPL Pathways `?ask=` question showed a fraction of itself. A one-row textarea sized to the
tallest hint keeps one bar height through the cycle (no jump every 9 s) and shows the whole question.

**A logotype is placed by measuring the glyphs, not by eye.** Sam's logo rounds: a thin ridge behind ink
letters; a ghosted dark-blue name with a stem-weight ridge (Playfair SemiBold's lowercase stem measures
0.126em); the logo as drawn, mostly above the word; out of the S (its ink ends at 18.9% of the word); the dot
of the i lowered (the font's dot runs 0.627-0.772em over the baseline, the stem stops at 0.528em). Each
placement came from a canvas measurement of the font file the page ships, so each held at every size.

**Same color and weight means the line and the letters merge.** A halo in the page color on each letter
(16 `text-shadow` offsets at 0.05em) cuts the line where it passes behind and keeps the word readable.

**A glyph's dot cannot be moved; the word can be set without it.** The font carries a dotless i (U+0131, in
Fontsource's latin subset). The page draws its own dot from an empty inline-block anchor (its bottom sits on
the baseline, so offsets read from the baseline) and gives a screen reader a clipped plain *Sierra*.

**Show placements side by side.** Four variants rendered on one page settled a question three single
screenshots had not.

**Class names collide in a single stylesheet.** `.s-word` already styled the Previous/Pause/Next buttons, so
the logotype's word took their font and size; the rename to `.s-nameword` fixed it. Grep a class before adding it.

**`apply_migration` times out on `cpl_library`.** Three tries for the sheet 53/54 series record, as four for
sheet 49: nothing written each time. Hand the receipt to Sam as a paste rather than retrying.

## 2026-10-09 (S349 SkyHarbor): the docked Sierra full screen, and the veteran map mock-up

**Full screen in place means the same node in a new parent.** `position: fixed` inside First Light's glass cards
is trapped by their `backdrop-filter`, so the wrap moves to `<body>` while expanded and a hidden placeholder keeps its
seat. Moving the node keeps everything the box carries: the tab's scope, its surface, the credential, a streaming
bubble. Moving it also drops focus to `<body>`, so the expand picks its own target: the dialog when a send is about to
disable the box, the box when the reader chose *Full screen*.

**A modal makes the rest of the page inert, except a layer that paints above it.** First Light's daily greeting
(z 12000) could open over her from its keystroke; made inert, it would be a cover nobody could dismiss. A fixed
child of `<body>` with a higher z-index stays live.

**A control the host can move must live where the host never reaches.** My College hoists the widget's intro into
its `<summary>` and above the box. A *Full screen* button placed in the intro would have been left behind, inert,
when the wrap moved. It is a direct child of the wrap; a box a later mount superseded ignores its own control.

**A repaint under an expanded box is a rebuild; finish it after the host does.** `mountInto()` collapses into the
old (possibly detached) host, rebuilds, and re-expands in a microtask, because My College goes on to hoist the new
box's heading and looks for it inside its own section. The turn rows move into the new log on a same-tab repaint,
which also closed an older gap: a docked repaint emptied the visible log while `convo` still sent it.

**The first seeded conversation found the feedback row below AA on every COBI surface.** 23.4px pills and a .75
fade at 2.48:1 had passed every sweep because no sweep had painted an answer. KB note
[`methodology-a-sweep-sees-only-the-states-its-seed-reaches`](kb-notes/methodology-a-sweep-sees-only-the-states-its-seed-reaches.md).

**A stub's URL literal is a dependency edge.** The seed's `"/functions/v1/cpl-chat"` made the dependency map list
`a11y.config.js` as a caller of the chat function; a pattern (`/\/cpl-chat(\?|$)/`) stubs the same request and
claims nothing. Same for a seed link to a real host: use `example.org`, as the other seeds do.

**A mock-up with real assets reuses the builder's data, not a copy of it.** The veteran map's builder wrote its page
at import, so its data could not be reused; moving the write under `__main__` (output byte-identical) let the mock-up
import the colleges, installations, pairings and projection, and `extract_military.snapshot()` gave it today's
counts. The same ids keep the live page's a11y target and its pin exemption valid for the mock-up.

**A public figure baked at build time goes stale silently.** The veteran map showed 30 June's 24,834 with no date
for 100 days; today's figure is 28,884. The mock-up prints the date, and the live page's counts were refreshed.

**`apply_migration` on `cpl_library` timed out again** (once, nothing written). One receipt that reaches the new
version from either earlier state (50 or 54) replaces two queued pastes.

## 2026-10-09 (S350 SkyTide): the veteran map ported to First Light

**An approved mock-up is approved for the page it showed, never for the frames that embed it.** Sam approved the
standalone page. COBI's Military Partnerships tab frames the same file at `calc(100vh - 170px)`, at least 700px, and
nobody had looked at it there. Measured: the new document-flow page overflowed the frame by 170 to 280px at desktop
heights, repeated the tab's own heading, and left the reader scrolling inside the frame while the wheel zoomed the
map. The old page had filled its frame because it was a 100dvh app column. The fix is a mode the host asks for
(`?embed=1`, both HTMLs): above 980px the h1 and lede go to the screen reader only and the page fills the frame as one
column. Below 981px it is the ordinary page. KB note
[`methodology-check-a-page-inside-every-frame-that-embeds-it`](kb-notes/methodology-check-a-page-inside-every-frame-that-embeds-it.md).

**A marker counter-scaled for zoom still shrinks with the map's drawn size.** `rescaleMarkers()` divided by the zoom
alone, so in the frame's 352px map the installation stars drew at 4px against 7.7px on the approved laptop view.
Above 980px a floor now holds the approved size (0.55 screen px per map unit, capped at 1.8x). Phones keep the drawn
size, where a bigger pin would merge the Los Angeles basin, the reason the pins carry an SC 2.5.8 exemption.

**A page in someone else's frame follows that frame's theme only if it listens.** Reading `cpl_theme` before the
first paint covers a fresh load; COBI's control changes the theme while the frame is open. The `storage` event fires
in every other same-origin document, the iframe included, so a few lines in the page's head follow it live.

**Port the template, retire the mock-up.** The mock-up's generator imported the builder's data and carried its own
copy of the template. Once the builder holds the template, a second copy can only drift, so it went. The approved
look stays on claude.ai. `build_selfcontained.py --check` (CI and `check_generated.sh`) now fails when the committed
page is not its build. The jsdom checks were rewritten to guard the old failure modes in the new layout: the panel
never hidden, one column below 981px, 100vh only in the embedded desktop layout.

**Format a date by hand when the script may run on Windows.** `strftime("%-d")` is a glibc extension that Windows
rejects; Sam's Cowork sessions run there.

**The Library paste landed.** Sam pasted the Sheet 55 receipt (01:46Z): the record reads version 55, 28 entries,
Sheet 55 first. It went in as a paste after `apply_migration` on `cpl_library` timed out once more in S349.
