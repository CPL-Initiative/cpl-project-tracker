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

⚠️ **THE BANDS ARE INTERIM — Sam, 2026-08-24:** *"The level rulings for ESL will be a bit
messy until SME discussions happen. Colleges have differing total numbers of levels, some
1-4, 1-6, 1-7."* Measured over **70 colleges** with a readable ESL ladder — top rung 3: 20
colleges · 4: 22 · 5: 7 · 6: 16 · 7: 3 · 8-9: 2. **42 of 70 top out at rung 3 or 4**, so for
them rung 3-4 IS Advanced, which is why n=3 and n=4 keep disagreeing.

⭐ **Banding by position in the college's OWN ladder is wrong on 33.3%**, against 49.2% (old
pinning) and 54.5% (Sam's bands). Ladder length is **derivable from titles**, so the SME
conversation is **~70 ladder confirmations, not 434 row reviews**. That is the shape to build.

⚠️ **Sam wants to make these adjustments in the SkyView graph view, and it CANNOT do that
today** — verified: **0 of the 9** over-claims appear in `prototype/ccr_universe.json`, because
merged-away identities do not render (#1312 working correctly), and the only write verb moves
a LOCAL COURSE between identities (`CN:`). What his plan actually needs is a **per-college
ladder view** — 70 items, each a short ordered list — not row-by-row re-leveling.

**STILL OPEN — the apply.** The 32 are a DRY-RUN; **nothing is written to Supabase**. Sam had
not given the go when Session 188 ended. Also still open: `ESLN M9015` (rung 4) and
`ESOL M1040` (rung 3), whose catalogs say *high-beginning* while his bands put them at
Intermediate — a separate call.

Read `kb/esl_fold_spotcheck/2026-08-24/report.md` and
`kb/esl_relevel_out/2026-08-24/report.md` before doing anything here.

## ✅ SAM AUTHORED THE ESL LEVEL SETS — implement these FIRST

He revised his own bands after seeing the ladder-length data. **The authored sets are
`kb/reference/esl_level_sets.json`** — attributed DATA, not code. Implement from that file.

| Ladder | Colleges | B | I | A |
|---|---:|---|---|---|
| 3 | 20 | 1 | 2 | 3 |
| **4** | **22** | **1** | **2,3** | **4** |
| 5 | 7 | 1,2 | 3,4 | 5 |
| 6 | 16 | 1,2 | 3,4 | 5,6 |
| 7 | 3 | 1,2,3 | 4,5 | 6,7 |
| 8 | 1 | 1,2,3 | 4,5,6 | 7,8 |
| 9 | 1 | 1,2,3 | 4,5,6 | 7,9 |

⚠️ **L=4 is the one cell where Sam diverges from an even split** — an even split puts the
extra rung LOW (1,2|3|4); he put it in the MIDDLE (1|2,3|4). **L=4 is the largest group at 22
colleges**, so this is the highest-impact cell. Do not "simplify" it back.

⚠️ **Also his:** `low-b → high-b = B`, `low int → high int = I`, `low adv → high adv = A`.
The current classifier already folds `high-`/`low-` to the base band; add the test.

### ⚠️ WHAT THIS DOES TO THE 32 ALREADY APPLIED

**The 32 re-levels ARE LIVE** — cohort `relevel-esl-s188@bot`, applied 2026-08-24 on Sam's
"Yes on 32", verified by arithmetic (M1141 267→237, M9168 1079→1078, M9256 463→494).

**But 29 of the 32 flip back under the per-ladder sets** — 17× rung 5 of a 6-ladder and 12×
rung 5 of a 5-ladder, all Intermediate → **Advanced** again. The catalog evidence agrees with
the per-ladder reading (of the 32, **16 disagreed with the college's own catalog, 7 agreed**).

**Sam has NOT answered the rollback offer.** Options put to him: roll the 31 downward moves
back and keep the 1 upward (`ESOL M10FD`, rung 8, Advanced under both schemes), or leave them
until SkyView shows the effect. **Rollback is one statement against the cohort — do not
re-derive it.** Ask him before either applying the new sets or rolling back.

### ⚠️ THE PART NONE OF THIS SOLVES

Sam: *"Still won't help with the colleges that don't use level numbers."* Right. Ladder sets
reach titles with a rung; the word rule reaches titles with a level word. **543 folds have
NEITHER** (`default-beginning`), and **400 of those carry no level assertion in their catalog
description either.** That pile needs a different mechanism, not a better rule.

## 🔭 SAM'S LONG-RANGE ASK — propose-rules-per-cluster in SkyView

*"it may be helpful for an intermediate step in SkyView where I can ask you on the tab to
analyze a subject cluster and propose rules I could respond to, based on a similar analysis
you did for ESL, which happens to be the messiest regular set of courses. Would really come in
handy for all the loaner courses out there (primarily NC)."*

That is this session's whole method turned into a feature: measure a cluster, calibrate its
signals, propose bands/rules, let the curator rule, then apply. **ESL is the worked example** —
`kb/_build_esl_fold_spotcheck.py` (calibration) → `kb/_esl_relevel_dryrun.py` (rules as data +
guards) → gated apply. Not scoped yet; capture it before it is lost.

## ✅ SAM APPROVED A BUILD — this is your priority workstream

He asked for mint-on-drag in SkyView, invited pushback, then took the counter-proposal:
***"Great recommendations, let's roll with them."***

| Step | What | Re-mints? |
|---|---|---|
| **1** | Drag any local course — **including from a merged-away identity** — onto another M-ID. Writes `CN:`. | **No** |
| **2** | If the drag leaves the destination's SUBJ4 inconsistent with its discipline, **queue** a candidate. | **No** |
| **3** | Work the queue in **batches** under the Rule 7 playbook. | Yes, deliberately |

Authority: [`docs/skyview_drag_rehome_scope.md`](skyview_drag_rehome_scope.md) — **read it
before starting**; the reasoning and the open questions live there.

⚠️ **Step 1 is a DATA task before it is a UI task.** `prototype/ccr_universe.json` carries 158
islands of identity points with a member **count** and **no member courses at all** — there is
nothing at course grain to drag. Members must reach the payload first
(`kb/_build_ccr_universe.py`), resolved through merge chains so merged-away identities
contribute to their survivor. ⚠️ **Do not ship all members inline** — 16,484 identities carry
**134,485** member rows and the payload is already 1.7 MB.

⚠️ **Zero `CN:` rows exist**, so the first real drag is also the first exercise of a verb built
in Session 54 and never once used. Expect to find something.

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
