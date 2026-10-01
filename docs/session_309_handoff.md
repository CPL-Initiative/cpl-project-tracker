---
title: Session 309 handoff — Sierra reads where credit comes from; check her answers
date: 2026-09-30
session: the Sierra credit-source session (ran beside S305 to S307, no number of its own)
tags: [handoff, sierra, sierra-retrieval-corpus, disposition-grain, military-split, suppression]
status: current
superseded: true
superseded_by: session_311_handoff.md
---

# You are Session 309

Your moniker is **SkyCensus**. You pick up the **Sierra credit-source lane**. The funding chain
(S305 SkyLatch → S306 SkyRivet → S307 SkyGusset) ran beside this session; its handoff landed first as
[`session_308_handoff.md`](session_308_handoff.md) (SkyBracket, the Reporting box). The two lanes are
siblings: **whichever checkpoints next takes the next free number** (`ls docs/session_*_handoff.md`),
never an existing one. If Sam's greeting names a funding task, read 308 instead and confirm with him.

## First, in this order

1. **Sam checked Sierra's Chaffey answer on v74 and confirmed it (2026-09-30, about 18:55 UTC):** *"Sierra's
   Chaffey answer looks right now."* The live rows it reads (college_id 9): **18,066** units applied to
   plans; non-military **17,392** from 1,177 students; military **674** from 123, all in exhibits under 10
   students each. Next, ask the same question for **City College of San Francisco** (college_id 30), where 32
   military exhibits each carry 10 or more students (10,201 military units on plans) and show one by one.
2. The one open data question: MAP's two views disagree by 5% on applied in plan (171,078 articulation
   view, 162,603 student view, 26 colleges). It is Pedro's (MAP custom reports lane). Draft the ask for
   Sam to send if he wants it.

## Sam's decisions this run

- Sheet `NT56gHRViNX9ZYnRg8r1KR`, all seven items: 1 fix, 2 do, 3 hand to the funding lane, 4 and 5
  build, 7 draft the Training rule after the data ships. Item 6, his words: *"I want Sierra to total
  for everyone using real numbers but when the totals (at any level) are below 10, to show "<10" on
  the views. This should happen without a governance gate."*
- "Go ahead with items 4 and 5": the production steps, including the Sierra deploy.
- "Paste the layout rule into Training": he added it himself when the guard blocked the insert.
- "Don't do anything with cpl-program-records": it was cloned in case it helped; leave it.

## What shipped

- **#1777** `map_college_credit_summary` tests the students behind **each** figure (8 colleges had
  published transcribed units from under 10 students), adds applied-in-plan and a `withheld` list, and
  builds `map_college_credit_statewide` (real totals). My College shows "<10 students" for a withheld
  figure.
- **#1779** `map_college_credit_bucket` (military / non-military) and `map_college_exhibit_credit`
  (per college and exhibit: units, students, credit recommendations, "<10 each" roll-ups), rebuilt
  nightly inside `map_promote_custom_reports()`, each raising on its own property check. MAP's
  `CPLTypeCode` now rides into the exhibit title tables.
- **#1780** Sierra reads all of it (v74). Preview A/B run 36748245380: no regressions.
- **#1781**, **#1784** lane files. Receipts: `kb/receipts/map_college_credit_*_2026-09-30.sql`.

## Read in order

1. [`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md), section *Where
   applied and transcribed credit comes from*.
2. [`student_detail_load_lessons.md`](student_detail_load_lessons.md), the 2026-09-30 section.
3. [`methodology-the-floor-belongs-to-each-figure`](kb-notes/methodology-the-floor-belongs-to-each-figure.md)
   and the new partition section of
   [`methodology-small-cell-suppression-must-survive-subtraction`](kb-notes/methodology-small-cell-suppression-must-survive-subtraction.md).
4. `cpl_memory` tags `sierra`, `disposition-grain`, `military-split` (Rule 8).

## Patterns that worked

- A decision sheet before building: seven verdicts in one reply, and item 6 changed the design.
- Dry-run every rebuild as a read-only CTE, then apply with a receipt holding the before definition.
- Preview A/B (`cpl-chat-preview-ab.yml`) before `cpl-chat-deploy.yml` with `confirm=DEPLOY`.

## Safety patterns

- ⚠️ **The SQL guard denies sessions INSERT and UPDATE on `sierra_guidance` and `sierra_feedback`**
  (and `do` blocks). A Training change goes to Sam as text to paste; `cpl_memory` is the one carve-out.
- ⚠️ A withheld figure is never zero and never derived by subtraction. Suppression lives in the SQL
  builds, never in Sierra's wording.
- ⚠️ Never infer a unit split from counts of articulated exhibits (Chaffey: 110 against 77 by count;
  95% and 0% by units).
- ⚠️ `tests/lift_ts` cannot strip `as any`; use typed declarations. Helpers after
  `buildCreditContext`, which the district test splices by position.
- ⚠️ Do not coordinate with the funding sessions unless Sam asks.

## Carryover

- The funding lane's question: does applied FTES count Needs Action credit? Chaffey's `pa_u` 19,020
  against 18,066 on the plan (`cpl_memory` `summary-applied-includes-needs-action-articulated-2026-09-30`).
- **The smoke check is red, and not from v74.** The push run after #1780 (36750388001) failed only 7c's
  quick-list position (the table began at about character 1,786 of a 1,800 window; production failed
  the same assertion in the A/B before the deploy). The re-run (36758190827) passed that assertion (948)
  and failed two retrieval probes on the anon key's 3 s statement timeout instead: 7p's nonsense-phrase
  control and 7c's `program_typical_courses` (0 rows). Measured at 18:45 UTC as service role:
  `program_typical_courses` 4.2 s, `search_college_programs` 1.7 s. That is the To-Do item
  `s303-fable-chat-smoke-watch` failing again, so root-cause the catalog timeout there. Sierra's own
  answers still passed in both runs.
- `cpl-chat-preview` stays deployed by design (the A/B redeploys it each run).
- Not refreshed: `kb/README.md`, `README.md` (no structure change); the Pipeline tab (did not move).
