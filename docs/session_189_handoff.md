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

## ✅ SAM RULED THE BANDS — this supersedes the P-4 pinning

**Sam, 2026-08-24, in session:** *"Level 6 ESL can go in Advanced"*, then
*"For ESL with Levels indicated: **0-2 = Beginning; 3-5 = Intermediate; 6-10 = Advanced**"*.

That replaces the ratified P-4 pinning (1-2 / 3-4 / 5+). Implemented and dry-run:
`kb/_esl_relevel_dryrun.py` → `kb/esl_relevel_out/2026-08-24/report.md`, guarded by
`tests/esl_relevel_bands_test.py` (wired into CI).

**32 re-levels: 31 Advanced→Intermediate, 1 Beginning→Advanced.** Six of the nine
over-claims resolve and all six agree with the college's own catalog. `ESOL M1050`
(Level 6) stays **Advanced** — his explicit call, now pinned by a test.

⚠️ **The measured "wrong rate" goes UP under his bands (49.2% → 54.5%) and that is not an
objection.** 16 Level-5 courses are called *advanced* in their own catalogs. But the catalogs
are ~116 colleges disagreeing with EACH OTHER (rung 1 splits 47% Beginning / 44%
Intermediate), and a statewide mapping exists to override local variance. Treat the number as
**blast radius**, never a verdict.

⚠️ **The reader needed extending to 0-10 and that is where the danger is.** Three guards, each
from live data: a level WORD beats a number (`Beginning Skills 9`); a grade range is not a
level (`K-12`); roman numerals stop at VII (`Beginning Skills 2 X` reads the trailing X as
10). All three proven to fail the test when broken.

**STILL OPEN — the apply.** The 32 are a DRY-RUN; **nothing is written to Supabase**. Sam had
not given the go when Session 188 ended. Also still open: `ESLN M9015` (rung 4) and
`ESOL M1040` (rung 3), whose catalogs say *high-beginning* while his bands put them at
Intermediate — a separate call.

Read `kb/esl_fold_spotcheck/2026-08-24/report.md` and
`kb/esl_relevel_out/2026-08-24/report.md` before doing anything here.

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
- 🟢 **TruffleHog stalled twice on #1315** (22 min, then a fresh re-run), zero log output both
  times — but **recovered on its own for #1316** (14 min, success). So it is a slow, sometimes
  hanging check, **not** a repo-level break. Budget ~15 min for it and do not assume a stall
  means your diff; the JS suite finishing first tells you nothing either way.

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
