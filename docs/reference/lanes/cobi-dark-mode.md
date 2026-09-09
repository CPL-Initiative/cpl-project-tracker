---
title: "COBI dark mode / the one theme control — lane state"
created: 2026-09-08
updated: 2026-09-08
tags: [reference, roadmap-lane, ui, dark-mode]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-token-with-two-jobs-cannot-be-themed]]"
  - "[[reference-ui-design-system]]"
---

# COBI dark mode / the one theme control

**What this lane is:** One control in the COBI header that sets the theme for
every tab and every window — and the token layer that makes a theme possible at
all. Sam, 2026-09-08: *"make sure we have a dark mode selector in the COBI
header ... ensure that it sets all tabs and windows using that one control."*

## Status

✅ **SHIPPED — the control, the contract, and the palette.** `cpl_theme.js` is
the single owner: a `Theme` selector in the masthead (**System · Light · Dark**),
`localStorage` key `cpl_theme`, `data-theme` on `<html>`, and a `storage`
listener so a second window follows without a reload. Loaded in `<head>` and
render-blocking on purpose — the attribute lands before first paint, so a dark
reader gets no white flash. Three states, not two, because **forcing light on an
OS-dark reader would have been a regression** against the four tabs that already
honored `prefers-color-scheme`.

⭐ **THE ASK NAMED A REAL SPLIT: there were FOUR answers to "is it dark."**
`cpl_memory.js` shipped its own button that wrote `data-theme` and **persisted
nothing** (a reload lost it, and it disagreed with every other tab meanwhile);
`map_cleanup_views.js` and `map_data_quality.js` were already correct;
`our_process.js` keyed on `@media (prefers-color-scheme:dark)` **alone**, so it
followed the OS and could not be told otherwise. The memory button is deleted,
`our_process.js` is on the contract, and only `cpl_theme.js` writes the
attribute now — asserted by `tests/cpl_theme.test.js`.

**The contract every themed component keys on** (it predates this work — three
tabs already used it):

    <html>                     → follow the OS
    <html data-theme="light">  → light, whatever the OS says
    <html data-theme="dark">   → dark,  whatever the OS says

So a component writes the media query **guarded by
`:not([data-theme="light"])`**, plus an explicit `:root[data-theme="dark"]`
rule. Dropping the guard is exactly `our_process.js`'s bug.

⭐ **THE PALETTE IS A TOKEN SWAP, REUSING SKYVIEW'S MEASURED VALUES.** The token
names already matched (`--paper`, `--text-*`, `--surface-*`, `--border*`, the
five accents), and SkyView's `body.u-dark` values were computed by
`prototype/check_contrast.py` (ink 13.9:1, body 11.0, muted 6.9, cobalt 6.5,
mustard 7.7). One palette across the map and the monolith.

⚠️ **`--seal-blue` IS NOT REDEFINED DARK, AND THAT IS DELIBERATE.** 266 uses:
mostly background fills carrying white text (the live banner, Fact Sheet
headers, TMC Builder, statewide), against 48 text uses. Flipping it rescues the
48 and turns every fill into white-on-`#7DA1D4` at 2.3:1. The token keeps the
navy; a new **`--seal-blue-text`** carries the text grade (`#002F6D` light,
`#7DA1D4` dark) and 15 genuine text uses were swept onto it. Guarded by
`tests/cpl_theme.test.js` — the invisible wordmark is the kind of symptom that
invites a future session to "fix" the token and break 200+ surfaces. Durable
note: [`methodology-a-token-with-two-jobs-cannot-be-themed`](../../kb-notes/methodology-a-token-with-two-jobs-cannot-be-themed.md).

⭐ **THE SWEEP FOUND WHAT READING THE PALETTE COULD NOT.** `npm run a11y
cobi-dark` opened at **38/38 routes failing**, six shared-chrome selectors
accounting for ~227 findings. The shared chrome is fixed; the remainder, and the
two triage defects that hid its shape, are in the section below.

✅ **HEADER CLEANUP (the second half of the ask).** Glyphs out of every header
control — the info mark and `▾` on About, the paperclip, the book, the refresh
arrow, and the confirm dialog's four status emoji (generator-side, so the daily
regen keeps them out). About and Theme now share one **drawn** caret
(a bordered triangle inheriting `currentColor`, so it is not in the accessible
name and is correct in both themes). The `Last Updated` stamp no longer claims
`flex-basis:100%`, so the masthead lost a row. The Theme select is borderless at
rest to match `.cobi-util-link` beside it.

✅ **HIGH CONTRAST STILL WORKS IN DARK.** `@media (prefers-contrast: more)` set
`--text-muted: #3A3A36` at `:root` (0,1,0); the dark palette is (0,2,0) and wins
regardless of order, so the preference was being silently dropped. A dark branch
was added — the repo claims to honor the OS preferences "for real", and that
claim has to survive a new mode.

✅ **SkyView follows the one control, as a FALLBACK not an override.** Order:
this reader's own SkyView choice → an explicit global choice → where they stand
(Sky/Globe Night, Map light). Sam's ruling 3 of 2026-09-07 owns the *default*
and still does, because the global key reads `system` until someone picks. A
`storage` listener updates an open SkyView beside COBI without a reload.

## ⚠️ Open — the measured remainder

**Dark mode is correct in the chrome and in the grounds; what is left is a
long tail of raw hexes.** Re-run `npm run a11y cobi-dark` for the live list —
and read it through `scripts/a11y_triage.js`, which now groups by COLOR PAIR.

⭐ **THE TRIAGE WAS RANKING BY THE WRONG KEY, AND THAT IS WHY THIS LANE LOOKED
LONG-TAILED WHEN IT WAS NOT.** `a11y_triage.js` grouped by SELECTOR and ranked
by route count. The largest single fault — 25 findings, 11 routes — wore 12
different selectors, one route each, so it printed as twelve
`one route — that tab's own CSS` lines at the BOTTOM of the list. Its own header
already said *"a ratio repeated exactly is ONE color, not many"*; it applied
that along the route axis only. Grouping by pair turned **193 "distinct causes"
into a handful**.

⭐ **AND A RATIO WITHOUT ITS TWO COLORS IS NOT ACTIONABLE.** `scripts/a11y.js`
computed the composited background (`worstBg`) and threw it away. It now records
`fg`/`bg` and prints `#FG on #BG`; the triage regex takes the pair as OPTIONAL,
so older saved reports still parse.

### What is left, by cause (measured 2026-09-09, S245)

1. **Raw greys that never got a token** — `#6B7280 on #151514` (11), `#4B5563`,
   `#374151`. ⚠️ **Do not sweep by grep**: `#666` has 471 uses and a handful of
   failures. Fix what the sweep NAMES.
2. **`--text-faint` carrying essential text** — `#7A7A74 on #262624` (6). The
   token's own comment says *decorative only*; the fix is `--text-muted`.
3. **Light fills that are not white** — `#FDF8EC` (6) and a literal `#ECE9E2`
   under RACI's buttons (6): the same shape, a different hex.
4. **`ctx.fillStyle` canvases are light-only by construction** — canvas ignores
   `var()`. Theming one means reading the computed token in JS and repainting on
   `cpl:themechange` (the event exists for this).
5. **19 tabs were already failing in LIGHT** before any of this (S243's item 5).

✅ **DONE this run:** every literal white ground (100 in the HTMLs + generator,
54 in consumer JS), and the fill/white-ink pairs on all four flipping accents.

⭐ **THE LAST SHARED ROOT CAUSE WAS A FILL WITH NO INK OF ITS OWN.** The team-phrase
Unlock gate painted `background:#f5f5f5` and let its text color inherit — in light
that reads deliberate, in dark it was light ink on near-white at **1.09:1**, on 7
routes. A fill that sets no color is the quietest way to break a theme.

## ⭐ Three token roles, and why there are three

| Role | Token | Light | Dark | Use it when |
|---|---|---|---|---|
| ground | `--surface-opaque` | `#FFFFFF` | `#1E1E1C` | a card/table/input surface |
| ink on a fill that **flips** | `--on-accent` | `#FFFFFF` | `#141413` | cobalt · crimson · hunter · violet |
| ink on a fill that **does not** | `--on-mustard` | `#1C1C1A` | *never redefined* | gold/mustard |

⚠️ **THE THIRD ROW IS THE ONE A FUTURE SESSION WILL GET WRONG.** `--gold-accent`
is `#E3B341` in BOTH themes, so reaching for `--on-accent` there — the obvious
move, and the one that is right for the other four fills — paints white on gold
at **1.95:1** and regresses the LIGHT theme. A fill that does not change cannot
take ink that does. Same family as `--seal-blue`, which is deliberately not
redefined dark; `tests/cpl_theme.test.js` guards all three roles.

## Measured

| Sweep | S244 | S245 |
|---|---|---|
| `npm run a11y cobi-dark` — routes | 26 | 26 |
| `cobi-dark` — **contrast findings** | 184 | **146** |
| `npm run a11y cobi` (light) — routes | 18 | **18** (no regression, all four passes) |
| glyph control-class, **ours** | "401" | **24** |

⚠️ **THE ROUTE COUNT IS TOO COARSE TO STEER BY** — a route fails on any one
finding, so 38 fixes can leave it at 26. Steer by the finding count and the
color-pair ranking. ⚠️ **`--surface-opaque` IS `#FFFFFF` in light**, which made
the ground swap provably safe: light held at 18 across every pass.

⚠️ **THE GLYPH ROW IS MOSTLY A CORRECTION.** Of the 401 reported, **348 belong to
`excel_to_dashboard.py`** (plain words there already, cleared by the next cron,
correctly refused by `--apply`) and 8 were arrows inside COURSE TITLES in
one-line JSON payloads, where any `title` key trips the control heuristic.
Findings carry `generator_owned`, the report counts the two apart, and
`classify()` treats a large data payload as decoration.

**Implementation Funding is excluded from every S245 number and untouched by
every S245 edit** — Sam worked that tab in a parallel session.

## The standing pass (Sam, 2026-09-09)

*"I want a procedure that checks and remediates each COBI surface for AA and
mobile friendly standards."* Built as [`/a11y-pass`](../../../.claude/commands/a11y-pass.md):
check → **triage** → remediate → re-measure → record.

⭐ **THE TRIAGE STEP IS THE ONE THAT WAS MISSING.** `scripts/a11y_triage.js`
collapses a saved sweep into causes, because the number of findings is not the
number of problems: this lane's first dark sweep was 38/38 routes and **511
findings that were ~227 occurrences of six shared-chrome selectors**. It reads a
saved report and never re-measures, so it is free. It ranks by **color pair
first** (one color decision, however many selectors wear it), then by blast
radius across routes — see the remainder section above for why the second axis
alone hid the biggest fault in this lane.

**Glyph state, end of S245** (`kb/_glyph_sweep.py`): **1,378 findings across 139
files — 24 control · 220 status · 794 decoration OURS**, plus 340 the generator
owns. A comment line is never a finding; this repo's ⚠️/⭐ comment style renders
to nobody and would bury the ones that do. Only the control class is mechanical
(`--apply` strips a leading glyph and its space from a label); status and
decoration are reported because removing them needs a reworded sentence or a
judgment about a legend. ⚠️ `--check` is deliberately NOT yet a CI gate — red on
day one trains everyone to ignore it. It becomes one when the control class
reaches zero, and it now counts only what a session can actually fix.

**NEXT:** the raw greys (item 1 of the remainder) and `--text-faint` carrying
essential text (item 2) — between them ~17 of the 146. Fix what the sweep NAMES;
`#666` has 471 uses and a handful of failures.
**NEEDS SAM:** the 24 remaining control-class marks are judgment, not mechanics —
the ⭐/★ **MAP Star** and **Veteran Star** designations (12 sites, where the mark
arguably IS the name), `✕` close, `✎` edit, `⛔` gates, `⚠` flagged rows. Sam's
rule says a crucial mark becomes a muted CO-blue one rather than an emoji; which
of these are crucial is his call. The SkyView fallback ordering still stands as
the other judgment worth his veto.
