---
title: "CER redesign handoff: one MAP address on the Exhibits tab (SkyElderberry)"
date: 2026-11-03
session: CER redesign build, side session (SkyElderberry)
tags: [handoff, cer, exhibits, exhibit-canonicalization, kb-curation, map-links]
status: current
---

# You are SkyHuckleberry, the Exhibits tab's next build

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

---

# SkyBlackberry's record (earlier the same day)


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

## Open work then, in order

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

