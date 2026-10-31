---
title: "CER redesign handoff: Another look, the sweep through every exhibit title (SkyCoralberry)"
date: 2026-10-31
session: CER redesign build, side session after S536 (SkyCoralberry)
tags: [handoff, cer, exhibits, exhibit-canonicalization]
status: current
---

# You are SkyBilberry, the Exhibits tab's next build

SkyCoralberry ran on 2026-10-31 from 17:07Z. Sam had saved 384 titles in Review (13:46Z to 17:05Z) and asked for an
audit in the procedure that bundles the titles that look the same but still differ, for another run-through. No other
session was live on these files. This is a **light checkpoint**: one lane file moved (`cer-procedures`, in #2623, with
history moved verbatim to its lessons doc), and the index, the memory rows, the Exhibit status file and the vault note
moved. No Roadmap row moved, no re-mint was made, and no Rule 10 data write or receipt was needed (the only rows written
were `cpl_memory`). `README.md`, `kb/README.md`, the pipeline view, the KB notes and the decision sheet were not touched;
no NEEDS-SAM marker was added, since his calls are made on the cards. The numbered session handoffs stay with the main
queue; this lane keeps this file.

## What shipped

- **#2623: Another look.** `kb/_sweep_exhibit_titles.py` reads every title in the reference after the fold (daily in
  `daily-dashboard.yml`, nightly in `cer-procedures.yml`) and writes `kb/exhibits_sweep.json`: 134 cards over 168 local
  titles on the first build. Rules: ase 17, numerals 45, language 32, course-code 6, level 1, fold 33. The tab draws it
  as Review's *Another look* step (`#exhibits/another-look`).
- **The writes.** Change saves the `_UNCLASSIFIED::` assignment and issuer and `unified_title_supersedes`; the fold's new
  **revise lane** applies it only while the replaced title still stands and the row is newer, renames an emptied
  credential (or retires it into one that exists), and receipts the records and the panel rows left under the old name.
  Keep saves `title_sweep_kept`. The sync carries both; Governance maps both to DR-07.
- **The classifier** learns the same conventions: procedures `ase-paren`, `arabic-level-numerals`, `language-levels`
  (skill Rule 5h). The next nightly run re-asks its unsure titles, since the procedures changed; the queue is one title.
- **Also:** I dispatched `daily-dashboard.yml` at 17:20Z so the audit read Sam's saves; it folded them and left the Review
  queue at 1 title, which broke `cer_procedures_test.py`'s non-empty check on main (fixed in #2623).

## Read first

`docs/reference/lanes/cer-procedures.md` (*Another look*, NEXT), then `docs/cer_v2_redesign_lessons.md` (its
SkyCoralberry section, with Sam's words).

## Open work, in order

1. **Read Sam's run through Another look** in `kb_curation` (his `reviewer_email`; rows with field
   `unified_title_supersedes` or `title_sweep_kept` after about 18:20Z), then the next fold's receipt
   (`kb/unclassified_fold/<date>/report.json`: `revise`, `credential_moves`, `credential_retires`, and any `held`).
2. **Move the panel rows** a move or retire lists (`panel_rows_left`): the `_CREDENTIAL_REVIEW::<old>` fields belong under
   the new title. A guarded UPDATE with before-values in a receipt (Rule 10 a2); `kb/_cred_rename_apply_supabase.py`
   shows the PATCH-or-DELETE pattern.
3. **Watch the rules on his edits.** Where he edits a proposal, the rule may be wrong. One reading to confirm with him if
   cards show it: course 3 and 2A read as Intermediate 1, course 4 and 2B as Intermediate 2 (his words said "2,3 or 2A,2B").
4. **Carried:** the routine (Sheet 149 card 2, Governance DR-07 first); IB on the AP pattern, then CLEP's official names;
   the Catalog's *Courses that may align*; training sites for a held title new to the reference, only if Sam asks.

## Lessons to honor

- A code in a title is often the credential's own name (OSHA 10, ICS 400, C-36). Take a course number only from the
  exhibit's own credit lines, and only on a title the colleges issue (the primary record).
- The statewide file pools a credential's credit lines once its local titles fold; a line belongs to the local title
  that names its code.
- A test on a live queue's size fails the day the queue empties; assert coverage or a partition.
- The dependency map records whether a file is served, so a new generated file ships with the PR that creates it.

## Let go

At sign-off this session dropped its PR watch (#2623) and deleted its one check-in; it holds no artifact watch.
