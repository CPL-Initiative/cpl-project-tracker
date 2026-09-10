---
title: "COBI dark mode / the one theme control — lane state"
created: 2026-09-08
updated: 2026-09-10
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
render-blocking on purpose, so the attribute lands before first paint and a dark
reader gets no white flash. Three states, not two: **forcing light on an OS-dark
reader would have been a regression** against the tabs already honoring
`prefers-color-scheme`.

**The contract every themed component keys on** (it predates this work):

    <html>                     → follow the OS
    <html data-theme="light">  → light, whatever the OS says
    <html data-theme="dark">   → dark,  whatever the OS says

So a component writes the media query **guarded by
`:not([data-theme="light"])`**, plus an explicit `:root[data-theme="dark"]`
rule. Dropping the guard was `our_process.js`'s bug.

⭐ **NO TAB MAY KEEP THEME STATE OF ITS OWN** — the durable form of the rule,
asserted by `tests/cpl_theme.test.js`. The ask uncovered **five** answers to
"is it dark": `cpl_memory.js` persisted nothing, `our_process.js` keyed on the
media query alone, and `cip_crosswalk.js` kept its own button, key and
class-gated palette — invisible for four rounds because it used **neither**
spelling anyone grepped for. All now defer to `cpl_theme.js`.

⚠️ **`--seal-blue` IS NOT REDEFINED DARK, AND THAT IS DELIBERATE** — 65 fills
and 53 borders against 20 text uses, so flipping it rescues the wordmark and
breaks 200+ surfaces. `--seal-blue-text` carries the text grade. Guarded,
because the invisible wordmark is the symptom that invites the wrong fix:
[`methodology-a-token-with-two-jobs-cannot-be-themed`](../../kb-notes/methodology-a-token-with-two-jobs-cannot-be-themed.md)

⚠️ **`@media (prefers-contrast: more)` NEEDS ITS OWN DARK BRANCH.** It set
`--text-muted` at `:root` (0,1,0) against the dark palette's (0,2,0), so the
reader's preference was silently dropped until one was added.

⚠️ **THE SWEEP REPORTS ONLY WHAT IT PAINTS** — a tab that builds content on
demand reads clean while both its panes are white. It opened at 38/38 routes
with six shared-chrome selectors worth ~227 findings, so it is necessary; it is
not sufficient. Pair it with the structural scan and the token probe below.

✅ **SkyView follows the one control as a FALLBACK, not an override.** Order:
this reader's own SkyView choice → an explicit global choice → where they stand.
Sam's ruling 3 of 2026-09-07 still owns the *default*, because the global key
reads `system` until someone picks.

## ⚠️ Open — the measured remainder

⭐ **THE REMAINDER IS NOT "A LONG TAIL OF RAW HEXES."** It is four kinds of
token that **cannot flip**, each of which reads as correct, tokenized code — so
review cannot see them and grep does not catch them. The four shapes, the
role-count rule, why the sweep under-reports, and the guard that could not fail
are PULL, in one note:
[`methodology-a-token-that-cannot-flip-is-a-surface-that-cannot-theme`](../../kb-notes/methodology-a-token-that-cannot-flip-is-a-surface-that-cannot-theme.md).
**Read it before theming anything.** Cleared so far — all four classes:

- ✅ **Phantom tokens — CLEARED**, 47 tokens / 88 uses (26 in S248, 62 in S249),
  defined in the **DARK blocks only** so light keeps every site's own fallback.
  S249's values are **aliases, never new hexes** — inks → `--hunter` /
  `--crimson` / `--mustard-text` / `--text-muted`, grounds → `--surface-subtle`
  / `--surface-muted` / `--surface-opaque` / `--gold-soft`, borders →
  `--border`; worst new pair 4.93:1 against AA 4.5, computed with
  `prototype/check_contrast.py`. ⚠️ **Do not "complete" any of them in the
  light `:root`** — `--surface-1`/`--surface-2`'s fallbacks alone are six
  different tints, so one light value repaints six tabs. Sam's call. Guarded.
- ✅ **`var(--white)` as a ground — CLEARED**, 7 sites (Sam's first screenshot).
- ✅ **Fixed ink on a fill that flips — CLEARED**, 17 `--navy-*` sites (S248)
  plus `--danger` ×2 and `--accent-link` ×2 (S249), all → `--on-accent`.
  ⚠️ **The other ~160 navy fills are NOT proven broken** — only where the ink
  cannot follow. The class is greppable, so `tests/cpl_theme.test.js` scans
  every consumer JS for it rather than waiting for the sweep to sample it.
- ✅ **Tabs holding their own theme state — CLEARED** (`cip_crosswalk.js`,
  `our_process.js`); both key on `cpl_theme.js` now.

⚠️ **THE ENTRY CONDITION FOR A DARK-ONLY DEFINITION IS "EVERY USE CARRIES A
FALLBACK," AND IT IS THE WHOLE SAFETY ARGUMENT.** Without one, light gets
nothing and dark gets a value, which is a change light never asked for. That is
why `--brand`/`--link`/`--text` are held below rather than swept.

### Named, measured, and deliberately NOT fixed

- **`--text-faint` (#7A7A74, 3.87:1) carrying essential text on Implementation
  Funding** — 6 findings, ~12 sites (`cplfund-src`, `-card-note`, `-goal-cite`,
  `-foot`, `-repnote`, `-saving`). S245 did this pass everywhere else; the tab
  was excluded because Sam was working it. **`--text-muted` is the fix** (6.9:1);
  it changes light too, on his tab, so it is his call.
- ⭐ **`--brand` · `--link` · `--text` — 24 declarations that resolve to
  NOTHING, in both themes (found S249).** `college_briefing.js` writes
  `background:var(--brand)` and `border-left:4px solid var(--brand)` with no
  fallback and no definition anywhere, so the whole declaration is invalid and
  the property falls back to its initial value: the `.cb-bfrac>i` progress bar
  is transparent and the `.cb-lead`/`.cb-next` accent borders do not draw. This
  is **not** a theming defect and the dark-only rule does not apply to it —
  fixing it changes what LIGHT looks like, so it is Sam's call, same as
  `--text-faint` below. Sizes: `--brand` 14 · `--link` 6 · `--text` 4.
- **Raw dark inks on dark grounds** — `#666666` (8), `#374151` (6), `#5A6478` (4),
  `#555555` (3). Latent-or-painted varies; fix what the sweep names.
- **Printing while in dark mode.** The masthead is fixed, but consumer-JS dark
  rules still apply to a print, so a dark-mode print is dark-on-dark in places.
  The real fix is `@media screen` scoping on every dark rule — a separate pass.
- **221 raw light-hex grounds** remain (index.html 68 in hand-maintained CSS,
  tmc_builder 42, credential_reference 31, unified_courses 31). ⚠️ **Not a
  worklist** — many are data payloads, generator-owned, or unpainted.

⭐ **S249 PUT A NUMBER ON "THE SWEEP UNDER-REPORTS," AND IT IS THE WHOLE
FINDING COUNT.** The 21-token fix moved the dark sweep **66 → 67** — measured
both ways on the same tree with `git stash`, not inferred. The diff of the two
finding lists is EMPTY in one direction: not one of the 62 phantom uses was
ever being sampled, so none could be reported fixed. The single extra line is
`map_data_quality`'s primary button, which the sweep simply had not sampled on
the earlier run (it is a pre-existing fixed-ink defect, now fixed).

⚠️ **SO A FINDING COUNT CANNOT BE THE ACCEPTANCE TEST FOR A TOKEN-LAYER FIX** —
`.cplccr` chips, `.cplmem` cards, `.mtq` items, `.tphx` cards and `.grx` boxes
are all built on demand, and a surface the sweep never paints contributes
neither a finding nor a fix. **Prove the token layer directly instead:** load
both themes and read `getComputedStyle(document.documentElement)` for each
token. 21/21 resolved to the intended value in dark and were unset in light —
which is also the strongest available proof that no light pixel moved, stronger
than the sweep, which merely agreed (63 → 63, byte-identical lists).
⚠️ **Falsify the probe too.** Its first version could not fail: it compared the
light value against `""` after an `|| "(unset)"` coalesce, so every token read
BAD while the data underneath was perfect. Defining `--cpl-cream` in the light
`:root` now flips it to BAD, as it should.

⚠️ **TWO PROCEDURE RULES FROM THIS RUN, in the note above:** the sweep
UNDER-REPORTS (Annual Report showed 2 findings with both panes white — content
built on demand is not sampled), and a screenshot must be checked against `main`
before it is chased (Sam's third was a **cached asset**; the fix had merged five
commits earlier, and `git merge-base` settled it in two minutes — the sandbox
cannot reach the Pages site, so check git, not the URL).

## ⚠️ MOBILE — a floor the layout cannot go under (S248)

✅ **FIXED — clean at 390px on every route.** The dashboard had been 1278px wide
on a 390px screen (raci 782 · budget 608 · activities-projects 517 · memory
504, all now 390). Sweep: sideways-scroll 5 → 0, viewport escapes 5 → 0, and
contrast unchanged in both themes.

⭐ **THE CAUSE IS A LINE THAT ISN'T THERE:** a grid item's default
`min-width:auto` floors its track at min-content, so two `.kpi-section` items
wrapping ~1210px tables held the whole single column open and every card
inherited the width — while their `overflow-x:auto` scrollers sat there doing
nothing, because the box they were meant to constrain was itself 1262px. The
four spellings of the fault, how to find them in one pass, and the guard that
could not fail (twice) are PULL:
[`methodology-a-floor-the-layout-cannot-go-under`](../../kb-notes/methodology-a-floor-the-layout-cannot-go-under.md).

⚠️ **Rule 1/2:** `.exhibit-cards-grid` and the 340px chart floors live inside
the generator-injected `EXHIBIT_ANALYSIS_CSS` markers — change the generator;
the HTMLs are mirrored so it is live before the next cron. Guarded by
`tests/kpi_cards.test.js` (three floors, each falsified).

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

| Sweep | S244 | S245 | S248 | **S249** |
|---|---|---|---|---|
| `cobi-dark` — **contrast findings** | 184 | 120 | 87 | **67** |
| `cobi` (light) — contrast findings | — | — | 62 | **63** |
| `npm test` | — | 316/316 | 321/321 | **321/321** |
| glyph control-class, ours | "401" | 26 | 26 | 26 (ruled, untouched) |

⚠️ **SAY WHICH SWEEP A NUMBER CAME FROM, AND WHETHER THE SCOPE MOVED.** S245's
120 excluded Implementation Funding (Sam was working that tab); S248's include
it, so S248's like-for-like start was **128**, measured rather than carried
over. Without the provenance the next session cannot tell a regression from a
widened scope. The 401 glyph figure is the same trap: 348 of them belong to
`excel_to_dashboard.py`, where plain words already stand.

⚠️ **STEER BY THE FINDING COUNT, NEVER THE ROUTE COUNT** — a route fails on any
one finding, so 38 fixes can leave it unchanged, and the count is not even
stable run to run (22 vs 21 on identical code). ⚠️ **AND THE FINDING COUNT IS
NOT AN ACCEPTANCE TEST FOR A TOKEN-LAYER FIX**: S249's 21-token fix moved dark
**66 → 67** with an empty diff in one direction, because none of the 62 phantom
uses was ever being sampled. Prove the token layer directly instead — load both
themes and read each token off `getComputedStyle(documentElement)`. That is
also the strongest available proof that light did not move.

⚠️ **MEASURE THE LIGHT BASELINE, DO NOT INFER IT.** A `git stash` or a
`git worktree` at `origin/main`, swept both ways, costs two minutes and turns
"light held" from an inference into a byte-identical finding list.

⚠️ **SWEEP THE GENERATOR'S INPUT, NOT ONLY THE HTML (S246).** S245 swept the
four College Activity filter controls in both HTMLs and left `background:#fff`
standing in `college_activity_template.html`, which `excel_to_dashboard.py`
emits verbatim, so the first cron run put all four back — and the check added
in the same PR read `CPL_Dashboard.html` only and could not see it.
`cpl_theme.test.js` guards the template now (`GENERATED_FROM`); add any future
emitted template to that list.
[`methodology-a-guard-on-generated-output-cannot-see-its-source`](../../kb-notes/methodology-a-guard-on-generated-output-cannot-see-its-source.md)

✅ **THE GLYPH SWEEP IS CLOSED AT 26** and **THE BANNER'S 8-HOUR CAP IS
SUFFICIENT** — both Sam's rulings of 2026-09-09; the glyph list and its
reasoning live verbatim in `CLAUDE.md`'s presentation rules, and restating them
here is how two copies drift.

## The standing pass (Sam, 2026-09-09)

*"I want a procedure that checks and remediates each COBI surface for AA and
mobile friendly standards."* Built as
[`/a11y-pass`](../../../.claude/commands/a11y-pass.md) — check → **triage** →
remediate → re-measure → record. **The command is the authority**; it carries the
triage rationale, the per-class remedies and the glyph mechanics, and restating
them here is how two copies drift.

⭐ **TRIAGE RANKS BY COLOR PAIR FIRST**, then blast radius — one color decision
however many selectors wear it. It reads a saved report, so it is free.

**NEXT (S250):** ⚠️ **mobile is CLEAN at 390px on all 38 routes and all four
cannot-flip classes are cleared — keep both that way**; `tests/kpi_cards.test.js`
and `tests/cpl_theme.test.js` hold the guards. What is left is (a) the raw dark
inks the sweep NAMES (`#666666` 8 · `#374151` 6 · `#5A6478` 4 · `#555555` 3),
(b) the raw LIGHT grounds under them (`#8F8F8E`, `#F1F5F9`, `#F6F2FD`,
`#F7F9FC` all appear as backgrounds in dark-mode findings), and (c) printing
while in dark mode, which wants `@media screen` scoping on every dark rule and
is its own pass. Fix what the sweep NAMES; use the structural scan only to size
what is left, and the token probe to prove a token-layer fix landed.

**NEEDS SAM:** (1) whether `--surface-1`/`--surface-2` should get LIGHT values
too — it unifies six tabs' tints and repaints them, so it is a design call, not
a fix; (2) the funding `--text-faint` sites, which change his tab in light as
well; (3) ⭐ **the 24 `var(--brand)` / `var(--link)` / `var(--text)`
declarations that resolve to NOTHING in both themes** — College Briefing's
progress bar is transparent and its accent borders do not draw. Fixing it is
correct but changes what light looks like, so it is his call like (1) and (2).
