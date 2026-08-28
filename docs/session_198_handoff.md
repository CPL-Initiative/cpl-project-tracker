---
title: Session 198 handoff — from SkyVerdict (Session 197)
created: 2026-08-27
updated: 2026-08-27
tags: [handoff, session-198, cpl-funding, noncredit, map-api, accessibility, auth]
kb-status: internal
obsidian-folder: cpl-project-tracker
superseded: true
superseded_by: session_203_handoff.md
---

# You are Session 198

SkyVerdict here. Session 197 shipped three PRs (#1358–#1360) and then Sam came
back with a six-item list plus **one posture ruling that changes how you read the
rest of this file.** Start with that ruling; it reframes the noncredit work.

## ⭐ Sam's ruling on draft-model posture (2026-08-27) — read first

> *"When evaluating our funding model functions or strategies, don't worry if we
> are missing a data element (like the NC CollegeID). I am aware that it will
> temporarily show 0 (or wrong values). The model is in draft form until I say
> otherwise, so we have the freedom to build it pending all needed data
> delivery — freedom to play to pay. I expect to see the values calculate
> correctly based on the available data — it should not be viewed as a flaw in
> our design."*

**So: a missing upstream field is not a blocker and not a defect.** Build the
mechanism, let the number be 0 or absent, keep going. Session 197 flagged the NC
lane **⛔ BLOCKED**; that framing was wrong and has been corrected in §11.

⚠️ **But note precisely what it does and does not cover**, because the two halves
of his sentence point different ways. He is fine with *0 or missing*. He also says
he expects values to **calculate correctly on the data available**. The
`measurability()` finding is not a missing-data case — it produces a **plausible
wrong number that looks right** (NC metrics reading CREDIT performance). So it
stays a correctness requirement and stays FIRST in the build order — not as a gate
on starting, but as the first thing built.

## Priority workstream — BUILD STEP 2: make the NC lane earn

This is the whole plan in one place, with the reasoning, because it was settled
across a long conversation on 2026-08-26/27 and none of it should be re-derived.

### What it is

Today `ncModel()` is a single `clamp(λ × ncFTES, floor, cap)` — an allocation by
size, with no priorities and no earning. **Sam ruled it should EARN like credit:**
the award becomes a **cap earned against three targets**, the same three the
credit lane uses, filtered to students who originated from noncredit.

### The three decisions that constrain it

| decision | ruling |
|---|---|
| **Earns or displays?** | **EARNS.** Chosen over "allocated, split for display only". |
| **Factor** | **0.5, same as credit.** No discount for the newer lane. Base rate $12,423/CPL FTES → a floored NC institution needs **8.0 CPL FTES** over the window, a capped one 16.1. ⚠️ Do NOT vary it *within* NC — credit is uniform 0.5 deliberately. |
| **What it shows before data** | **Targets + potential earning on the NC row, current earnings at 0 beneath.** Explicitly NOT the full-cap advance the credit lane gives an unmeasurable metric. |

### How the zero happens — Sam's mechanism, and why it is the good one

⭐ **Add the expected NC LocID column to the Supabase dataset now, all NULL, and
calculate off it.**

> *"Since all will be null for now, we can calculate off that until the real data
> hits."*

`"applied units WHERE nc_origin_loc_id IS NOT NULL"` is **honestly 0 today** — a
real result over a genuinely empty column. So:

- **Nothing is synthetic.** This is his own *"calculate correctly based on the
  available data"*, not a placeholder standing in for it.
- **Nothing to remember to remove.** A synthetic feed must later be deleted; a
  NULL column just fills up.
- **Zero-change cutover.** The same query returns real values the day ITPI
  populates it — no feed swap, no code edit.
- ⭐ **The disclosure becomes DERIVABLE**: `count(*) WHERE nc_origin_loc_id IS NOT
  NULL` = 0 across the table **is** the evidence nothing is delivering yet. A
  measurement, not a flag someone maintains.

⚠️ Put the column on **BOTH** `map_student_credit` and `map_college_cr_unit` —
without the second, NC earning can only ever be computed at student grain. (This
is also exactly what was asked of ITPI.)

⚠️ **It is decoupled from the loader and safe:** the field is not requested from
MAP yet, so the nightly pipeline is untouched and Postgres fills NULL. It can land
ahead of ITPI. But it IS a write to a live student-grain table on shared ground —
a deliberate step, never a side effect.

### Build order, and why step 1 cannot be skipped

1. **Explicit per-priority `src`.** `measurability()` resolves a metric to its data
   source by **substring-matching the metric's prose** (`portal|landing page →
   pp_u`, then `applied → pa_u`, `eligible → pe_u`, `transcribed → pt_u`). All
   three NC metrics match the **CREDIT** sources, and one naming the *NC landing
   page* matches `pp_u` **first** — wrong lane, wrong milestone. That is not a
   missing number, it is a **plausible wrong one that renders as right**, which is
   the one thing Sam's draft-model ruling does not permit.
2. **NC priorities earn**, reading the NULL column. Steps 1 and 2 are really one
   piece of work — the column has no consumer until the priorities exist.
3. **Display**: the NC row beneath the credit row.

⚠️ With an explicit `src` pointing at a real-but-empty column, `earnFraction`
takes the **ordinary** path — not `gap`, not `pending`; actual 0 against a real
target — so **f = 0, $0 earned**, which is exactly what Sam asked for. **No third
earn state is needed**; an earlier draft of this handoff proposed one and it is
retired.

### Standing design rulings — do not relitigate

- ⭐ **Route, don't split.** Each unit earns in exactly ONE lane by origin, and
  still counts three times *inside* its lane, because eligible/applied/transcribed
  are three MILESTONES on one credit. **`share` splits the MONEY, not the FTES.**
- ⚠️ **Leakage undercounts NC rather than double-paying** — a NC student who uses
  the credit door is counted once, in credit. Sam's read: that is precisely the
  incentive to route students through the NC landing page.
- ⚠️ **Year-1 P3's strategy list names *"noncredit mirror courses"***, so today
  this is a single dip in the WRONG lane. One line to move into NC's own
  strategies when the lane goes live — Sam offered to do it; the recommendation
  was to wait, since it moves no money today.

### Open, and needing Sam before or during the build

- **Is the NC row a SECOND TABLE ROW per college, or extra lines inside each
  P1/P2/P3 cell?** His wording ("just below the CR row", "under each P1,2,3")
  supports the second row. ⚠️ **Settle with a mock — do not guess.**
- **Shares for the NC three.** Nothing has been ruled. Inheriting credit's
  34/33/33 is the obvious default and keeps one number to change, but he has not
  said so.

## ⚠️ Scheduled runs are being DROPPED, and there is no alarm

**On 2026-08-27 every daily cron in this repo failed to fire.** Not late — dropped.

| workflow | due (UTC) | last actually ran |
|---|---|---|
| Daily CPL Dashboard | 06:17 · 09:17 · 12:17 | Aug 26, 13:25 |
| MAP Users sync | daily | Aug 26, 13:42 |
| CPL News harvest | 13:17 | Aug 26, 14:06 |
| Credential catalog sync | 13:20 | Aug 26, 14:06 |
| MAP Custom Report load | 13:40 | Aug 26, 14:22 |

The 3-hourly `cpl-chat-health` probe also skipped ~4 windows (00:43 → 14:04).
**Manual dispatch and push-triggered CI both work** — it is specifically GitHub's
`schedule` delivery that is degraded.

⭐ **This is already documented in the repo.** `daily-dashboard.yml`'s own comment:
*"GitHub's scheduled trigger is best-effort: it routinely delays this repo's cron
by 1.5–4h and occasionally DROPS a run entirely (no failed run, none queued)."*
The 3-cron ladder is the existing mitigation; today all three rungs were dropped,
so the mitigation was defeated rather than absent. **Nothing to fix in our code.**

**Sam wants an alarm — and explicitly NOT on the COBI header.** Design, agreed but
NOT BUILT:

1. ⭐ **A dropped run leaves no failed run and nothing queued**, so silence and
   success are indistinguishable and GitHub has nothing to notify on. The alarm
   must MANUFACTURE a failure.
2. **Piggyback it on a workflow that still fires** — `cpl-chat-health` (every 3h)
   gets ~8 chances a day where a daily job gets one.
3. **FAIL when a sibling is overdue.** A red run notifies; a warning in a log
   nobody reads is what we already have.
4. ⚠️ **Derive the expected interval from the actual `cron:` expressions**, never
   a hand-maintained list — a list that must be kept in sync with the workflows
   goes stale silently (the ESL hand-listed-institutions lesson).
5. ⚠️ Do not let it cry wolf. A 1.5–4h delay is NORMAL here; the threshold has to
   be "missed every window in its ladder", not "late".

**Deliberately not built at the end of Session 197**, after that session shipped a
guard built on an unchecked assumption and caused a one-day outage. An alarm built
the same way either cries wolf or stays silent.

## Engineering carryover

- ⚠️ **The 13:40 UTC MAP load did NOT fire on 2026-08-27.** At 14:30 the workflow
  still showed `total_count: 14`, newest run 14 (08-26). Prior deliveries landed
  14:17–14:25, so this is past the window, not early. **I dispatched it manually
  (`workflow_dispatch` on `main`, 204 queued) — read that run.** If the schedule
  keeps skipping, that is its own defect; GitHub cron is best-effort but three
  data points of ~14:22 then nothing is worth watching.
- **Pedro corrected `View_StudentDetailsCredits_APIDataset` overnight** (his word,
  08-26). The dispatched run is the first test. If it fails, the log now carries
  MAP's own `responseCode`/`responseMessage` per dataset — **read them, do not
  infer.** Two likely causes: the view was **renamed** (one string in
  `REQUEST_PAYLOAD`; ask Pedro for the new name) or a **gate** blocked on a shape
  change (report the numbers; never loosen a gate).
- **Origination LocID** — with ITPI, takes longer. ⚠️ Open question only they can
  answer: can a **college** hold a second, noncredit landing-page LocID, or only
  standalone entities (NOCE/SDCCE)? That decides ~108 colleges vs a handful.
- **NC floor** — still Sam's. $50,000 → 30 of 33 floored, break-even 3,909 FTES.
  `node scripts/funding_effective.js --config live.json --nc-sweep 15000,25000,50000,60000`.
  **$60k is infeasible.** Dropping the threshold fails at this pool: parity is only
  +$406k, which across all 111 institutions buys a **$16,216** floor.
- Sam's phone check on the Fact Sheet and Sierra/veteran-map pages — **he said
  2026-08-27 he will do this next session**, so keep it on the list (both rows now
  in `docs/reference/finished_workstreams.md`; the item is in `kb/cpl_todos.json`).

## Tools you now have

- **`node scripts/funding_effective.js --config <file>`** — what the model USES.
  **Refuses to run without a config**; dump it with the Supabase MCP
  (`select config from cpl_funding_config where id='default'`). Flags each year
  MIRRORED / CARRYOVER and prints the stored index beside the screen ordinal.
- **`_effective()` / `_nc()`** on `window.CPL_FUNDING_TAB`.
- **`--strict`** on `fetch_custom_report.py` (the Supabase load only — the daily
  dashboard deliberately does not pass it).

## Safety patterns to honor

- ⚠️ **Never read the funding config and report it** — call `_effective()`,
  `_alloc()`, `_nc()`. `mirrorYears`, front-load, `priorityOrder` and the
  per-browser SCENARIO overlay each make stored values inert or mislabeled.
- ⚠️ **A missing measurement may render as 0; a WRONG one must never render as
  right.** That is the line Sam's draft-model ruling draws.
- ⚠️ **Verify with the instrument that can see the defect** — jsdom cannot see
  layout, so item 6's zoom bug needs Chromium.
- **Restart the branch onto `main` as the LAST STEP OF MERGING**, clearing the
  stale remote-tracking ref in the same breath.
- Stop-hook nags after a squash-merge are false positives; one about genuinely
  uncommitted work is not. Check `git status` before dismissing.

## Moniker

I took **SkyVerdict** — the day was reading actual verdicts instead of inferring
them. Yours is open.

**Next is Session 199 — `docs/session_199_handoff.md`.**
