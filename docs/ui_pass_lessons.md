---
title: "The checkpoint's UI pass — lessons"
date: 2026-10-09
tags: [lessons, ui-pass, accessibility, first-light, dark-mode, a11y]
artifacts:
  - scripts/ui_pass.py
  - kb/ui_pass_ledger.json
  - a11y.config.js
  - privacy.html
  - cpl_funding.js
  - prototype/ccr_atlas_v1.html
  - tests/public_pages_a11y.test.js
  - tests/cpl_funding_colmenu_edge.test.js
  - tests/ccr_skyview_first_light.test.js
  - tests/ui_pass_test.py
  - tests/cpl_funding_controls_first_light.test.js
  - tests/budget_section_first_light_test.py
  - tests/workplan_goals_editor_first_light.test.js
  - budget_editor.js
  - workplan_goals.js
related:
  - "[[sierra-page-redesign]]"
  - "[[cobi-dark-mode]]"
  - "[[methodology-a-sweep-sees-only-the-states-its-seed-reaches]]"
  - "[[methodology-a-fill-that-does-not-flip-needs-ink-that-does-not-either]]"
---

# The checkpoint's UI pass — lessons

Sam, 2026-10-08: *"pick one COBI surface to prioritize an UI audit and fix to ensure it's wired to all dependent
surfaces, maintains AA, is mobile friendly, and is First Light formatted."* `scripts/ui_pass.py --next` names the
view, `/a11y-pass` audits it, and `--record` stamps the ledger. The first passes (Sierra S349, the veteran map and the
Fact Sheet S350) are written up in [`sierra_page_redesign_lessons`](sierra_page_redesign_lessons.md); this doc carries
the pass from S351 on.

## 2026-10-09 (S351 SkyLark): the privacy page, the funding explainer, SkyView, and the picker

**A page can pass every measurement and still be off First Light.** `privacy.html` was clean at nine widths: AA,
targets, no sideways scroll. It set `system-ui` and had no dark mode, and no measurement asks for either. The First
Light half of the pass is a reading of the CSS, never a number: the theme's two faces, tokens only, and the
`cpl_theme` contract. The page now self-hosts Playfair Display and Source Sans 3 from `sierra/fonts/`, so a move of
those files would fall back silently; the test checks that every font path the page names exists (#1929).

**A dark target has to be proven to measure dark.** `privacy-dark` reported clean on its first run. Setting one dark
value below AA (`--text-muted: #4A4A44`) made it fail at 1.87:1, which is what makes the clean report evidence.

**A closed `<details>` still measures, and the harness counts where its panel would open.** The funding explainer
failed at 560 and 561px with `div.cplfund-colmenu-panel right=614`. The Columns panel hangs from its summary's left
edge, and where the toolbar sets Columns toward the right (480 to 561px and 1024px, measured), the opened panel ran past
the viewport and the page scrolled sideways. No fixed rule fits every width, since Columns sits at the left on a phone.
The fix measures on render, open and resize, and hangs the panel from the right edge only when the left-hung panel
would pass the viewport and the right-hung one fits. The resize listener rides the menu's per-render teardown, and the
test counts live listeners across renders (#1930).

**A priority order with a class key ahead of "never audited" starves the other class.** The picker ranked a public
page before a COBI tab ahead of never audited before audited. Once the six public pages had passed, `--next` offered
Sierra again, passed that morning, ahead of 41 COBI tabs no pass had reached. Never audited now comes first; a public
page nobody has audited still leads (#1931).

**The sweep cannot see a state no route paints.** SkyView was clean at all 11 routes and its sweep passed. Its
template still wrote `color:#fff` on `var(--cobalt)` and `var(--seal-blue)` in three places: two hovers and the pressed
Night word inside the shut More panel. The night canvas makes both tokens `#7DA1D4`, so each read 2.65:1. Reading the
CSS for literal ink on a themed fill found all three; `var(--on-accent)` reads 6.95:1 (#1932). The KB note's
second worked case:
[`methodology-a-fill-that-does-not-flip-needs-ink-that-does-not-either`](kb-notes/methodology-a-fill-that-does-not-flip-needs-ink-that-does-not-either.md).

**SkyView's sweep needs the description shards.** Without `python3 kb/_build_ccr_universe.py --shards-only`, its
description check fails for that reason alone (229 of 230). With them it passed 233 of 233.

**Edit the generator.** SkyView's CSS lives in `prototype/ccr_atlas_v1.html`; `prototype/skyview.html` is built by
`prototype/build_ccr_atlas.py`, and `check_generated.sh` fails an edit made in the page. Each change to a scanned file's
line numbers also restales `kb/dependency_map.json`; regenerate it before the push.

**A full local `npm test` here runs about 25 minutes, and the funding files alone run longer than the 10-minute shell
limit.** Run the tests that read the changed files, then let CI's four shards (about 8 minutes) run the suite before the
merge.

## S352 (SkyMeridian, 2026-10-09): the Dashboard, and the Fact Sheet's port

**A theme flip that scopes its override to the cards it knew leaves the base rule painting for the rest.** The
"How this is calculated" panels (`ALGO_DETAILS_CSS` in `excel_to_dashboard.py`) were written for dark ink cards:
white-alpha text, a mustard tint. First Light turned the KPI cards light and added a `.kpi-card` override, which
fixed those eleven and left the base untouched. The two trend cards and the seven exhibit cards had also turned
opaque white, and nothing overrode them: their summary, source and meta read white on white, 1:1, on every light
Dashboard since. A probe of each panel's real ground (`getComputedStyle` up the ancestors) showed no dark card left,
so the base rules now read theme tokens and the override is gone (#1937). Before keeping a base rule's "the other
cards are dark" premise, measure every instance's ground.

**Inline styles beat the stylesheet's focus ring.** The four College Activity filters set `outline:none` inline; COBI's
`:focus-visible` rule could not reach them. Removing the inline declaration restored the ring. The template is emitted
verbatim by the generator, so the fix went in `college_activity_template.html` and both HTMLs together (#1937).

**A page that hosts a shared script must define what the script reads.** `factsheet_sierra.js` writes
`var(--on-accent)` on its cobalt fills. The funding explainer defines the token; the Fact Sheet never did, so Ask
Sierra on hover and the drawer's Send painted the body's ink on cobalt, 1.35:1, behind a clean sweep (one paints on
hover, the other in a shut drawer). `tests/factsheet_a11y.test.js` (g) now fails any bare `var()` the page or its
scripts read that `factsheet.css` does not define (#1934). Third worked case of
[`methodology-an-undefined-css-token-fails-to-an-invisible-state`](kb-notes/methodology-an-undefined-css-token-fails-to-an-invisible-state.md).

**A whole public page mocks up as itself.** The Fact Sheet's First Light mock-up is the page rendered by its own code
with the curator's live overrides answered from a fixture, then given two stylesheets switched by their `media`
attribute (*Look: First Light / Today*). An artifact loads nothing from another host, so the fonts and the page's own
images went in as data URIs and the story photos (staging2.map.rccd.edu) were left out with a note. The port then
copied the proposal over `factsheet.css` unchanged in substance (#1935, #1938).

**A test that reads tokens from the whole stylesheet takes the last value.** Once `factsheet.css` gained dark blocks
restating `--paper` and the rest, `factsheet_a11y.test.js`'s token map would have computed its light pairs with dark
values. It reads the first `:root` block for light and the explicit dark block for its 15 new dark pairs.

**The Supabase guard blocks an `update` through `execute_sql`.** The open-asks Library record's version 57 went to Sam
as a paste with its receipt, as version 56 did (`apply_migration` times out on `cpl_library`).

**A symlinked `node_modules` is a file to git.** `.gitignore` named `node_modules/`, which matches a directory only, so
the handoff's worktree pattern (symlink `node_modules` into each worktree) put the link into #1934 through `git add -A`.
The ignore line has no slash now; stage named paths in a worktree anyway.

## S356 SkyThicket, 2026-10-10: Team & RACI, the first pass (#1957)

**A tab is every module that mounts in it.** Team & RACI is `raci.js` and `mission_control.js` (the Lift Off block below
the matrix); each injects its own CSS, so the pass read both. The dependency map attributes only `raci.js` to the tab, so
`ui_pass.py --wiring cobi:raci` leaves out `liftoff_state` and `kb/liftoff_plan.json`. The fix is one `MODULE_ALIASES`
entry (`"raci": ["mission_control.js"]`) in `kb/_build_cobi_admin_surface.py`; it was left out of the pass because it
regenerates shared artifacts.

**One cause can be 36 findings.** Every row's Update button was 15px tall: 36 targets under 24px, one rule. Contrast came
from four causes: a decorative token (`--text-faint`) as text, an undefined token (`--text`, whose fallback painted in
both themes), a fill (`--gold-accent`) as text, and `opacity:.72` on a row, which dims every ink inside it.

**A `role="button"` on a `<th>` erases the column header.** Sortable headers are `th scope="col"` with `aria-sort` and a
real `<button>` inside.

**The measuring engine dedupes contrast by tag and color, ignoring the background.** `scripts/a11y.js` skipped a `span` on
the dark header fill once a `span` of the same color had passed elsewhere on the page, which hid one regression the pass
introduced and then caught (the directory's check-all label). Read a changed ink against every ground it sits on, not
only what the sweep reports.

**A pass can run beside other work.** A background agent in its own worktree ran the whole pass (signed out and, with a
scratch config it did not commit, signed in) and opened its own PR; the session recorded the ledger on that branch.
Deferred: edit-mode keyboard access (clickable `<td>` cells need a button inside) and the dark focused-row highlight
(cobalt words on `--gold-soft` at 4.16:1).


## S358 SkyFern, 2026-10-10: MAP Users, the first pass (#1963)

**The signed-out sweep passed a view it never saw.** `cobi:map-users` and `cobi-dark:map-users` passed because the tab
painted its could-not-load box. S356 measured Team & RACI signed in with a scratch config it did not commit; this pass
committed the seeds instead: four targets in `a11y.config.js` (`map-users-roster`, `map-users-gaps`, each with `-dark`),
so every later pass measures the reviewer's view by name. KB note:
[`methodology-a-sweep-of-a-gated-view-measures-the-gate`](kb-notes/methodology-a-sweep-of-a-gated-view-measures-the-gate.md).

**Before, seeded:** 28 controls under 24px (roster, nudge, hide at 20px), the search box's focus ring removed by
`outline:none`, the roster table 17px and the worklist 102px past a 390px viewport, the Open link 16px. **After:** all four
pass. Controls are underlined cobalt words 18px apart; the filled Open email draft button is a word; the lens toggles keep
their fill and add `aria-pressed` and weight (a toggle in a set is outside the controls rule); each table sits in a named,
focusable region that scrolls below 560px, so the desktop sticky header still holds.

**`--on-accent` is not the ink for `--seal-blue`.** It is white in light and `#141413` in dark, while `--seal-blue` stays
`#002F6D` in both: the first cut measured 1.43:1 in dark. `--white` is the pair (eight sites already used it).

**The glyph sweep missed split labels.** `kb/_glyph_sweep.py` found one control-class emoji in `map_users.js`; there were
ten labels at eight sites, because each label sat on its own concatenated line after the `<button` line, and four were
`\u{1F...}` escapes.
`tests/map_users_first_light.test.js` reads the rendered buttons instead, and fails on the old code 14 of 16.


## S364 SkyJuniper, 2026-10-11: Implementation Funding, and the two editors' leftovers (#1991, #1992, #1994)

**Implementation Funding passed signed out and in both public views, and still had 21 small targets.** The curator's
controls never paint without a session, so `funding-curator` (both themes) stands in a fresh `CPL_SESSION` and renders
the tab again. The pass turned every boxed or filled control into an underlined word with one rule that repeats each
boxed selector and wins by order (the rules are spread over 1,100 lines of one CSS array; editing each in place would
have touched thirty). The toggles in a set keep their frames; the Internal/Public word in use is bold body text with
`aria-pressed` rather than a filled box. Two targets were not controls at all: a link inside a `<div>` sentence the
engine does not treat as inline (a `<p>` takes the exception), and two range sliders at 19.9px.

**Words wrap where boxes did not.** With the frame gone, "New scenario" broke over two lines at 390px and its second
line ran under the hint beside it. `white-space: nowrap` on the word and `flex-wrap` on its row moved the hint below
instead. Look at the narrow screenshot after a conversion; the sweep passed it.

**The leftovers were worse than "no tokens yet".** Budget's ledger line and Workplan Goals' both said the edit tints
lacked tokens. Seeded mid-save, each failed outright: 1.35:1 (Budget, dark) and 1.06:1 (Workplan Goals, light and dark,
a navy row's white text on the saving tint). KB notes: the transient-state section of
`methodology-a-sweep-sees-only-the-states-its-seed-reaches` and the state-ink section of
`methodology-a-fill-that-does-not-flip-needs-ink-that-does-not-either`. A failed save is now a red outline on a muted
ground, so the status line's words carry it and color does not stand alone.

**Generated CSS is measured by injecting it into a working copy.** Budget's editor CSS lives in
`EXHIBIT_ANALYSIS_CSS` (Rule 1). The sweep measured the page with the new block swapped in between its markers, the
page was restored, and the PR stayed code only; `daily-dashboard.yml` was dispatched after the merge.

**Seeds added this session:** `funding-curator`, `budget-editor`, `workplan-goals-editor`, `workplan-goals-add`, each
light and dark. Guards: `tests/cpl_funding_controls_first_light.test.js` (36; 6 pass on the old file),
`tests/budget_section_first_light_test.py` (3 new, all failing on the old files),
`tests/workplan_goals_editor_first_light.test.js` (12; none pass on the old file).

**Contracts (#1997): the gate, the flipping band, a chip on the browser's button face.** The signed-out sweeps measured
the register's gate. The seeded target stubs the tab's four reads with the V0718 fixture so its own `load()` paints it;
it must first set `#contracts` and wait for `CPL_CONTRACTS`, because the motion check seeds a page loaded without the
route's hash and the tab's script loads only when activated (the first cut timed out). It found the band's labels at
3.56:1 in dark (`--navy-primary` turns light; the band is now `--seal-blue` with `--white` and `--on-seal-blue-muted`),
text in the decorative `--text-faint` at 3.62:1, and a `<button>` chip with no ground of its own on Chromium's dark
button face (`#6B6B6B`) at 1.99:1. Guard: `tests/contracts_first_light.test.js` (16; 1 passes on the old file).



## S365 SkyRowan, 2026-10-11: Vision 2030, and Team & RACI's two leftovers (#2001, #2003)

**Vision 2030 (#2001): a clean sweep over a page that scrolled sideways.** `npm run a11y` passed the tab in light and dark
before any change. The `cobi` targets measure two widths, and the faults sat at the others: at 320px the grid's 300px
column floor scrolled the page 44px, and each goal bar shared a flex row with a long label that took the row, leaving the
bar 0px on a phone and 12px at 1024. Read element widths at 320 and 390 yourself. The fix is `min(300px, 100%)` and the
bar above its label with `flex: none` (in a column, `flex: 1` sets a basis of 0 and collapses a fixed 6px height). The
wiring check found the tab's two Action cards in wording no source carries; both views now read `V2030_ACTIONS`, the CPL
Workplan's own words. The goals' progress differs between the tab and the annual report; that is Open Asks Sheet 65 card 1.

**Team & RACI: a click handler on a `<td>` reaches a mouse and nothing else.** The matrix's role cells, the directory's
name, role and email cells and the nudge status word each now hold a `<button>` named for what it changes, carrying its
visible words (2.5.3). Enter and Esc in a directory input return focus to the cell's button. Seeded targets
`raci-editor`, `raci-directory` (each with `-dark`) hold a team phrase and stub `team_members` and `item_raci`; breaking
the buttons' floor on purpose failed eight targets, so the sweep measures them. The seed also holds the jump highlight at
its steady fill, which reproduced S356's deferred 4.16:1 (`--cobalt` on `--gold-soft` in dark). The fix is the token,
`#4A3A10` to `#40320E` (4.71:1): every ink on that fill in dark is light, so each gains contrast. The full `cobi-dark`
sweep fails the same 11 routes as main, none of them new. Guard: `tests/raci_ui_pass.test.js` (11 new; none pass on the
old files).

**Military Partnerships (#2004): a frame below its own breakpoint.** The tab frames the veteran map with `?embed=1`, and the
map's embed layout (fill the frame, its own title for screen readers only) starts at a 981px frame. Beside COBI's sidebar a
1280 laptop gives a 936px frame, so the map printed its own title under the tab's heading and scrolled inside the frame;
on a phone that title pushed the map below the frame's fold. The title now goes to screen readers at every width in the
embed (content 2,094px to 1,843 at 320). The frame still scrolls below 981px, as the map's CSS states: its stage is in
`vh`, so sizing the frame to its content would feed back. The paragraph's link took the browser's default ink in both
themes; a link in a static shell needs its token written on it. Guard: `tests/military_partnerships_ui_pass.test.js`.

**Noncredit & Learning Partners (#2005): a team-phrase view the sweep had never painted.** The tab's notes, artifacts
and Revise controls render only for a team-phrase holder, so the unseeded sweeps measured a tab without them. The seed
`nc-partners-editor` (with `-dark`) holds the phrase, stubs the three reads and calls the tab's `activate()` again, which
repaints and re-pulls; it found an artifact's title link 20px tall at once. The unseeded sweeps found an h1 to h3 skip,
a chip at 4.38:1 (`opacity:.85` on `--text-muted` again; opacity dims every ink inside it) and a scrolling table no
keyboard could reach. CPL Pathways is held in the ledger until Open Asks Sheet 65 card 2 rules on its record source.
