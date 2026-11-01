---
title: "CER redesign handoff: CLEP folds on Sam's ruling, Sheet 150 answered (SkyTeaberry)"
date: 2026-11-01
session: CER redesign build, side session after S536 (SkyTeaberry)
tags: [handoff, cer, exhibits, exhibit-canonicalization, clep, ib]
status: current
---

# You are SkySnowberry, the Exhibits tab's next build

SkyTeaberry ran on 2026-11-01 from 01:35Z, started from Sam's phone. No other session was live on these files;
SkyInkberry had signed off. This is a **full checkpoint** in content (the run wrote Rule 10 data and moved the CER
lane) on the side line's shape: this file is the handoff, and the CPL queue's `docs/session_<N>_handoff.md` stays the
routine's. Skipped, each with its reason:
- `README.md` and `kb/README.md`: no change to the KB structure or the surfaces.
- The pipeline view: no roadmap, auditor or re-mint movement.
- A KB note: the learning fits the lessons doc.
- `kb/status/program-requirements.json`: that line was not worked.

`kb/status/exhibit.json` was refreshed by hand, because `scripts/queue_status.py --stamp` accepts only a
`docs/session_<N>_handoff.md` and this line's handoff is this file.

## What shipped

- **Sam answered [Open Asks Sheet 150](https://claude.ai/artifact/3MJJ8ftqz7BABwnQAsjfFL) at 01:50Z**, both his own
  call, no notes: card 1 *keep* (the IB fold of #2632 stands), card 2 *fold*. The sheet is answered; never republish
  onto it. The builder dropped its cards in CPLBrain's Sheet 150 PR.
- **#2633, CLEP on the AP and IB pattern.** `kb/_clep_official_titles.py` holds College Board's 34 current CLEP exams
  and the retired ones, one credential per exam, named as the ruling says:
  - a world language exam's levels fold in as score bands (*CLEP Spanish Language*, *CLEP Spanish with Writing*);
  - the numbered exams take 1 and 2 with no period subtitle (*CLEP History of the United States 1*);
  - a renamed exam takes its current name (*CLEP Information Systems*, *CLEP Precalculus*); a retired one keeps its
    own (*CLEP College Algebra-Trigonometry*, *CLEP Trigonometry*);
  - a title naming two exams is held.

  Brand-family's `clep` lane runs after `ap` and `ib`; the gate lets an official CLEP name stand. The reader's dry run
  read all 400 CLEP local titles; 290 already sat under their exam, and every person-reviewed title agreed except the
  five the ruling itself moves.
- **The fold.** `kb/_clep_fold_apply.py` wrote 18 merges and `kb/_merge_credentials.py --apply` applied them: 110
  local titles, 48 CLEP names to 35, 10 articulations. Receipts `clep_applied.json` and `clep_report.json` in
  `kb/credential_merges_out/2026-11-01/`, beside the IB fold's.
- **The live side.** 33 saved assignments and 3 panel markers moved under `cer-clep-fold-skyteaberry@bot` by the guarded
  UPDATE in `clep_kb_curation_update.sql` (receipt and rollback in `clep_kb_curation_update_receipt.json`, committed
  before it ran); all 36 read back. Nine rows are a person's (MAP account and Sam), each moved by the ruling. The two
  Level III panel markers stay under their old keys, since each exam's key took the *(Levels 1 and 2)* marker; nothing
  was deleted.

## Read first

Read `docs/reference/lanes/cer-procedures.md` (the CLEP block and NEXT), then the SkyTeaberry section of
`docs/cer_v2_redesign_lessons.md`.

## Open work, in order

1. **After each of Sam's runs through Another look,** read the next fold's `credential_moves` and `credential_retires`
   and move the panel rows they list, as SkyHuckleberry did. Nothing was saved between the 2026-10-31 fold and 02:30Z
   2026-11-01.
2. **The first rule sent to the routine** (carried): none had been sent at 02:30Z. When one shows up in the Rules view,
   confirm the overnight firing worked it by step 7.
3. **Check tonight's fold took the CLEP rows.** After the 06:17Z run, the 33 moved assignments should read *already
   classified to the same target* in `kb/unclassified_fold/<date>/report.json`, not STALE, once the sync copies the
   live rows into `kb/unclassified_assignments.json`. The 38 older preseed rows naming Roman-numeral forms (*CLEP
   Spanish Language Level II*) read STALE before and after; leave them unless Sam asks.
4. **Carried:** the Catalog's *Courses that may align*, once a source names courses. Training sites for a held title
   new to the reference, only if Sam asks.
5. **Noticed, not this lane's:** `tests/credential_catalog_sync_test.py` fails on main (78 statewide credentials with
   no recommendation text). CI does not run it.

## Lessons to honor

- When a ruling moves reviewed titles, the dry run's agreement test covers everything else, and the receipt names each
  ruled move.
- `kb/_merge_credentials.py` writes `report.json` and `applied.json` into the day's folder, over an earlier fold's.
  Rename the new pair and restore the old with `git checkout`.
- A panel row cannot fan in under `(course_id, field)`: move the marker whose meaning carries and leave the other.
- `clep.collegeboard.org` is outside the sandbox's network; College Board's names came from a search and the known
  34 exams.

## Let go

At sign-off this session drops its PR watches (#2633, CPLBrain's Sheet 150 PR) and holds no artifact watch or
check-in.
