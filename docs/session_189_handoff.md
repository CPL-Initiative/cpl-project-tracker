---
title: Session 189 handoff — the fold was re-checked and the queue was ranked backwards; two calls are Sam's
created: 2026-08-24
updated: 2026-08-24
tags: [handoff, session-189, ccr, esl, packaging, calibration, curation]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_atlas_lessons]]"
  - "[[docs/session_188_handoff]]"
  - "[[docs/kb-notes/methodology-calibrate-a-signal-before-you-rank-the-queue]]"
---

# Session 189 handoff

You are **Session 189**. Session 188 ran as **Sky188**. Sam asked for two things: find the
*"CPL Initiative Dashboard Daily Update"* Routine so he could switch it off, then
**"continue the queue."**

⚠️ Sam frequently runs several sessions at once. `git log origin/main` before assuming your
branch is the only work in flight.

---

## Read this first

**A `confidence` stamp on a derived signal is a claim, not a measurement.** Session 188's
handoff ranked the ESL follow-up work by reasoning about evidence strength and got the order
backwards. Measuring each fold signal against the colleges' own catalog descriptions:

| Signal / confidence | Disagrees | Agrees | Unchecked | Wrong rate |
|---|---:|---:|---:|---:|
| `combo/medium` | 2 | 0 | 3 | 100.0% |
| `default-beginning/medium` | 102 | 31 | 384 | **76.7%** |
| `numeric/medium` | **94** | 97 | 241 | **49.2%** |
| `combo/high` | 1 | 7 | 24 | 12.5% |
| `word/high` | 23 | 345 | 455 | **6.2%** |

`numeric` is a coin flip and had been ranked **below** the lane you were told to work first —
94 rows were about to be skipped. Before ranking the next discipline's queue, **calibrate**:
[`calibrate-a-signal-before-you-rank-the-queue`](kb-notes/methodology-calibrate-a-signal-before-you-rank-the-queue.md).

⚠️ **The denominator is the rows the source can DECIDE.** 1,217 folds assert nothing either
way and are excluded, never counted as agreement. Fold them in and `default-beginning` reads
20% instead of 77%.

---

## Your first job: nothing, until Sam answers

**Two calls are his and both block the ESL lane.** Do not re-level anything without them:

1. **The 9 numeric over-claims** — by hand, or **move the `5+` cut to `6+`**, which resolves 6
   of the 8 Advanced ones by rule. All 9 are *"high-intermediate"/"high-beginning"* rounded
   up: the cut sits one rung too low for 6-rung ladders. `ESOL M1211` (8 colleges) and
   `ESOL M1217` (7) are the LACCD *College ESL V* series — a **district convention**.
   ⚠️ `ESOL M1217` is not unanimous (six say high-intermediate, LA Mission says low-advanced).
2. **Whether the numeric pinning survives at all.** At 49.2% it isn't earning its place, and a
   better constant won't fix it — a title number can't be read without that college's ladder length.

**222 proposals are staged and nothing is written to Supabase.** Read
`kb/esl_fold_spotcheck/2026-08-24/report.md` before doing anything here.

## What shipped

| PR | |
|---|---|
| #1315 ✅ `23ee6fe` | ESL fold spot-check: builder, 40-check guard wired into CI, KB note |

- `kb/_build_esl_fold_spotcheck.py` — READ-ONLY, `--scope all|default-beginning`
- `kb/esl_fold_spotcheck/2026-08-24/{worklist.json,report.md}` — **read `report.md`**
- `tests/esl_fold_spotcheck_test.py` — wired into `js-tests.yml`, **confirmed executing** in
  the run log (a job passing is not proof your step ran)

## Closed this run — do not redo

- ✅ **The orphan Routine is DELETED** (Sam did it; verified gone from `list_triggers`). The
  Rule 6 second-scheduler risk and the `CPL_SCRAPE_2026` secret in its prompt are retired.
  **PR #1314 merged still describing it as live — ignore that carryover.**
- ✅ **Survivor-member audit — clean**, verified against **live** `kb_curation`: 7 pre-existing
  members across all 7 survivors, 1 non-ESL (`FIMS M1018`, already known). The four big level
  survivors had **zero**, so the dilution risk was only ever in the small carve-out survivors.
- ✅ **The Beginning worklist exists** and is superseded by the all-folds version.

## Carryover

- 🔴 **The 67 Z-scheme `ESOL Z####` rows** the fold never touched (outside
  `coci_minted_courses`/`singletons`). **The concrete remaining ESL job.**
- 🔴 **`FIMS M1018` still cannot be re-homed** — it does not render, so it needs the
  **un-merge verb**. Three verbs still missing: un-merge an applied merge, relabel an island's
  discipline, re-home a course inside a merged-away identity.
- 🟡 The **one-college-many-numbers** audit rule (3,320 candidates), proposed for `kb/_row_audit.py`.
- 🟡 The **3,001 no-discipline decisions** (8,065 identities) — a different job, needs its own tool.
- 🔴 **18 of 20 `tests/*_test.py` run nowhere; two are RED on `main`**
  (`statewide_kpi_test.py`, `eacr_matrix_payload_test.py`, both pre-existing and unrelated).
  Fix, then wire the rest in one pass.
- 🟢 `docs/INDEX.md` is **6.5×** its budget (260 KB); `CLAUDE.md` is **2.4×** (145 KB). Both
  want a compaction pass of their own.
- 🟡 **TruffleHog stalled twice** on #1315 (22 min, then a fresh re-run), zero log output both
  times, while the JS suite completed in 11 min on the same commit. If it stalls again, treat
  it as **repo-level**, not a per-PR flake.

## Patterns that worked

- **Proof by observation beats proof by reading.** Sam asked whether the Routine was the daily
  cron. Three config arguments said no; what settled it was that it was already Paused *and the
  dashboard updated anyway*.
- **Check whether the repo already holds the evidence.** The catalog descriptions had been in
  `kb/reference/coci_course_list.xlsx` the whole time.
- **Break your own check.** The first boilerplate guard **passed while perturbed** — it could
  not fail. Rewriting it found a real defect (the strip took the field NAME, left its VALUE).
- **Reject a signal loudly.** The course-number ladder was built and thrown away; that finding
  is now in the builder's docstring so nobody rebuilds it.

## Safety patterns to honor

- **Rule 5**: never force-push `main`. **Rule 10**: fresh live read before any bulk
  `kb_curation` write; Sam's rows always win.
- ⚠️ **`check_suite.completed` is NOT a green light** — four in a row were useless this run:
  three named superseded heads, the fourth reported a suite I had **canceled** as "completed".
  Re-read `get_check_runs` on the CURRENT head, always.
- ⚠️ **Ask whether the list you read can contain what you are counting.** A zero from a
  scope-limited list is not a clean bill of health — prove the guard *can* fire.
- ⚠️ **A purpose bucket is not a level bucket.** Enrichment/Civic/Vocational ESL are carve-outs
  by purpose; re-pointing one at a level survivor silently strips it.
- ⚠️ **Merge on `unstable`, but name what the green covered** — and if a required-ish check
  never ran, say so in the merge commit rather than letting it read as verified.

## Moniker

**SkyCal** is going if you want it — this run ended by calibrating one. Take it, take your own,
or use whatever Sam names in his greeting.

**Next is Session 190 — `docs/session_190_handoff.md`.**
