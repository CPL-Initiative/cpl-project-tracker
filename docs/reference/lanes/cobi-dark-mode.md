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

⭐ **THE PALETTE IS A TOKEN SWAP REUSING SKYVIEW'S MEASURED VALUES** — the names
already matched and `prototype/check_contrast.py` had computed every pair. One
palette across the map and the monolith.

⚠️ **`--seal-blue` IS NOT REDEFINED DARK, AND THAT IS DELIBERATE** — 65 fills
and 53 borders against 20 text uses, so flipping it rescues the wordmark and
breaks 200+ surfaces. `--seal-blue-text` carries the text grade. Guarded, because
the invisible wordmark is exactly the symptom that invites the wrong fix:
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

✅ **SkyView follows the one control as a FALLBACK, not an override.** Order:
this reader's own SkyView choice → an explicit global choice → where they stand.
Sam's ruling 3 of 2026-09-07 still owns the *default*, because the global key
reads `system` until someone picks.

## ⚠️ Open — the measured remainder

⭐ **S248 FOUND THE SHAPE OF THE REMAINDER, AND IT IS NOT "A LONG TAIL OF RAW
HEXES."** It is four kinds of token that **cannot flip**, each of which reads as
correct, tokenized code — so review cannot see them and grep does not catch them.
The four shapes, the role-count rule, why the sweep under-reports, and the guard
that could not fail are PULL, in one note:
[`methodology-a-token-that-cannot-flip-is-a-surface-that-cannot-theme`](../../kb-notes/methodology-a-token-that-cannot-flip-is-a-surface-that-cannot-theme.md).
**Read it before theming anything.** What is state, and belongs here:

✅ **Fixed in S248:** the phantom `--surface-1`/`--surface-2` pair (26 sites),
`var(--white)` as a ground (7), `--navy-*` fills carrying a fixed ink (17 →
`--on-accent`), `cip_crosswalk.js`'s own private theme (108 grounds, now on the
one control), and `our_process.js`'s contour canvas. The invariants they leave:

- ⚠️ **`--surface-1`/`--surface-2` are defined in the DARK blocks ONLY. Do not
  "complete" the pair in the light `:root`** — the fallbacks are six different
  tints, so one light value repaints six tabs. Sam's call. Guarded by
  `tests/cpl_theme.test.js`.
- **25 phantom color tokens / 83 uses remain** (`--ok` 10, `--cpl-green` 10,
  `--gold-soft` 8, `--danger` 7, `--cpl-cream` 6, `--link` 5 …) — now all INKS
  and ACCENTS, no grounds.
- ⚠️ **The other ~160 navy fills are NOT proven broken** — only where the ink
  cannot follow. Measured 551/497 INK vs 26/179 FILL. Fix what the sweep names.


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

## ⚠️ MOBILE — a floor the layout cannot go under (S248)

Sam, with a phone screenshot: *"the mobile view of COBI analytics, not easily
readable."* The dashboard was **1278px wide on a 390px screen**. ✅ **FIXED, and
mobile is now clean at 390px on every route.**

⭐ **The cause was one line that isn't there:** a grid item's default
`min-width:auto` floors the track at its min-content, and two of `.kpi-section`'s
fifteen items are not cards but blocks wrapping ~1210px tables — so the single
column could not shrink and **every card inherited that width**. ⚠️ Their
`overflow-x:auto` scrollers were already present and doing nothing, because the
box they were meant to constrain was itself 1262px. The four spellings of this
fault, how to find it in one pass, and the guard that could not fail (twice) are
PULL: [`methodology-a-floor-the-layout-cannot-go-under`](../../kb-notes/methodology-a-floor-the-layout-cannot-go-under.md).

**Measured, page scrollWidth at 390px:** dashboard **1278 → 390** · raci 782 →
390 · budget 608 → 390 · activities-projects 517 → 390 · memory 504 → 390.
Sweep: **sideways-scroll 5 → 0, viewport escapes 5 → 0.** Contrast unchanged in
both themes, so the layout work regressed neither.

⚠️ **Rule 1/2:** `.exhibit-cards-grid` and the 340px chart floors are inside the
generator-injected `EXHIBIT_ANALYSIS_CSS` markers — the generator is the source
of truth; the HTMLs are mirrored so it is live before the next cron.
Guarded by `tests/kpi_cards.test.js` (three floors, each falsified).

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

⚠️ **SWEEP THE GENERATOR'S INPUT, NOT ONLY THE HTML (S246, 2026-09-10).**
S245 swept the four College Activity filter controls in both HTMLs and left
`background:#fff` standing in `college_activity_template.html`, which
`excel_to_dashboard.py` emits verbatim — so the first cron run after the outage
put all four back. The check added in the same PR read `CPL_Dashboard.html` only
and could not see it. `cpl_theme.test.js` now guards the template too
(`GENERATED_FROM`); add any future emitted template to that list, and expect a
red artifact check after a generator repair to be latent source drift surfacing.
[`methodology-a-guard-on-generated-output-cannot-see-its-source`](../../kb-notes/methodology-a-guard-on-generated-output-cannot-see-its-source.md)

⚠️ **THE GLYPH ROW'S "401" WAS NEVER 401 ACTIONABLE** — 348 belong to
`excel_to_dashboard.py` (generator-owned, correctly refused by `--apply`) and 8
were arrows inside COURSE TITLES in one-line JSON, where any `title` key trips
the control heuristic. Findings carry `generator_owned` and `classify()` treats a
large data payload as decoration. Settled at 26 and ruled closed below.

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

**NEXT (S249):** ⚠️ **mobile is CLEAN at 390px on all 38 routes — keep it that
way**; `tests/kpi_cards.test.js` guards the three floors. Then the `--text-faint`
sites on Implementation Funding (6 findings,
~12 sites, Sam's tab — his call), then the raw dark inks the sweep names
(`#666666` 8 · `#374151` 6 · `#5A6478` 4 · `#555555` 3). Fix what the sweep
NAMES; use the structural scan only to size what is left.
**NEEDS SAM:** (1) whether `--surface-1`/`--surface-2` should get LIGHT values
too — it unifies six tabs' tints and repaints them, so it is a design call, not a
fix; (2) the funding `--text-faint` sites, which change his tab in light as well.
