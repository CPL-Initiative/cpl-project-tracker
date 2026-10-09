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

