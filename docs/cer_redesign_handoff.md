---
title: "CER redesign handoff: the 11-02 and 11-03 panel rows moved, two calls on Sheet 161 (SkyCheckerberry)"
date: 2026-11-03
session: CER redesign build, side session beside S564 (SkyCheckerberry)
tags: [handoff, cer, exhibits, exhibit-canonicalization, kb-curation, decision-sheet]
status: current
---

# You are SkyBlackberry, the Exhibits tab's next build

SkyCheckerberry ran on 2026-11-03 from 15:06Z to about 15:45Z, started from Sam's phone with SkyInkberry's older
greeting line (it named SkyTeaberry). The handoff on main named SkyCheckerberry, so this session took that name. No
other session was live on these files: the CSM Workspace session (#2729) had finished, and the funding session sat
idle. This is a **light checkpoint**. The cer-procedures lane gained one NEEDS SAM marker, and the run wrote one data
receipt (Rule 10). This file is the handoff; the CPL queue's `docs/session_<N>_handoff.md` stays the routine's.
Skipped, each with its reason:
- `README.md`, `kb/README.md`, the pipeline view, a KB note: no change to the KB, the surfaces or the pipeline.
- `kb/status/program-requirements.json`: that line was not worked.

`kb/status/exhibit.json` was written by hand, at indent 1. `--check --project exhibit` passes only when `handoff`
names a `docs/session_<N>_handoff.md`, so it names the routine's latest (565) and session 564.

## What shipped

- **The panel rows of Sam's 11-01 and 11-02 runs through Another look (open work 1).** The 11-02 fold moved 42
  credentials and retired 27. The 11-03 fold moved one: Sam filed Saddleback's *Credit by Exam* under *Water Supply*.
  Together they left 25 Curate-panel rows under 17 old names. Ten moved to the new names by a guarded UPDATE of
  `course_id` (receipt `kb/receipts/credential_panel_move_2026-11-03_skycheckerberry.json`, before-values and rollback
  SQL; the guard refused none). Fifteen stayed under the old keys, each named in the receipt. Eight met an identical
  issuer row under the new name. Five rename and confirm rows were already carried out: moved, Sam's *Spanish 1* →
  *Elementary Spanish I* would rename *Elementary Spanish 1* back to Roman.
- **Open Asks Sheet 161** (https://claude.ai/artifact/PhjuiVSgi9aDh48u96TtPv, current, `SHEET_ID`
  `2026-11-03-open-asks-161`, db and comments, store empty at publish). Two cards, both held because each deletes a row:
  1. **Engine Performance 1 and 2:** drop Sam's two ASE issuer rows, as he did for Electrical/Electronics on 10-31.
  2. **Metal Building Erection 1:** whose issuer stands, Sam's Iron Workers row or a bulk run's California Community
     Colleges row.

  The builder and coverage test are in CPLBrain, with a premise and fixture for each card. The test passes 32 of 32.
- **Nothing sent to the routine.** `kb_curation` held no `cer_procedure_*` row at 15:45Z.

## Read first

`docs/reference/lanes/cer-procedures.md` (NEXT and its NEEDS SAM), the SkyCheckerberry section of
`docs/cer_v2_redesign_lessons.md`, then the receipt.

## Open work, in order

1. **Read Sheet 161's `replies` before acting.** On *drop*, delete the two Engine Performance
   `issuing_agency_override` rows (values in the receipt), drop ASE from their records in `kb/credentials.json` as
   SkyHuckleberry did for A6, and write `flag_for_sam` as *Answered (Sam, <date>): ...*. On *ironworkers*, delete the
   bulk run's row under *Metal Building Erection 1 / Foreman Training*, move Sam's onto the new name, and record
   `answer` in `left_in_place.conflict_for_sam`. Either answer drops the lane's marker. The card premises read those
   two receipt fields.
2. **After each of Sam's runs through Another look,** read the next fold's `credential_moves` and `credential_retires`
   and move the panel rows they list. Never move a `unified_title_override` or `unified_title_merge_confirm`, and
   compare values before you call a leftover row redundant.
3. **The first rule sent to the routine** (carried): when one shows up in the Rules view, confirm the overnight firing
   worked it by step 7.
4. **Carried:** the Catalog's *Courses that may align*, once a source names courses.
5. **Noticed, not this lane's:** the 10 credentials on the Fact Sheet builder's MAP fix list (SkySnowberry).

## Lessons to honor

- The repo's Supabase guard refuses a read that contains `replace`. Spell out the keys instead.
- The cer-procedures lane sits at its 20,000-byte budget. Move a ruled paragraph to the lessons doc before you add one.
- A quiet night writes no fold receipt (SkySnowberry); the 11-02 and 11-03 folds did write one.

## Let go

At sign-off this session holds no PR watch once its PRs merge, no check-in, and no artifact watch. The Sheet 161
publish armed a watch that this session leaves to lapse; the next build reads the replies.
