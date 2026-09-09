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
cobi-dark` (a new target — the same 38 routes with the theme switched) opened at
**38/38 routes failing**, and six shared-chrome selectors accounted for ~227 of
the findings: the rail's tabs, the rail wordmark, the auth line, the To-Do
button, First Light's button, and every `h2`/`h3`. Root causes, not routes:
`--navy-primary` / `--navy-secondary` are **literals, not `var()` aliases**, so
they did not follow `--text-strong`; two buttons paired a themed `--cobalt` fill
with a hard-coded `#fff` (**2.65:1**); and three raw hexes sat in shared chrome.

⚠️ **FIXING THE RULE YOU FOUND IS NOT FIXING THE RULE THAT APPLIES.** `.cpl-tab
{color:#666}` was corrected and the sweep still reported **1.74:1 on all 38
tabs** — because `.cpl-sidebar .cpl-tab {color:#444}` is more specific and is
the rule that actually paints the rail. Only re-reading the second sweep caught
it.

⚠️ **AND THE SWEEP'S OWN REGEX HAD TWO BUGS, BOTH CAUGHT BY RE-READING THE
DIFF.** `color:` also ends `border-color:`, so the first pass rewrote **20
border declarations** into the text grade; and text on an explicit fill
(the mustard alpha chip, `background:#fff` cells) is not text on the ground —
the on-dark grade reads 1.9–2.4:1 there. Both reverted; the final sweep is 15
sites, every one verified to sit on the page ground or on `--surface-opaque`.

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

**Dark mode is shipped and correct in the chrome; it is not finished in the
panes.** What remains is per-tab and is *measured*, not guessed — re-run
`npm run a11y cobi-dark` for the current list.

1. **Hard-coded light fills inside tab panes.** The pattern is
   `background:#fff` (or a light hex) on a card/cell, which stays a white island
   on the night ground and drags its text's contrast with it. The Workplan Goals
   cells are the worked example and they are **generator-emitted** — so the fix
   is in `excel_to_dashboard.py`, never the HTML (Rule 1).
2. **`ctx.fillStyle`/`strokeStyle` canvases are light-only by construction** —
   canvas ignores `var()` as an invalid color, so a token there silently keeps
   the previous style. The KPI trend chart paints its own `#F4F2ED` ground and
   is correct as a light chart; making it themed means reading the computed
   token in JS and repainting on `cpl:themechange` (the event exists for this).
3. **The `--cobalt` fill/text split is only half done.** `--on-accent` was added
   and applied to the two shared-chrome buttons; the other ~140 `--cobalt` fills
   still pair with a hard-coded `#fff` and will read ~2.65:1 in dark wherever a
   pane paints one.
4. **19 tabs were already failing `npm run a11y cobi` in LIGHT** before any of
   this (S243's item 5 — `our-process` is six faults from two tokens,
   `pipeline` ten). Those are the same lane's work and unchanged by this run.

⭐ **THE LAST SHARED ROOT CAUSE WAS A FILL WITH NO INK OF ITS OWN.** The team-phrase
Unlock gate painted `background:#f5f5f5` and let its text color inherit — in light
that reads deliberate, in dark it was light ink on near-white at **1.09:1**, on 7
routes. A fill that sets no color is the quietest way to break a theme.

## Measured, end of Session 244

| Sweep | Before | After |
|---|---|---|
| `npm run a11y cobi-dark` | 38 routes failing (every route) | **26** |
| `npm run a11y cobi` (light) | 19 routes failing (S243) | **17** |

Light **improved** rather than regressed: `.cpl-tab` went `#666` → `--text-muted`
(5.13:1 → 6.02:1) and the rail's auth line `#5a6478` → `--text-muted`
(5.32:1 → 6.02:1). The Theme control itself introduces **no fault in either
theme** — checked by name against both sweeps.

Every guard in `tests/cpl_theme.test.js` was verified by REVERTING its fix, one
at a time: redefining `--seal-blue` dark, dropping `our_process.js`'s light
guard, making `system` pin the resolved value, and removing the `storage`
listener each fail exactly their own checks and nothing else.

## The standing pass (Sam, 2026-09-09)

*"I want a procedure that checks and remediates each COBI surface for AA and
mobile friendly standards."* Built as [`/a11y-pass`](../../../.claude/commands/a11y-pass.md):
check → **triage** → remediate → re-measure → record.

⭐ **THE TRIAGE STEP IS THE ONE THAT WAS MISSING.** `scripts/a11y_triage.js`
groups a saved sweep by selector and ranks by BLAST RADIUS, because the number of
findings is not the number of problems: this lane's first dark sweep was 38/38
routes and **511 findings that were ~227 occurrences of six shared-chrome
selectors**. Run against that same report it reproduces all six, in the order
they should be worked, in a second — against the two manual re-reads it actually
took. It reads a saved report and never re-measures, so it is free.

**Glyph baseline, 2026-09-09** (`kb/_glyph_sweep.py`): **1,549 findings across
139 files — 516 control · 225 status · 808 decoration**. A comment line is never
a finding; this repo's ⚠️/⭐ comment style renders to nobody and would bury the
841 that do render. Only the control class is mechanical (`--apply` strips a
leading glyph and its space from a label); status and decoration are reported
because removing them needs a reworded sentence or a judgment about a legend.
⚠️ `--check` is deliberately NOT yet a CI gate — red on day one trains everyone
to ignore it. It becomes one when the control class reaches zero.

⚠️ **This supersedes the named glyph exceptions.** CLAUDE.md's presentation rules
list 📋 To-Do, 🧭 guidance and ⚖️ Governance as approved and "the ceiling, not a
precedent"; Sam's 2026-09-09 instruction is *"remove all emoji glyphs and if any
are crucial replace with a muted glyph using white and CO blue as default"*, so
those three are now in scope as muted CO-blue marks rather than emoji.

**NEXT:** work item 3 (mechanical, and it is the largest remaining source of
dark faults), then item 1 in the generator. **NEEDS SAM:** nothing — he asked
for the control and the control is in. The SkyView fallback ordering is the one
judgment call worth his veto.
