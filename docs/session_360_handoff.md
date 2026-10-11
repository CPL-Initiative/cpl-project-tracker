---
title: Session 360 handoff — Sam's review flow first; the emphasis loads, the COCI status chips, Long Beach City
date: 2026-10-11
session: 359 (SkyMoss)
tags: [handoff, program-requirements, harvest, phase-2, rccd, records-view, coci-status, checkpoint]
status: current
---

# You are Session 360

Your moniker is **SkyLichen**. SkyMoss (S359, `session_01Mxoqq1zumGkazfcUjzNnpT`) recovered RCCD's Liberal Arts
emphasis degrees, carried out Sam's Sheet 60 ruling, and read Sam's first Mt. San Antonio sample. It checkpointed at
the context warning (109K left), by Sam's choice, so his newest ask is yours first.

## First, in this order

0. **One writer.** `list_sessions` (`mine: true`). S359 drops its check-ins and holds no PR watch at sign-off.
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `records-view`, `coci-status`, `rccd`. S359's rows:
   `sam-records-review-flow-split-auto-advance-2026-10-11`, `sam-mtsac-sample-reading-rules-2026-10-11`,
   `sam-remove-eight-dropped-rows-sheet-60-2026-10-10`, `roep-curriqunet-subject-number-lists-2026-10-10`,
   `roep-lbcc-catalog-address-2026-10-10`.
2. **No sheet is open.** Sheet 60 (https://claude.ai/artifact/7asFQExdaXFHRmEMnCxiM2) is answered and carried out; the
   builder writes no sheet until a lane marks an ask.

## Priority 1: Sam's review flow (2026-10-11, his words in the memory row)

*"Have the split screen open automatically when I click in to review. When I choose Confirm or Save Note close the
screens and bring me to the next item to confirm. Note when opening the confirm list the first screen that pops up is
the COBI main tab then it flashed to the confirm screen--just seems like an unnecessary delay."* All in
`program_requirements.js` (the split is `prh_split`, the verdict RPC `program_record_verdict_add`): (1) clicking into
a record to review opens Side by side; (2) a saved Confirm or Save note closes the split and opens the next record
waiting on his reading; (3) the link into the list loads straight to it. jsdom tests, `npm run a11y` on the view.

## Priority 2: the RCCD emphasis loads, then one display build

- Moreno Valley's 7 are loaded (run 38097994998, receipt on `claude/s359-rccd-load`).
- Norco's and Riverside City's re-runs (with #1967) were running at the checkpoint on `claude/s359-nc-extract` and
  `claude/s359-rcc-extract`. Check each filing: Norco's Kinesiology A.A.-T (37169), and Riverside City's Kinesiology
  A.A.-T (37474), Dance (40271) and Pilates (40446), should read `page_claimed` with no record, and nothing else should
  be extracted. Merge each into `claude/s359-rccd-load`, fresh live read, dispatch `step=load` per college.
- Then one display build from that branch (standing go), apply through the display job, verify by the combined md5.
- Humanities, Philosophy & Arts runs past the extraction's max_tokens at all three colleges: an Edge Function change.

## Priority 3: Sam's five reading rules (`sam-mtsac-sample-reading-rules-2026-10-11`)

- **COCI status chip on every mismatched course.** The five catalog additions are in the full Program Course File as
  **Inactive** under an older control number (KB note `methodology-a-missing-course-may-be-a-retired-version`).
  `_build_roep_display.py` already loads every status in `program_courses()` (via `bpc.load_membership()`) and filters
  to `KEEP_STATUS`: keep the other rows, attach `{status, program_ccn, current_ccn}` to each catalog addition and each
  listed-not-printed course, name them in the "Catalog and state file differ" gap, and chip them in `roepTile`
  (`cpl_pathways.js`) and `rowMark` (`program_requirements.js`).
- **COCI units where the catalog prints none** (already `units_from_state_file` for listed courses; extend to the
  course list for additions). Noncredit hours are in no file we hold: Sam was asked for a source.
- **A unit difference kept and chipped** (program level).
- **Recommended electives as their own block** and **printed careers kept**: extraction function changes; a re-read of
  loaded records costs model calls and waits on Sam's go.

## Priority 4: Long Beach City

Registry corrected to https://lbcc-public.courseleaf.com/, 2026-2027 (receipt
`kb/receipts/program_source_registry_lbcc_catalog_2026-10-10_s359.sql`). Its capture (run 38092572555,
`claude/s359-lbcc-read`) was still running at the checkpoint after two hours. When it files, read `would_extract` in
`capture_preview.json`, add a NEEDS SAM marker to the lane, and build the next sheet with the extraction card (count and
cost). Ideally its extraction carries rules 4 and 5.

## What shipped (S359)

#1965 (subject-number lists, `would_extract`, the LBCC address and memory receipts), #1966 (a number may lead with a
letter), #1967 (duplicate index entries are one page), #1968 (the eight rows removed). Extractions: Moreno Valley 8
($1.69), Norco 11 ($1.78), Riverside City 11 ($1.86).

## Not done at this checkpoint

The UI pass (step 9) was skipped for lack of room; the ledger keeps its view due.

## Safety patterns

- Read a sheet's store before executing; a delete keeps every full row in a receipt pushed before the write.
- A data write goes through `apply_migration` with a committed receipt (`execute_sql`'s guard refuses it).
- Measure before a guard: four of 526 pages named another award, and three of them were right.

## Sign-off line for Sam

Greetings, you are SkyLichen (Session 360), see SkyMoss's handoff — `docs/session_360_handoff.md` — let's keep rolling with our queue.
