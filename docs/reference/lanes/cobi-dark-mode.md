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

⭐ **THE ASK NAMED A REAL SPLIT: there were FIVE answers to "is it dark."**
`cpl_memory.js` had its own button that persisted **nothing**; two tabs were
already correct; `our_process.js` keyed on the media query **alone**, so it
followed the OS and could not be told otherwise; and `cip_crosswalk.js` (found
S248) kept its own button, key and class-gated palette — invisible for four
rounds because it used **neither** spelling anyone grepped for. Only
`cpl_theme.js` decides now, asserted by `tests/cpl_theme.test.js`, whose general
form is the durable one: **no tab may keep theme state of its own.**

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

⭐ **THE SWEEP FOUND WHAT READING THE PALETTE COULD NOT** — it opened at 38/38
routes, six shared-chrome selectors being ~227 findings. ⚠️ **But it is not
sufficient either**: it reports only what it PAINTS, so a tab that builds content
on demand reads clean while both its panes are white. Pair it with the structural
scan — see the note linked below.

✅ **HEADER CLEANUP · HIGH CONTRAST IN DARK.** Glyphs out of every header
control; About and Theme share one **drawn** caret (out of the accessible name,
correct in both themes). `@media (prefers-contrast: more)` set `--text-muted` at
`:root` (0,1,0) against the dark palette's (0,2,0), so the preference was
silently dropped until a dark branch was added.

✅ **SkyView follows the one control, as a FALLBACK not an override.** Order:
this reader's own SkyView choice → an explicit global choice → where they stand
(Sky/Globe Night, Map light). Sam's ruling 3 of 2026-09-07 owns the *default*
and still does, because the global key reads `system` until someone picks. A
`storage` listener updates an open SkyView beside COBI without a reload.

## ⚠️ Open — the measured remainder

⭐ **S248 FOUND THE SHAPE OF THE REMAINDER, AND IT IS NOT "A LONG TAIL OF RAW
HEXES."** It is four kinds of token that **cannot flip**, each of which reads as
correct, tokenized code — so review cannot see them and grep does not catch them.
The four shapes, the role-count rule, why the sweep under-reports, and the guard
that could not fail are PULL, in one note:
[`methodology-a-token-that-cannot-flip-is-a-surface-that-cannot-theme`](../../kb-notes/methodology-a-token-that-cannot-flip-is-a-surface-that-cannot-theme.md).
**Read it before theming anything.** What is state, and belongs here:

- ✅ **Phantom `--surface-1`/`--surface-2` — FIXED**, 26 sites, 19 of 128
  findings. Defined in the **DARK blocks only**: light keeps each site's own
  tint, so no light pixel moved. ⚠️ **Do not "complete" the pair in the light
  `:root`** — the fallbacks are six different tints, so one light value repaints
  six tabs. Sam's call. Guarded by `tests/cpl_theme.test.js`.
  **25 phantom color tokens / 83 uses remain** (`--ok` 10, `--cpl-green` 10,
  `--gold-soft` 8, `--danger` 7, `--cpl-cream` 6, `--link` 5 …) — now all INKS
  and ACCENTS, no grounds.
- ✅ **`var(--white)` as a ground — FIXED**, 7 sites. `.project-card` and
  `.activity-kpi-card` were **Sam's first screenshot**.
- ✅ **`--navy-*` fills carrying a fixed ink — FIXED**, 17 sites → `--on-accent`.
  Measured first: **551/497 INK vs 26/179 FILL**. ⚠️ **The other ~160 navy fills
  are NOT proven broken** — only where the ink cannot follow. Fix what the sweep
  names.
- ✅ **`cip_crosswalk.js`, the FIFTH answer to "is it dark" — FIXED.** Own
  button, own `cipx_theme` key, 108 grounds gated on its own class. Now reads
  `CPL_THEME.effective()`, writes through `.set()`, follows `cpl:themechange`.
- ✅ **`our_process.js`'s contour canvas — FIXED.** Drew once under
  `prefers-reduced-motion`; the first listener `cpl:themechange` has ever had.


### Named, measured, and deliberately NOT fixed

- **`--text-faint` (#7A7A74, 3.87:1) carrying essential text on Implementation
  Funding** — 6 findings, ~12 sites (`cplfund-src`, `-card-note`, `-goal-cite`,
  `-foot`, `-repnote`, `-saving`). S245 did this pass everywhere else; the tab
  was excluded because Sam was working it. **`--text-muted` is the fix** (6.9:1);
  it changes light too, on his tab, so it is his call.
- **Raw dark inks on dark grounds** — `#666666` (8), `#374151` (6), `#5A6478` (4),
  `#555555` (3). Latent-or-painted varies; fix what the sweep names.
- **Printing while in dark mode.** The masthead is fixed, but consumer-JS dark
  rules still apply to a print, so a dark-mode print is dark-on-dark in places.
  The real fix is `@media screen` scoping on every dark rule — a separate pass.
- **221 raw light-hex grounds** remain (index.html 68 in hand-maintained CSS,
  tmc_builder 42, credential_reference 31, unified_courses 31). ⚠️ **Not a
  worklist** — many are data payloads, generator-owned, or unpainted.

⚠️ **TWO PROCEDURE RULES FROM THIS RUN, in the note above:** the sweep
UNDER-REPORTS (Annual Report showed 2 findings with both panes white — content
built on demand is not sampled), and a screenshot must be checked against `main`
before it is chased (Sam's third was a **cached asset**; the fix had merged five
commits earlier, and `git merge-base` settled it in two minutes — the sandbox
cannot reach the Pages site, so check git, not the URL).

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

| Sweep | S244 | S245 | **S248** |
|---|---|---|---|
| `npm run a11y cobi-dark` — routes | 26 | 26 | **20** |
| `cobi-dark` — **contrast findings** | 184 | 120 | **87** (−32% from 128) |
| `npm run a11y cobi` (light) — routes | 18 | 18 | **18** |
| `cobi` (light) — contrast findings | — | — | **62** (baseline 63) |
| `npm test` | — | 316/316 | **321/321** |
| glyph control-class, **ours** | "401" | **26** | 26 (ruled, untouched) |

⚠️ **S245's 120 EXCLUDED Implementation Funding; S248's numbers INCLUDE it** —
the like-for-like start of this run is **128**, measured, not carried over. Say
which sweep a number came from or the next session cannot tell a regression from
a widened scope.

⭐ **THE LIGHT BASELINE WAS MEASURED, NOT ASSUMED.** S248 built a `git worktree`
at `origin/main` and swept it: **63 findings / 18 routes**. Against 62 / 18 after
40-odd edits, that is the proof the light theme did not move — and it cost two
minutes. *"Light held at 18"* was previously an inference from the route count,
which is too coarse to carry that claim.

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
is for now."*** ⚠️ **RULED, not pending — do not sweep them.** The list and the
reasoning are in `CLAUDE.md`'s presentation rules, verbatim; restating it here is
how the two copies drift.

✅ **THE BANNER'S 8-HOUR CAP IS RULED SUFFICIENT** (*"8 hours is enough."*) — a
session outliving its own banner is intended.

## The standing pass (Sam, 2026-09-09)

*"I want a procedure that checks and remediates each COBI surface for AA and
mobile friendly standards."* Built as
[`/a11y-pass`](../../../.claude/commands/a11y-pass.md) — check → **triage** →
remediate → re-measure → record. **The command is the authority**; it carries the
triage rationale, the per-class remedies and the glyph mechanics, and restating
them here is how two copies drift.

⭐ **TRIAGE RANKS BY COLOR PAIR FIRST**, then blast radius — one color decision
however many selectors wear it. It reads a saved report, so it is free.

**NEXT (S249):** the `--text-faint` sites on Implementation Funding (6 findings,
~12 sites, Sam's tab — his call), then the raw dark inks the sweep names
(`#666666` 8 · `#374151` 6 · `#5A6478` 4 · `#555555` 3). Fix what the sweep
NAMES; use the structural scan only to size what is left.
**NEEDS SAM:** (1) whether `--surface-1`/`--surface-2` should get LIGHT values
too — it unifies six tabs' tints and repaints them, so it is a design call, not a
fix; (2) the funding `--text-faint` sites, which change his tab in light as well.
