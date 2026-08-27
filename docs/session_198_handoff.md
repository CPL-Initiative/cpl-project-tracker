---
title: Session 198 handoff — from SkyVerdict (Session 197)
created: 2026-08-27
updated: 2026-08-27
tags: [handoff, session-198, map-api, custom-report, cpl-funding, noncredit, itpi]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 198

SkyVerdict here. Session 197 was two systems telling us plainly what was wrong
while we read neither of them. Two PRs landed (#1358, #1359). Nothing is
half-finished; what remains is Pedro's, Sam's, and one clearly-scoped build.

## Read these, in this order

1. **`docs/cpl_funding_lessons.md`**, last section — the noncredit design and
   the thing blocking it. Start here; the next build is in it.
2. **`docs/map_custom_reports_lessons.md`**, last section — the outage story.
3. `CLAUDE.md` §11 — the **MAP Custom Reports** and **Implementation Funding** rows.
4. `docs/kb-notes/methodology-a-metric-matched-by-its-prose-mis-measures-once-a-second-lane-exists.md`
   — ⚠️ **read before touching NC priorities.** It is the blocker.

## What shipped

**#1358 — the loader now reads MAP's own verdict.** The nightly load failed
three nights (24/25/26 Aug) reporting a duplicate/missing `viewName`, while MAP
was answering `400 "View_StudentDetailsCredits_APIDataset is not Valid"` in
`responseMessage` — a field nothing read. Sam found it in one manual pull.

- ⚠️ **One invalid view in a batch relabels a NEIGHBOUR's dataset**, so the name
  that vanished belonged to a *healthy* view. Three nights of diagnosis pointed
  at the wrong one. Do not trust `viewName` when a duplicate is present.
- ⚠️ **`dataCount` is MAP's CLAIM, not a row count** — an empty dataset
  advertised "204,491 rows" for three nights.
- ⭐ **Printing is unconditional, FAILING is opt-in (`--strict`).** The daily
  dashboard shares this fetcher and consumes none of the affected views; failing
  by default would have dropped the public dashboard over data it never reads.

**#1359 — `_effective()` and `scripts/funding_effective.js`.** Sam: *"Never rely
on the config."* I read a stored Year-2 `factor` of 1 from **live** Supabase and
reported it; the model uses **0.5** because `mirrorYears` makes that block
unreachable. The harness refuses to run without a config, flags each year
MIRRORED/CARRYOVER, and has an `--nc-sweep` mode.

## Priority workstream — the NC lane earns like credit

**Sam ruled this 2026-08-26.** The NC award becomes a **cap earned against three
targets** (the credit three, origin-filtered), not a display split.

⛔ **BUILD ORDER IS FIXED, and the first step is not optional:**

1. **An explicit per-priority `src`** that overrides text matching.
2. NC priorities earn.
3. Display: NC line under the credit line on the college rows.

**Why 1 comes first.** `measurability()` resolves a metric to its data source by
**substring-matching the metric's prose**. All three of Sam's NC metrics match
the **credit** sources, and one naming the NC landing page matches `pp_u` first.
The NC lane would be silently measured against credit performance — real
numbers, plausible percentages, nothing on screen saying so. This also kills the
"it's a money no-op today" argument, which assumed an unmeasurable metric would
fall through to a labeled gap. It would not.

**Design rulings already made — do not relitigate:**

- ⭐ **Route, don't split.** Each unit earns in exactly one lane by origin, and
  still counts three times *inside* its lane: eligible/applied/transcribed are
  three milestones on one credit. **`share` splits the MONEY, not the FTES.**
- ⚠️ **The credit lane already invites noncredit in** — Year-1 P3's strategy list
  names *"noncredit mirror courses"*. One line to remove when NC goes live.
- ⚠️ **Leakage undercounts NC rather than double-paying**, and Sam considers that
  the incentive to route students through the NC landing page.
- ✅ **RULED 2026-08-27: NC keeps factor 0.5**, same as credit. Base SCFF rate is
  $12,423/CPL FTES, so a floored NC institution needs **8.0 CPL FTES** over the
  window. The binding constraint is origin capture, not difficulty. ⚠️ Do not
  vary the factor *within* NC — credit is uniform 0.5 deliberately.

## Carryover — not ours

| # | item | status |
|---|---|---|
| 1 | **Pedro corrects the student-detail view overnight 2026-08-26.** A self check-in is armed for **14:05 UTC 2026-08-27** to read the 13:40 run. If it fails, the log now carries MAP's own words — read them, don't infer. Two likely causes: the view was **renamed** (one string in `REQUEST_PAYLOAD`; ask for the new name) or a **gate** blocked on a shape change (report the numbers, never loosen it). | armed |
| 2 | **Origination LocID** — Pedro has the ask; it takes longer. ⚠️ The open question is whether a **college** can have a second, noncredit landing page with its own LocID, or only standalone entities like NOCE/SDCCE. That decides whether this reaches ~108 colleges or a handful. | with ITPI |
| 3 | **NC floor** — still Sam's. $50,000 leaves 30 of 33 on it, break-even 3,909 FTES. `--nc-sweep` has the table; **$60k is infeasible**. Dropping the threshold does not work at this pool (parity is only +$406k). | open |
| 4 | **Sam's phone check** — Fact Sheet and the Sierra/Veteran-map pages. Both rows moved to `docs/reference/finished_workstreams.md`; the item is in `kb/cpl_todos.json`. | open |

## Patterns that worked

- **Read the source's own verdict before inferring one.** My byte arithmetic was
  correct and my conclusion from the labels was wrong. One manual pull beat it.
- **Check the matcher before adding the second lane.** The `measurability()`
  finding cost one file read and happened before any code was written, which is
  the only reason it is a note and not an incident.
- **Verify a tool against independently-recorded numbers.** The harness
  reproduces 30-of-33, break-even 3,909, $25,240,308 — figures `CLAUDE.md` held
  before it existed. Self-consistency proves nothing.
- **Build the fixture as a trap.** Year 2 carries deliberately different values
  from Year 1, so transcribing storage and asking the model give different
  answers — and then run it again with the mirror off.

## Safety patterns to honor

- ⚠️ **Never read the funding config and report it** — call `_effective()`,
  `_alloc()`, `_nc()`. `mirrorYears`, front-load, `priorityOrder` and the
  per-browser SCENARIO overlay can each make a stored value inert or mislabeled.
- ⚠️ **`--strict` belongs only to the Supabase load.** Do not add it to
  `daily-dashboard.yml`.
- **Restart the branch onto `main` as the LAST STEP OF MERGING**, and clear the
  stale remote-tracking ref in the same breath.
- Stop-hook nags after a squash-merge are false positives; a nag about genuinely
  uncommitted work is not. Check `git status` before dismissing one.

## Moniker

I took **SkyVerdict** — the day was reading actual verdicts instead of inferring
them. Yours is open: take what Sam's greeting names, or coin your own.

**Next is Session 199 — `docs/session_199_handoff.md`.**
