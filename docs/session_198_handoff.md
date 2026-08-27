---
title: Session 198 handoff — from SkyVerdict (Session 197)
created: 2026-08-27
updated: 2026-08-27
tags: [handoff, session-198, cpl-funding, noncredit, map-api, accessibility, auth]
kb-status: internal
obsidian-folder: cpl-project-tracker
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

## Priority workstream — the NC lane earns like credit

Sam ruled 2026-08-26 that the NC award becomes a **cap earned against three
targets**, not a display split. Factor **0.5**, same as credit (ruled 08-27).

**Build order, unchanged:**

1. **Explicit per-priority `src`** overriding prose matching.
2. **NC priorities earn** — `ncModel()` gains priorities/targets.
3. **Display** — NC line under the credit line on the college rows.

**Why 1 stays first.** `measurability()` (cpl_funding.js ~3615) resolves a metric
to its data source by **substring-matching the metric's prose**, in order:
`portal|landing page → pp_u`, then `applied → pa_u`, `eligible → pe_u`,
`transcribed → pt_u`. All three of Sam's proposed NC metrics match the **credit**
sources, and one naming the *NC landing page* matches `pp_u` **first** — the wrong
lane and the wrong milestone. With an explicit `src`, an unwired NC source is a
genuine gap that pays full cap as a **labeled advance**, which is exactly the
"temporarily shows 0/advance" behavior Sam is happy with.

**Design rulings already made — do not relitigate:** route don't split · `share`
splits the MONEY not the FTES · leakage undercounts NC and that is the incentive ·
Year-1 P3's strategy list names *"noncredit mirror courses"* (one line to move
into NC's own strategies when the lane goes live — Sam offered to do it; the
recommendation was to wait, since it moves no money today).

## Sam's list of 2026-08-27 — what I found

| # | his report | finding |
|---|---|---|
| 1 | draft-model posture | **Ruling, above.** §11 corrected. |
| 2 | "I don't see NC factor boxes, just CR" | **Correct — not built.** `ncModel()` has no priorities at all today; it is a single `clamp(λ×ncFTES, floor, cap)`. Factor boxes appear per priority, so they arrive with build step 2. |
| 3 | "I don't see NC row data under each P1/2/3" | **Correct — not built, he is ahead.** Today NC money is the far-right `NC $` column only. This is build step 3. |
| 4 | sign-in email field wouldn't accept a **click**; had to **tab** into it | ⚠️ **Real bug, and there is a tell.** Click-fails-but-tab-works is the signature of the node being destroyed and recreated under the pointer (tab focus re-finds a new node; a click does not). `reviewer_signin.js:197` reads `input.value = m.draft \|\| ""` and line 198 writes `m.draft` on every keystroke — **someone already hit re-render destroying this input and preserved the VALUE; focus was never preserved.** Start there, not at CSS. |
| 5 | "Unlock to curate doesn't respond — maybe this tab doesn't use the team phrase" | ⚠️ **His hypothesis is wrong: the funding tab DOES use the team phrase.** `unlocked()` (cpl_funding.js:556) reads `window.CPL_TEAM_PHRASE.session()`, and the tab renders `#cplFundUnlockSlot` (line 2689) into which line 6761 appends `t.unlockRow({label:"🔓 Unlock team editing"})` **only when `!unlocked()`**. So non-response is a real defect. Two leads: `stripCurateAffordances()` (line 1733) **removes `cplFundUnlockSlot` outright** in public mode; and the button is appended AFTER render, so any re-render that rewrites the auth bar destroys it. ⚠️ The exact string "Unlock to curate" does not exist in the repo — confirm with Sam which control he clicked (the header **🔒 Team** button is circled in his screenshot). |
| 6 | funding tab + COBI header accessibility / mobile; header "acts funny on zoom" | **Not audited yet.** Precedent exists and should be reused: `tests/factsheet_a11y.test.js` and `tests/public_pages_a11y.test.js` for the jsdom half, `scripts/check_public_page_layout.js` for the Chromium half (9 viewports, contrast, focus, motion). ⚠️ **Split by instrument** — jsdom has no layout engine and cannot see the zoom/reflow defect; that one needs the Chromium script. ⚠️ The funding table is wide and Rule "no horizontal scroll" applies. |

## ⭐ Sam's NC display ruling (2026-08-27) — he chose ZERO, not the advance

> *"I expect it to show what their targets are and potential earning on the NC row
> (just below the CR row) and the current earnings at 0 below those."*

So the NC row shows **target + potential earning**, and beneath it **current
earnings at 0**. He was given the alternative — full-cap advance labelled "gap",
which is what the credit lane does today for any metric `measurability()` cannot
resolve (`cpl_funding.js:3638`, `f = 1`) — and chose 0.

⚠️ **This is the ONE deliberate divergence from credit, and it has to be built on
purpose.** NC priorities must NOT take the gap branch. An unwired NC `src` has to
yield `f = 0` / status `none`, not `f = 1`.

The recommendation at the time was the advance, on the grounds that otherwise the
NC floor is meaningless until ITPI delivers. **That was over-weighted** — the
model is draft, no money is disbursing, and by the time it does the origin data
should exist. His call is the honest display and it costs nothing real now.

⭐ **SAM'S MECHANISM (2026-08-27): a SYNTHETIC 0 feed, per college, until the real
data lands.** This is better than the "third state" this handoff previously
proposed, and it deletes that complexity: give the NC metrics a real `src` whose
feed returns 0 for every college, and `earnFraction` takes the ORDINARY path —
not `gap`, not `pending`, actual 0 against a real target, so **f = 0 and $0
earned**. Exactly the display he described, and when ITPI delivers, nothing
structural changes: the number simply stops being 0.

⚠️ **The synthetic 0 must ANNOUNCE ITSELF.** A synthetic 0 and a measured 0 are
the same value; if the real feed is never wired, every college reads 0 for ever
and it will be taken as measured. Carry a flag on the feed and render it as
*awaiting NC origin data*, never a bare zero.

⚠️ **It has no consumer until the NC priorities exist**, so it ships WITH build
step 2, not before it — steps 1 and 2 are really one piece of work.

⚠️ **Settle with a mock before building:** is the NC row a SECOND TABLE ROW per
college beneath its credit row, or extra lines inside each P1/P2/P3 cell? His
wording supports the second-row reading. Do not guess.

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
