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
`cpl_memory.js` had its own button that wrote `data-theme` and **persisted
nothing**; two tabs were already correct; `our_process.js` keyed on
`@media (prefers-color-scheme:dark)` **alone**, so it followed the OS and could
not be told otherwise. Only `cpl_theme.js` writes the attribute now — asserted
by `tests/cpl_theme.test.js`.

**The contract every themed component keys on** (it predates this work — three
tabs already used it):

    <html>                     → follow the OS
    <html data-theme="light">  → light, whatever the OS says
    <html data-theme="dark">   → dark,  whatever the OS says

So a component writes the media query **guarded by
`:not([data-theme="light"])`**, plus an explicit `:root[data-theme="dark"]`
rule. Dropping the guard is exactly `our_process.js`'s bug.

⭐ **THE PALETTE IS A TOKEN SWAP, REUSING SKYVIEW'S MEASURED VALUES** — the names
already matched, and `prototype/check_contrast.py` had computed them (ink 13.9:1,
body 11.0, muted 6.9, cobalt 6.5, mustard 7.7). One palette across both.

⚠️ **`--seal-blue` IS NOT REDEFINED DARK, AND THAT IS DELIBERATE.** 266 uses,
mostly background fills carrying white text, against 48 text uses: flipping it
rescues the 48 and turns every fill into white-on-`#7DA1D4` at 2.3:1.
**`--seal-blue-text`** carries the text grade instead. Guarded — the invisible
wordmark is exactly the symptom that invites a future session to "fix" the token
and break 200+ surfaces.
[`methodology-a-token-with-two-jobs-cannot-be-themed`](../../kb-notes/methodology-a-token-with-two-jobs-cannot-be-themed.md)

⭐ **THE SWEEP FOUND WHAT READING THE PALETTE COULD NOT.** `npm run a11y
cobi-dark` opened at **38/38 routes failing**, six shared-chrome selectors
accounting for ~227 findings. The shared chrome is fixed; the remainder, and the
two triage defects that hid its shape, are in the section below.

✅ **HEADER CLEANUP (the second half of the ask).** Glyphs out of every header
control; About and Theme share one **drawn** caret (a bordered triangle
inheriting `currentColor`, so it stays out of the accessible name and is correct
in both themes); the `Last Updated` stamp no longer claims `flex-basis:100%`.

✅ **HIGH CONTRAST STILL WORKS IN DARK.** `@media (prefers-contrast: more)` set
`--text-muted` at `:root` (0,1,0); the dark palette is (0,2,0) and wins whatever
the order, so the preference was silently dropped until a dark branch was added.

✅ **SkyView follows the one control, as a FALLBACK not an override.** Order:
this reader's own SkyView choice → an explicit global choice → where they stand
(Sky/Globe Night, Map light). Sam's ruling 3 of 2026-09-07 owns the *default*
and still does, because the global key reads `system` until someone picks. A
`storage` listener updates an open SkyView beside COBI without a reload.

## ⚠️ Open — the measured remainder

**Dark mode is correct in the chrome and in the grounds; what is left is a
long tail of raw hexes.** Re-run `npm run a11y cobi-dark` for the live list —
and read it through `scripts/a11y_triage.js`, which now groups by COLOR PAIR.

⭐ **THE TRIAGE WAS RANKING BY THE WRONG KEY.** `a11y_triage.js` grouped by
SELECTOR and ranked by route count, so the largest fault — 25 findings, 11
routes, 12 selectors at one route each — printed as twelve
`one route — that tab's own CSS` lines at the BOTTOM. Its own header already
said *"a ratio repeated exactly is ONE color, not many"*; it applied that on the
route axis only. Grouping by pair turned **193 "causes" into a handful**.

⭐ **A RATIO WITHOUT ITS TWO COLORS IS NOT ACTIONABLE.** `a11y.js` computed the
composited background (`worstBg`) and discarded it. It now records `fg`/`bg` and
prints `#FG on #BG`; the triage regex takes the pair as OPTIONAL, so older
reports still parse.

### What is left, by cause (measured 2026-09-09, S245)

1. **Light fills that are not white** — `#FDF8EC` under the signed-out gate (6),
   a literal `#ECE9E2` under RACI's buttons (6), `#FFFFFF on #D6D6D0` (4), and
   `#ECE9E2 on #FFFFFF` still on the akpi cards (5). Same shape as the white
   grounds, different hexes.
2. **Raw greys in files the sweep does NOT name** — 18 more `#6b7280`, plus
   `#374151`, in `credential_reference` · `sierra_training` · `unified_courses`
   and others. ⚠️ **Latent, not pending**: they either sit on an explicit fill,
   where a lighter grey is the WRONG direction, or are not painted in the
   measured state. Fix them when a sweep names them, never by grep — `#666`
   alone has 471 uses and a handful of failures.
4. **`ctx.fillStyle` canvases are light-only by construction** — canvas ignores
   `var()`. Theming one means reading the computed token in JS and repainting on
   `cpl:themechange` (the event exists for this).
5. **19 tabs were already failing in LIGHT** before any of this (S243's item 5).

✅ **DONE this run:** every literal white ground (100 in the HTMLs + generator,
54 in consumer JS); the fill/white-ink pairs on all four flipping accents;
`--text-faint` where it carried essential text (RACI's legend, count and auth
hint; the annual report's column headers); and the `#6b7280` / `#555` / `#4b5563`
greys **at the sites the sweep named**.

⚠️ **EVERY GREY SWEEP HAD A SITE THAT MUST NOT MOVE, AND THE SPLIT WAS THE JOB.**
`#555` is 69 uses of which **5 are ours** — the other 64 are inside the
regenerated Activity KPI section, so the generator's 12 emission sites carry them
(Rule 1) and a hand-edit would have been undone by the next cron.
`project_lifecycle.js` paints `background:#6b7280;color:#fff` on the archived-state
badge, and one `#4b5563` sits on `background:#f3f4f6` — text on an explicit fill,
where a lighter token is the wrong direction. **A match count larger than the
fault you set out to fix is a signal, never a windfall**: four times this run
(20 border declarations in S244, course-title data, that badge, those 64).

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
| `cobi-dark` — **contrast findings** | 184 | **120** |
| `npm run a11y cobi` (light) — routes | 18 | **18** (no regression, all eight passes) |
| glyph control-class, **ours** | "401" | **26** |

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

✅ **THE GLYPH SWEEP IS CLOSED AT 26 — Sam, 2026-09-09: *"Keep all 26 glyphs as
is for now."*** What remains after the control-class work is the MAP Star and
Veteran Star designations (12 sites), `✕` close, `✎` edit, `⛔` gates, `⚠`
flagged rows, the copy control, and arrows carrying sequence meaning
(*open → reported → in progress → fixed → verified*). ⚠️ **RULED, not pending** —
none of the 26 is an emoji, so his instruction is satisfied. Sweeping them
repeats the `⇄` error above at twenty-six times the scale.

✅ **THE BANNER'S 8-HOUR CAP IS RULED SUFFICIENT** (*"8 hours is enough."*) — a
session outliving its own banner is intended.

## The standing pass (Sam, 2026-09-09)

*"I want a procedure that checks and remediates each COBI surface for AA and
mobile friendly standards."* Built as [`/a11y-pass`](../../../.claude/commands/a11y-pass.md):
check → **triage** → remediate → re-measure → record.

⭐ **THE TRIAGE STEP IS THE ONE THAT WAS MISSING.** `scripts/a11y_triage.js`
collapses a saved sweep into causes — the first dark sweep was 511 findings that
were ~227 occurrences of six selectors. It reads a saved report, so it is free.
It ranks by **color pair first** (one color decision, however many selectors wear
it), then by blast radius; the remainder section above says why the second axis
alone hid this lane's biggest fault.

**Glyph state, end of S245** (`kb/_glyph_sweep.py`): **26 control · 220 status ·
794 decoration OURS**, plus 340 the generator owns and the next cron clears. A
comment line is never a finding — this repo's ⚠️/⭐ comment style renders to
nobody. Only the control class was ever mechanical, and Sam has now closed it at
26 (above). ⚠️ `--check` is NOT a CI gate and will not become one while those 26
stand by his ruling.

**NEXT:** the light fills that are not white — `#FDF8EC` under the signed-out
gate, the literal `#ECE9E2` under RACI's buttons, the akpi cards. Fix what the
sweep NAMES.
**NEEDS SAM:** nothing. Both open questions were ruled on 2026-09-09 — the 26
glyphs stay, the 8-hour banner cap is enough. The SkyView fallback ordering
remains the one judgment worth his veto if he ever revisits it.
