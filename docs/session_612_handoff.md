---
title: "Session 612 handoff: the Exhibits Queue and the panel trail ship, the anchor re-key dry run, the key sketch held for Sam"
date: 2026-11-08
session: 611 (SkyTadpole, Sam's hand-opened session, 2026-11-08 17:53Z to ~19:50Z; the CPL Queue routine fires next at 2026-11-09 06:12Z)
tags: [handoff, commons, common-subjects-reference, disposition-grain-student-detail, map-custom-reports, cpl-memory]
status: current
---

# You are Session 612

Your moniker is **SkySunflower** (galaxy names).

This is a **full** checkpoint: the run wrote memory rows (S604's three staged rows and two of its own) and moved three
lanes. Sam opened the session with the greeting only and gave no new direction; every merge below rode the standing
auto-merge rule, and everything on the hold list waits on his word on the sheet.

## What shipped

1. **S604's five open PRs merged** on a passing `test`: #2925 (the classifier's 413, families listed under their
   issuer), #2926 (read deadlines), #2928 (CI shard timings), #2929 (the expired live note shows 14 days), #2930 (the
   S604 checkpoint, handoff 611).
2. **S604's staged memory rows written** (#2931). The receipt's first summary was 440 characters against
   `cpl_memory_summary_check` (400); its Done list moved into `detail`. The playbook now measures a row before staging.
3. **Exhibits opens a Queue** (#2933, Sam's Commons ruling 1): `#exhibits/queue/<lens>`, six lenses in the ruled order,
   each an entry into a list the tab already holds and counted from that set; Blocked on Sky for a failed read, the
   classifier's errors or a stale review file. Review stays the default view.
4. **The shared List's side panel opens on its trail** (#2934): CPL Commons / List / filter / row, on Exhibits, the CR
   Reference, Program Requirements and Subjects; the List's word is the return and keeps the filter.
5. **The anchor re-key dry run** (#2935, ruling 3): `kb/_anchor_rekey_dryrun.py` reads the anchor's era from its keys
   (baseline the 2026-09-04 prefix fold) and applies pending maps only: 2 re-keys, 15 prefix swaps, 6 for Sam.
6. **Open, held for Sam: #2932**, `map_student_key_sketch` down to one pull. Its one read hit PostgREST's 1,000-row cap,
   so 74 pulls (148,000 hashes) piled up against a keep-two loop. Merging deletes the 73 older pulls at the next load.

## Decisions Sam made this run

None. The greeting carried no new direction, and no sheet reply arrived (Sheets 170 and 171 read empty at ~19:40Z).

## Read first

- [Open Asks Sheet 171](https://claude.ai/artifact/PUTmC3LaA2MQSu69paeqR2) (current; read its `replies` and Sheet 170's
  before acting). Cards 1 and 2 are 170's (the datashare review's home; the Exhibits ranking's one-day lag), card 3 the
  go on #2932, card 4 the six anchor entries.
- `docs/reference/lanes/commons.md`, `common-subjects-reference.md`, `disposition-grain-student-detail.md`.

## Open work, in order

0. **Read Sheet 171's and 170's replies.** On card 3 *merge*: mark #2932 ready, merge on `test`, and merge `main` in
   first; its lane line conflicts with `main`'s (take `main`'s marker text and note the merge). On card 4 *proposed*:
   mint the three collisions' next free numbers on DIES and PARA under the playbook, then apply the 20 with an alias map,
   a receipt and an era stamp (`_rekeyed_through`) on `kb/common_courses.json`; the three hospitality entries stay on the
   curator worklist.
1. **`cer-procedures`: read the next nightly procedures report** (`kb/cer_procedures_out/latest.json`) now that #2925 is in:
   `classifier_run.answered` above 0 and `errors` empty. If it still errors, the size guard in #2925 prints what it sent.
1. **Commons, next (#2921):** the Common Course Reference, one discipline or seed family at a time, after the Subjects
   repairs (ruling 4; CSM precedence stands; military CRs keep their own lane). Subjects' 93 stray codes stay with the
   curator under the 2026-09-08 ruling (`kb/csr_out/stray_triage.md`); Sheet 106 covered the checkable ones.
2. **Student-grain plan, PR 4 and 5** (lane `disposition-grain-student-detail`): summaries with a backfill, then the
   delete in the load (refresh the three credential-volume matviews first; per-title counts replace
   `exhibit_title_students`); the guards. Each on Sam's word.
3. **COBIx #2927, CI speed:** item 2 (load `cpl_funding.js` once per file; split the three longest), items 4 and 5; item
   6 costs Actions minutes (Sam's call); item 7 last.
4. **The routine's queue (`program-requirements-harvest`):** Redwoods' 8 local degrees (the CR-GE page `grad4`, Print link on `api-prod.elumenapp.com`);
   SLOs on 2026-11-09 UTC (Cuesta's trial on #2910, then `--next --skip cuesta`); the catalog sweep's next college; the
   program-requirements lane's objectives reread of the ten loaded colleges.
5. **Lanes the lint names as active this week:** `local-course-cr-alignment` (Sierra Training feedback into instructions);
   `map-users-student-contact` (the 7 search-tier candidates from Palomar and Canyons, the 17 blanks); `noncredit-cip-categories`
   (phases 1 to 3 wait on Jenni's Q1); `common-subjects-reference` (above).
6. **Carried:** the TMC Builder's browser save and resume; security step 5 (`org-phrase-scope-auth`); the `environment:` lines after Sam creates
   the environments; COBIx's small items (stable ITC keys, CPL Pathways on `college_id`, the Reading tiles); the Worker
   `?secret=` drop once #2893 is confirmed deployed; the Library's IACA and DSP Version 3 waits.

## Patterns that worked

- A lens counts from the list it opens: the List engine's `filterCounts`, Review's steps, the batch counted without
  fixing it.
- Read an id-keyed file's era from its keys before any alias chain
  (`docs/kb-notes/methodology-read-a-documents-era-from-its-keys.md`).
- A fake PostgREST in a test enforces a row cap, or it passes the bug.

## Safety patterns

- Lane prose never says the lens name in capitals or not: the sheet builder reads `NEEDS SAM` case-insensitively.
- `button.exh-w { all:unset }` wins a tie; raise specificity for any width rule on a word control.
- A staged memory receipt meets the table's CHECKs late: measure before staging.
- A local `main` can be stale and diverged; branch from `origin/main`.

## Let go

At sign-off this session drops its subscription on #2932 and holds no check-in. The Sheet 171 artifact watch was
arming at publish; the next session re-subscribes to #2932 if it is still open.

> *Greetings, you are SkySunflower (Session 612), see SkyTadpole's handoff — `docs/session_612_handoff.md` — let's keep rolling with our queue.*
