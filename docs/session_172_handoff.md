---
title: Session 172 handoff — staging is loaded; reconcile, then swap
created: 2026-08-19
updated: 2026-08-19
tags: [handoff, session-172, map-api, custom-report, student-detail, reconciliation, supabase, swap]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/map_custom_report_load]]"
  - "[[docs/map_custom_reports_lessons]]"
  - "[[docs/session_171_handoff]]"
superseded: true
superseded_by: session_174_handoff.md
---

# Session 172 handoff

You are **Session 172**. Session 171 was **SkyLoad**: the two new MAP Custom
Report views are **loaded, reconciled, live, and on the nightly cron with no
human in the loop** (§A). **Both of Sam's open questions are settled** (§B), and
the transcription defects have a follow-up list (§B3). The Delta/SJCOE lane is
**still untouched** — it has now carried across three handoffs (§C).

⚠️ **Sam frequently runs several sessions at once.** Check `git log origin/main`
before assuming your branch is the only work in flight.

---

## Read in this order

1. **`cpl_memory` FIRST** (Rule 8), tags `map-api` / `custom-report` /
   `student-detail` / `reconciliation`. Three rows were written this run and
   they are the findings, not the summary.
2. [`docs/map_custom_report_load.md`](map_custom_report_load.md) — **the runbook.
   It is the job.** SQL 1 is the gate; SQL 2–4 are the swap.
3. [`docs/map_custom_reports_lessons.md`](map_custom_reports_lessons.md) §
   2026-08-19 (later still) — the whole story.
4. `CLAUDE.md` §11 → **MAP Custom Reports** row.

---

## What shipped (#1251–#1254, all merged)

A loader (`kb/_sync_map_custom_reports.py`), staging tables, a committed test,
a dispatch-only workflow and the runbook. **Both views now load, and staging is
populated** — dispatch `MAP Custom Report load (staging)` again any time to
refresh it.

**Nothing live has changed.** The swap is deliberately a separate gated SQL step.

**#1252 was the gate working.** Reconciling staging against live caught a defect
in the loader itself: `_clean()` mapped `""` to `None`, while the live table
*stores* `""` (414 `catalog_year`, 348 `exhibit_id`, 196,044 `college_course`,
619 `source_code`). A swap would have changed the representation of blankness on
~200k rows during a refresh, and `count(distinct catalog_year)` silently went
9 → 8 — which first read as a missing catalog year. **A load must reproduce its
source, not improve it.** When a loader replaces an existing table, diff the
*representation*, not only the counts.

Sam's field definitions, which are what made this loadable rather than guessable:

| field | what it is | stored as |
|---|---|---|
| `Status` | the **articulation approval stage**, e.g. `Initiator` — a MAP approval-cascade role | `status` |
| `CPLStatusPlan` | the **action taken** on the CR — the disposition. Already held | `cpl_status_plan` |
| `CPLPlanStatus` | **not a status**: the **lifecycle checks**, several at once, pipe-delimited | `cpl_plan_status`, verbatim |

---

## §A · Done. It is live, and it runs itself nightly.

**The load is live and on the cron** — daily 13:40 UTC, fetch → staging →
`map_promote_custom_reports()` → live, one transaction, no human. Sam,
2026-08-19: *"This will run in the daily cron so just making sure I don't have to
do a staging to live approval every day."* An unattended end-to-end run has
completed: `map_college_cr_unit` 211,005, `map_student_credit` 591,820, 47,804
students, both aggregates rebuilt in the same transaction.

The per-college reconciliation was run first and both anomalies are explained.
Do not re-litigate it; read it.

**Dataset B (student grain) is unambiguously clean.** *No* college decreased.
591,820 rows · **47,804 distinct students** (live 42,346) · surrogate dense
1..47,804 with **zero nulls**, so the privacy tripwire passes · Needs Action
units **1,125,873** (live 1,053,333) · 112 colleges vs 111.

**Dataset A had two colleges going down and the cause is a catalog-year
roll-forward, not deletions.** Only 2 of 112 fell — both RCCD, college 2 (−493)
and Moreno Valley (−192). Statewide, *every older year shrinks and every newer
year grows*: 2022-23 −116 · 2023-24 −610 · 2024-25 +620 · 2025-26 +2,437 ·
2026-27 **+3,978**. Rows are re-keyed forward; those two net negative only
because forward growth didn't offset older-year losses.

⚠️ **That has a consequence beyond this swap: the catalog-year axis is
MUTABLE.** Last year's figure changes when you re-pull, so a year-over-year
comparison built from two different pulls compares two different partitions of
the same rows. Say so wherever catalog year is used as a time dimension.

### Before you swap — the two things that are not counts

### The headline moved, and now moves nightly

| measure | was | now |
|---|---:|---:|
| dormant units, **published** | 1,051,870 | **1,183,569** (+12.5%) |
| dormant units, unsuppressed | 1,052,531 | 1,184,787 |
| already articulated + waiting, **published** | 63,991 | **72,501** (+13.3%) |
| already articulated + waiting, unsuppressed | 64,074 | 72,584 |
| distinct students | 42,346 | 47,804 (+12.9%) |
| suppressed colleges | 13 | 14 |

⚠️ **A correction worth carrying:** a `+6.9%` figure was reported mid-session and
was measured on the **student grain**, not the published one. The canonical pair
is `map_college_cr_unit` scoped `entity_kind='college'`, and the number policy
says **quote the pair, never one half alone**.

These now change on every nightly run. That is Sam's decision, not a drift.

---

## §B · Both questions are SETTLED — do not re-open them

Sam ruled on both, 2026-08-19. They are recorded in `cpl_memory` as **verified**
with him named. Read them; do not re-derive them.

**Transcribed = UNITS, never the tick.** *"Transcribed refers to the whole
student record even though it is stamped on CR rows. Only when transcribed units
are present we count those as transcribed and the others are ignored."*
It needed **no code change** — every published figure already sums units, and the
only reader of `cpl_plan_status` is the clean-up worklist, which uses it to
*find* the defect. `transcribed-means-units-not-the-tick`.

⚠️ **The grain is planned to change.** Sam, same message: transcribed check marks
on CR rows are coming, *"not ready yet."* So constant-within-student — 47,804 of
47,804 today — is a **current** fact, not a permanent one.
**Re-measure that test before trusting the student-grain assumption again**, and
revisit `map_cleanup_worklist` + `map_transcribed_gap`, which both depend on it.

**The 55% applied fork is RETIRED; the ruling stands.** *Publish both and name
the gap* remains; the figure does not. `applied_credits` is identical to
`articulated_credits` on **all 462,355 Needs Action rows**, so unscoped it
measures whether credit *exists*. Scoped to rows marked Applied the two agree to
**0.1%** (30,055 vs 30,091 students). The old row is superseded **on Sam's
explicit instruction**, which is what Rule 8 requires for a human-sourced row.

### Two facts worth carrying, neither of them a question

- **`Status` is 91.2% blank** (539,894 of 591,820 — empty string, not null), top
  value **`Implementation` (45,302)**, not `Initiator` (2,918). Four non-null
  values exist. **It cannot be a facet** — a chart on approval stage would
  describe 8.8% of rows while looking like it described all of them.
- **`CPLPlanStatus` holds six checks, not two** — CPL Docs 477,287 · Transcribed
  82,235 · Ed Plan 45,529 · Analysis 36,489 · Counselor 23,106 · **Student**
  20,457, over 41 combinations, with inconsistent delimiting (29,902 rows are a
  bare `Transcribed`, no pipe). Split-and-strip; never assume a trailing
  delimiter.

---

## §B2 · The clean-up worklist is LIVE — `map_cleanup_worklist`

Sam asked whether the analysis would "turn up a prioritized clean up list for the
team to follow up on." It did, and it is a live reviewer-gated view that rebuilds
itself off the nightly load. Read
[`docs/map_cleanup_worklist.md`](map_cleanup_worklist.md) — it is the authority.

**Ranked by DECISIONS, not rows**, with an `effort_shape` per class:

| P | class | size | shape |
|---|---|---|---|
| 1 | recommendations that cannot yield credit | 17,594 rows, ~100 colleges, **0 units** | **one rule** |
| 2 | plan says Transcribed, no units recorded | 14,348 rows / 4,196 students | 2a **upstream**, 2b per row |
| 3 | marked Applied with zero applied units | 413 rows, 10 colleges | per row |
| 4 | articulations waiting on approval | **2,225 articulations**, ~45 colleges | per row, named owner |

⚠️ **P2 is the biggest by rows and the smallest by effort — 94% is Los Angeles
Pierce (1,842 students, 73% of its own) and Merced (1,787).** Two conversations,
and it is an ingest gap, not curation: the credit was recorded, the unit amounts
never landed.

⚠️ **Initiator is 1,026 articulations across only NINE colleges** — a stalled
queue at a handful of institutions, not a statewide condition.

⚠️ **Clearing P1 raises every disposition rate without awarding a unit**, because
it shrinks the denominator. Legitimate, but say so when the rate moves.

### Customer Success — addresses supplied, access NOT granted

Sam gave the three addresses on 2026-08-19. All are **`@theinfotechpartners.com`
— ITPI**, the same external domain as Pedro Campos, so Customer Success is an
ITPI-staffed function rather than RCCD:

```
natalie.powell@theinfotechpartners.com   (lead)
chelsea.marada@theinfotechpartners.com
ally.barker@theinfotechpartners.com
```

⚠️ **They were deliberately NOT added to `allowed_reviewers`.** Supplying an
address is not the same as authorising the grant, and adding an **external**
domain to that set is what required Sam's explicit confirmation when Pedro was
added. Reviewer would also hand them 591,820 student-grain rows and the ability
to rotate every team phrase. **The worklist is team-phrase gated, so they need
the phrase and nothing else — there is no per-person setup to do.**

⚠️ Sam first wrote the name **"Chelsea Mirada"** and the address he then gave is
**"chelsea.marada@"**. The address is authoritative for routing; confirm the name
spelling once before anything is sent to her.

**NEXT:** work P1 as one instruction to ~100 colleges; take P2 to Pierce and
Merced directly; ask the nine Initiator colleges what is stalling.

---

## §B3 · Following up the defects — `map_transcribed_gap`

Sam, 2026-08-19: *"For the defects you found we want to follow up on those."*

**270 rows · 8 colleges · 46,496 units at stake.** Team-phrase gated, rebuilt in
the same nightly transaction as the worklist. The worklist says a college *has*
the problem; this says **where**, at the grain a college can search on in MAP —
exhibit × catalog year — with the question to ask already written into the `ask`
column.

**Two calls cover 87%.** Los Angeles Pierce: 1,840 students, 46 exhibits,
~35,200 units, all `MAPSAS` AP exhibits and **all still at Needs Action**.
Merced: 1,785 students, ~8,900 units.

⚠️ **We cannot name the students, by design.** `StudentMAPID` is salt-hashed and
never stored; `student_key` is our counting surrogate, re-assigned nightly. The
college finds the records itself from the exhibit and catalog year. **Do not
"fix" this by storing a durable student key** — a one-way hash is precisely what
we asked MAP for.

⚠️ **"Units at stake" is the question, not a loss figure.** The credit may have
been transcribed and never recorded, or never transcribed at all. Only the
college can say. Never report 46,496 as credit lost.

---

## §C · Carryover

- **Ashley's Delta crosswalk — untouched for three handoffs.** Record which of
  the 42 Priority-1 rows Delta accepted / rejected / **corrected**; corrections
  go into `kb/delta_offering_map.json`. The statewide engine's **second
  occupation list is still outstanding** — five sessions now, the oldest unpaid
  debt in the project.
- **Watch the first unattended 13:40 UTC run.** It has been proven by dispatch,
  not yet by the schedule firing on its own. A `G`-numbered failure is a gate
  doing its job — **fix the pull, never the gate.**
- **`CLAUDE.md` is still 2.0× budget** (119,852 / 60,000, `always_loaded`). This
  run held it flat — archived the Sky169 narrative to pay for the new one — but
  did not reduce it. The `Troubleshooting` section is the obvious candidate for
  `docs/reference/`.
- **The Customer Success team needs the TEAM PHRASE**, not reviewer access.
  Addresses are in §B2. Nothing to set up per person — say the word to them and
  they are in.
- Auth `role` column, repo split, GR sensitivity flips — all still on Sam.

---

## ⚠️ Standing design rule, added this run

**Sam, 2026-08-19:** *"Make sure it is based on our First Light design and make it
always accessible and mobile friendly."* — and he meant **artifacts and
prototypes too**, not just dashboard CSS. This session built a decision artifact
on an invented palette while the house spec sat in the repo. **Look for the
design system before designing anything.**

Spec: [`docs/kb-notes/reference-ui-design-system.md`](kb-notes/reference-ui-design-system.md)
+ `prototype/first_light_theme_v1.html` v1.6. Warm monochrome, five accents one
job each, Playfair Display + Source Sans 3, `var(--token)` never a raw hex,
tables never on glass. **Verify contrast, don't claim it** —
`prototype/check_contrast.py` holds the maths — and **color is never the only
signal**. Full rule in `CLAUDE.md` → Engineering & UI practices.

## Patterns that worked

- **"It is wired" and "it has run" are different claims.** The views had never
  been fetched; the payload merged 13:15 PDT and the day's last cron ran 13:12
  UTC. Two commands settled it (`list_workflow_runs`, then
  `git show <sha>:fetch_custom_report.py`). Handoff 171 said to check — checking
  is what made the loader able to fetch rather than assume.
- **Check the consumers before designing around a blocker.** The live
  `student_key` (Access surrogate) cannot join the API's hash in either
  direction, which looked like a design problem. One grep showed `student_key`
  appears in three SQL files, always inside `count(distinct …)` — invariant
  under relabelling. The blocker dissolved.
- **Mutation-test your own suite.** Five mutations; four failed cleanly, and the
  fifth exposed a defect in the test itself.
- **Reconcile representation, not just counts.** The row counts were exactly
  right and the data was still wrong — nulls where the live table holds empty
  strings. Counts matching is not rows matching.

---

## Safety patterns to honour

- ⚠️ **A guard test must not be able to fire the guarded action.** With the
  truncate guard removed, the test reached `urlopen` — a live `DELETE` at a
  student-grain table. It passed locally **only because the sandbox blocks
  egress**, and the workflow runs it on a runner that does not. An
  environment-named error (`403 Forbidden`, `Connection refused`) in a test that
  should never touch the network is a finding.
  [`methodology-a-guard-test-must-not-be-able-to-fire-the-guarded-action`](kb-notes/methodology-a-guard-test-must-not-be-able-to-fire-the-guarded-action.md)
- ⚠️ **Minimization happens twice** — the payload decides what we ASK, the loader
  what we KEEP. Twelve fetched columns have no consumer and are dropped, and
  **listed** in `HELD_COLUMNS` so the decision is visible rather than an
  apparent oversight. `StudentMAPID` derives the surrogate and is discarded.
  [`methodology-minimisation-happens-twice`](kb-notes/methodology-minimisation-happens-twice.md)
- ⚠️ **A load must reproduce its source, not improve it.** NULL may be the better
  representation of absent; that is a separate change argued on its own merits,
  never a side effect of a refresh.
- ⚠️ **A negative result needs a positive control in the same run** (SkyFetch's
  broken probe), and **an odd one out is a lead, not a tally entry**.
- ⚠️ **The payload IS the PII boundary.** `tests/custom_report_payload_test.py`
  pins it and was verified to FAIL. Keep it that way.
- ⚠️ Raw pull stays gitignored (`CustomReport_*.json`) — public repo, student rows.
  The load workflow also `rm`s it in an `always` step.
- ⚠️ **An RLS-filtered read returns 200 + `[]`.** Empty is not proof of empty.
- ⚠️ **The sandbox cannot reach the MAP API or `*.supabase.co`.** MAP work runs on
  the runner; Supabase goes through the MCP.
- Rule 4 (both HTMLs identical), Rule 1 (change the generator), Rule 5 (never
  force-push `main`), Rule 7 (TOP corroborates, never gates), Rule 10.

---

## Moniker

Session 171 was **SkyLoad**. Take **SkySwap** if you do the reconciliation and
the swap, **SkyClaim** if you take Ashley's Delta outcome, or coin your own.

Next after you: `docs/session_173_handoff.md`.
