---
title: "CER redesign handoff: a quiet queue, one lane line caught up (SkyTrue)"
date: 2026-11-03
session: CER redesign build, side session (SkyTrue)
tags: [handoff, cer, exhibits, exhibit-canonicalization, kb-curation, map-links]
status: current
---

# You are SkyMulberry, the Exhibits tab's next build

SkyTrue ran on 2026-11-03 from about 17:43Z to 18:05Z (Sam named it SkyTrue; the handoff had proposed SkyHuckleberry,
a name 10-31 already used). **Light checkpoint:** no lane changed state and the run wrote no data. Skipped:
`README.md`, `kb/README.md`, the pipeline view, a KB note, `kb/status/*.json`, the decision sheet (nothing waits on Sam
from this lane). The CPL queue's `docs/session_<N>_handoff.md` stays the routine's (565).

## What shipped (SkyTrue)

- **The cer-procedures lane caught up with the code.** It said *SLO hints, to build*; #2684 shipped them on 11-02
  (`kb/_build_exhibit_slo_neighbors.py`, daily, 326 neighbors over 10 colleges on 11-03). The line now says built.
  Sheet 161's applied ruling moved verbatim from NEXT to the lessons doc (lane 19,833 bytes).
- **Checked, nothing to do:** the 11-03 fold's one move (Credit by Exam to Water Supply) is in SkyCheckerberry's
  receipt. No fold after 11-03, no Curate row from Sam since 12:00Z (only the 15:33Z classifier's 26), and no
  `_CER_PROCEDURE_REQUEST::` row, so no rule waits on the routine.
- **Santa Ana's 1,366 SLOs** (S559) postdate the 06:22Z neighbors build; the next daily run takes them in.

## Open work, in order

1. **After each of Sam's runs through Another look,** read the next fold's `credential_moves` and `credential_retires`
   and move the panel rows they list. Never move a `unified_title_override` or `unified_title_merge_confirm`, and
   compare values before you call a leftover row redundant.
2. **The first rule sent to the routine** (carried): when a `cer_procedure_request` row shows up, confirm the overnight
   firing worked it by step 7.
3. **Carried:** the Catalog's *Courses that may align*, once a source names courses (the chip is in the CTDL seed
   mock-up; no source names courses yet).
4. **Noticed, not this lane's:** the 10 credentials on the Fact Sheet builder's MAP fix list (SkySnowberry).

## Lessons to honor

- Before acting on a lane's NEXT or *to build* line, grep the code it names: twice now a line was one merge behind.
- A delete and a guarded move of a row onto the deleted row's key cannot share one statement with a `not exists`
  guard (SkyBlackberry). The repo's Supabase guard refuses a read that contains `replace`.
- The cer-procedures lane sits near its 20,000-byte budget (19,833). Move a ruled paragraph to the lessons doc before
  you add one.

## Let go

At sign-off this session holds no check-in and no artifact watch; its PR watch drops when the PR merges.

---

# SkyElderberry's record (earlier the same day)

SkyElderberry ran on 2026-11-03 from about 16:45Z to 17:10Z. **Light checkpoint:** no lane changed state and the run
wrote no data. Skipped: `README.md`, `kb/README.md`, the pipeline view, a KB note, `kb/status/*.json`, the decision
sheet (nothing waits on Sam from this lane). The CPL queue's `docs/session_<N>_handoff.md` stays the routine's (565).

## What shipped (SkyElderberry)

- **The Exhibits tab's MAP links go through `map_links.js`.** Two of them (Request Quick Adopt in a college's panel,
  and each source exhibit's *in MAP* link) built the address from the tab's own copy. `mapUrl` in `exhibits.js` now
  calls `CPL_MAP_LINKS.url` and keeps its copy only for a page without `map_links.js`; `linkUrl` folded into it.
  `tests/exhibits.test.js` pins both links to the `map_links.js` stub and holds the copy equal (198 of 198; the two
  link checks fail on the old code).
- **The EACR lane's NEXT line** said the workbook and the statewide view still built the address themselves. Both
  already call `CPL_MAP_LINKS.url`; the line now says so.
- **Checked, nothing to do:** no fold after 11-03. The 15:33Z CER procedures run (run 41664297423) saved 26
  classifier rows for unclassified exhibits and moved no credential, so no panel row needs moving. No Curate rows from
  Sam since 12:00Z, and no `cer_procedure_*` row.
- **SkyTeaberry still reads blocked** on *reply "go" and approve the Supabase delete*. That delete is SkyBlackberry's
  16:08Z Sheet 161 apply; it is done. Do not reply "go" there.

## Open work, in order

1. **After each of Sam's runs through Another look,** read the next fold's `credential_moves` and `credential_retires`
   and move the panel rows they list. Never move a `unified_title_override` or `unified_title_merge_confirm`, and
   compare values before you call a leftover row redundant.
2. **The first rule sent to the routine** (carried): when one shows up in the Rules view, confirm the overnight firing
   worked it by step 7.
3. **Carried:** the Catalog's *Courses that may align*, once a source names courses.
4. **Noticed, not this lane's:** the 10 credentials on the Fact Sheet builder's MAP fix list (SkySnowberry).

## Lessons to honor

- Before acting on a lane's NEXT line, grep the code it names: the EACR line was one fix behind.
- A delete and a guarded move of a row onto the deleted row's key cannot share one statement with a `not exists`
  guard (SkyBlackberry). The repo's Supabase guard refuses a read that contains `replace`.
- The cer-procedures lane sits at its 20,000-byte budget (19,900 now). Move a ruled paragraph to the lessons doc before
  you add one.

## Let go

At sign-off this session holds no check-in and no artifact watch; its PR watch drops when the PR merges.
