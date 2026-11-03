---
title: "CER redesign handoff: Sheet 161 applied (SkyBlackberry)"
date: 2026-11-03
session: CER redesign build, side session (SkyBlackberry)
tags: [handoff, cer, exhibits, exhibit-canonicalization, kb-curation, decision-sheet]
status: current
---

# You are SkyElderberry, the Exhibits tab's next build

SkyBlackberry ran on 2026-11-03 from about 16:00Z to 16:15Z and applied Sam's two Sheet 161 answers. This is a
**light checkpoint**: no lane changed state beyond one NEXT line, and the run's one data write is recorded in the
existing receipt. Skipped: `README.md`, `kb/README.md`, the pipeline view, a KB note, `kb/status/*.json` (no change to
the KB build, the surfaces or the pipeline). This file is the handoff; the CPL queue's `docs/session_<N>_handoff.md`
stays the routine's (latest 565).

## What shipped (SkyBlackberry)

- **Sheet 161 applied.** A fresh read at 16:07Z matched the four rows recorded in
  `kb/receipts/credential_panel_move_2026-11-03_skycheckerberry.json`. One statement deleted three rows (Sam's two
  ASE issuer rows on Engine Performance 1 and 2, the bulk run's California Community Colleges row on Metal Building
  Erection 1) and moved Sam's Iron Workers row onto Metal Building Erection 1. The receipt's `then_planned` is now
  `then_applied`, with the reason the UPDATE's not-exists guard was dropped (one statement reads one snapshot).
- **`kb/credentials.json`:** Engine Performance 1 and 2 lost the ASE record and name California Community Colleges,
  as Automotive Electrical/Electronics did on 10-31; Metal Building Erection 1 names the Iron Workers, Sam's review.
- **Checked, nothing to do:** no fold after 11-03 (`kb/unclassified_fold/`), and `kb_curation` holds no
  `cer_procedure_*` row.

## Open work, in order

1. **After each of Sam's runs through Another look,** read the next fold's `credential_moves` and `credential_retires`
   and move the panel rows they list. Never move a `unified_title_override` or `unified_title_merge_confirm`, and
   compare values before you call a leftover row redundant.
2. **The first rule sent to the routine** (carried): when one shows up in the Rules view, confirm the overnight firing
   worked it by step 7.
3. **Carried:** the Catalog's *Courses that may align*, once a source names courses.
4. **Noticed, not this lane's:** the 10 credentials on the Fact Sheet builder's MAP fix list (SkySnowberry).

## Lessons to honor

- A delete and a guarded move of a row onto the deleted row's key cannot share one statement with a `not exists`
  guard: a data-modifying CTE reads one snapshot, so the guard still sees the row being deleted. Drop the guard only
  when the same statement deletes the target, and say so in the receipt.
- The repo's Supabase guard refuses a read that contains `replace`. Spell out the keys instead.
- The cer-procedures lane sits at its 20,000-byte budget (19,900 now). Move a ruled paragraph to the lessons doc before
  you add one.

## Let go

At sign-off this session holds no check-in and no artifact watch; its PR watch drops when the PR merges.

---

# SkyCheckerberry's record (earlier the same day)

## What shipped

- **The panel rows of Sam's 11-01 and 11-02 runs through Another look (open work 1).** The 11-02 fold moved 42
  credentials and retired 27. The 11-03 fold moved one: Sam filed Saddleback's *Credit by Exam* under *Water Supply*.
  Together they left 25 Curate-panel rows under 17 old names. Ten moved to the new names by a guarded UPDATE of
  `course_id` (receipt `kb/receipts/credential_panel_move_2026-11-03_skycheckerberry.json`, before-values and rollback
  SQL; the guard refused none). Fifteen stayed under the old keys, each named in the receipt. Eight met an identical
  issuer row under the new name. Five rename and confirm rows were already carried out: moved, Sam's *Spanish 1* →
  *Elementary Spanish I* would rename *Elementary Spanish 1* back to Roman.
- **Open Asks Sheet 161** (https://claude.ai/artifact/PhjuiVSgi9aDh48u96TtPv, current, `SHEET_ID`
  `2026-11-03-open-asks-161`, db and comments, store empty at publish). Two cards, held because each deletes a row; Sam answered both at 15:14Z (*drop*, *ironworkers*):
  1. **Engine Performance 1 and 2:** drop Sam's two ASE issuer rows, as he did for Electrical/Electronics on 10-31.
  2. **Metal Building Erection 1:** whose issuer stands, Sam's Iron Workers row or a bulk run's California Community
     Colleges row.

  The builder and coverage test are in CPLBrain, with a premise and fixture for each card. The test passes 32 of 32.
- **Nothing sent to the routine.** `kb_curation` held no `cer_procedure_*` row at 15:12Z.

