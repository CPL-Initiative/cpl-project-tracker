---
title: "ESL packaging (the first fold) — lane state"
created: 2026-08-28
updated: 2026-09-26
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# ESL packaging (the first fold)

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Collapse the ESL discipline to comprehensives + carve-outs — the proof that packaging reaches the target.

## Status

**NEEDS SAM — the ESL merging procedure sheet** (built 2026-09-26, S294): his ask of 2026-09-21, *"we have an ESL merging procedure I'd like to adjust but I will want you to give me in the next session a decision sheet to manage the adjustments to what we currently use or have queued to use,"* is nine items at [LaZmu7NYj11DigAEbxsUMS](https://claude.ai/artifact/LaZmu7NYj11DigAEbxsUMS) (`kb/_build_esl_merging_decision_sheet.py` → `docs/visuals/2026-09-26-esl-merging-procedure.html`): four rules in use (the level reader, the Beginning default, purpose before level with the healthcare gap, transfer composition) and five queued (the 92 identities that arrived after the fold, the 30 re-levels, the nine over-claims, a monthly pass, the film course in Enrichment). ⚠️ **Read its `replies` store before running anything below.** Measured for it: 102 ESL identities publish today and the 2026-07-15 plan (ids resolved through `kb/alias_chain.py`) covers 10; 91 of the other 92 got their ids when the Z band retired on 2026-09-03. The reader misses `Careers` (plural), `Interm`, and health words, so 17 health-titled folds sit in Beginning and 1 in Intermediate.

✅ **APPLIED, PUBLISHED AND SPOT-CHECKED — ESL went 2,300 identities → 27** (SkyView #1311/#1312; spot-check Sky188 #1315). Cohort `package-esl-s187@bot`, 1,997 rows, receipts `kb/esl_package_out/2026-08-24/` + `kb/esl_fold_spotcheck/2026-08-24/`. Survivors: Beginning `ESOL M9168` · Intermediate `ESOL M9256` · Advanced `ESOL M1141` · Vocational `ESOL M9023` · Civic `ESOL M9177` · Enrichment `ESOL M1152` · Voc—Healthcare `ESOL M91IL`. ⭐ **THE MECHANISM IS SURVIVORS, NOT NEW IDS** (Sam) — `merge_into_orphan` self-trusts only `UC-CUR-*` and Session 56 re-minted all 4,053 away, so a Z-scheme target would flag as an orphan forever. ⭐ **CALIBRATE THE SIGNAL, DON'T RANK BY INTUITION** — measured against the colleges' own catalogs (96% coverage): `default-beginning` **76.7%** wrong · `numeric` **49.2%** · `word/high` **6.2%**; `numeric` is a coin flip and had been ranked BELOW `default-beginning`. ⚠️ **The denominator is rows the source can DECIDE** — 1,217 folds assert nothing either way and are EXCLUDED, never counted as agreement. ✅ **SAM'S BANDS, TWICE REVISED THE SAME DAY** — the absolute `0-2/3-5/6-10` superseded the P-4 pinning (its **32 re-levels are LIVE**), then his **PER-LADDER sets** superseded those (`kb/reference/esl_level_sets.json`, attributed data; **L=4 is `1|2,3|4`** — his divergence from an even split, and the largest group at 22 colleges). ⚠️ **A canonical standard scored against local records looks WORSE (49.2% → 54.5%) and that is blast radius, not a verdict.** ⚠️ **Extending the reader to 0-10 needs THREE guards, each from live data**: a level WORD beats a number (`Beginning Skills 9`), a grade range is not a level (`K-12`), roman numerals stop at VII (`Beginning Skills 2 X` reads the trailing X as 10) — `tests/esl_relevel_bands_test.py`, all three proven to fail when broken. **THE APPLY IS NOT RUN — dry-run only, nothing in Supabase.** ⭐ **DIRECTIONAL ERROR BEATS AGGREGATE** — in the numeric lane 85 under-claim vs **9** over-claim, and the small half is the one to work. ⚠️ **A local course NUMBER is not a level ordinal** (a ladder was built and rejected at 325 false proposals). ⚠️ **A purpose bucket is not a level bucket** — 45 rows name a level inside Enrichment/Civic/Vocational; re-pointing strips the carve-out. ✅ **Survivor-member audit clean** — 1 non-ESL (`FIMS M1018`); the four big level survivors at **zero**. ✅ **ALL SEVEN OF SAM'S CALLS ARE IN** (`kb/_esl_ladder_relevel_dryrun.py`, receipt `kb/esl_ladder_relevel_out/2026-08-24/`; #1318/#1319) — over-claims STAY · no rollback · apply only at **≥2 members** · **L=2 = `L1 Intermediate, L2 Advanced`** (NOT an extension of the pattern above it — never regularise to `1=Beginning`) · Chabot both Advanced · NOCE `Academic Success` I/II = Beg/Int · **"Scope it to NC not just NOCE."** **The ladder plan proposes 122 re-levels, and Sam's rulings clear 30** (17 would undo the applied 32; 75 more rest on a single member course). **Nothing written, no apply script for this lane yet.** ⭐ **SAM: "You should have data for each course as credit or noncredit" — he was right.** The first NC rule read the worklist's derived `credit_type`, **blank on 24% including the NOCE courses he had just ruled on**, and was propped up with a hand-listed institution set. The authoritative field was in COCI staging all along: **`credit_status` over memberships ∪ singletons, joined on `control_number` — 118,195 numbers, 100% ESL coverage**. List DELETED. **A rule needing a hand-maintained list to cover its own subject is usually reading the wrong field.** ✅ **No rollback (Sam, 2026-08-24):** the plan's 17 reverts stay out, and all 12 whose catalog speaks disagree with the revert. ⚠️ **89 of the 122 rest on a SINGLE member course**; the weakest reader tier is a bare trailing integer. ⚠️ **Derive ladders from the WHOLE ESL corpus, never the folded worklist** — the subset undercounts length and a short ladder pushes rungs HIGHER; corpus reproduces S188 in 6 of 7 buckets, folded in none. The four questions that stood here were settled on 2026-08-24: the over-claims stay, the per-ladder sets replace the numeric pinning, no rollback, and L=2 is `1 Intermediate, 2 Advanced`. **Nothing from the ladder pass is written to Supabase.** Story: [`docs/ccr_atlas_lessons.md`](docs/ccr_atlas_lessons.md); durable [`calibrate-a-signal-before-you-rank-the-queue`](docs/kb-notes/methodology-calibrate-a-signal-before-you-rank-the-queue.md).


## ⚠️ Open — the ladder-specific logic has no test

`kb/_esl_ladder_relevel_dryrun.py` imports its level reader from `_esl_relevel_dryrun`
("the SAME reader — never a second copy"), so the reader guards in
`tests/esl_relevel_bands_test.py` cover it. No test covers what the ladder script adds:
Sam's sets table, the L=2 row, the noncredit shift, the member vote and its tie
handling, the whole-corpus ladder derivation, and the purpose carve-out skip.

**NEXT:** a suite for those before the first ladder apply, keeping the pair of
assertions that made the old one honest (*"no purpose carve-out was re-banded"*
**and** *"carve-outs were actually seen, so the guard can fire"*).
