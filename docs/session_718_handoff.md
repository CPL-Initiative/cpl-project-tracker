---
title: "Session 718 handoff (from SkyGannet, S717, Sam's plain session of 2026-11-23: a Common SUBJ for every MQ discipline, the 20th edition, Colleges by source, a sidebar beside the view)"
created: 2026-11-23
updated: 2026-11-23
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_719_handoff.md
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows `docs/session_699_handoff.md`
and the routine's own newest handoff, never this file. **Numbering.** The routine's last checkpoint wrote
`docs/session_716_handoff.md` and SkyAlbatross wrote 717, so this plain handoff takes 718. If 718 is taken when you
start, take the next free number and say so in your handoff.

# You are SkyPetrel (Session 718)

From SkyGannet (S717), Sam's plain session of 2026-11-23, 18:17Z to about 20:45Z. A **full checkpoint**: two lanes
moved (common-subjects-reference, commons) and #3726 carries a data receipt. Skipped: steps 2 and 3 (neither README
lists the Subjects generators; the lanes carry them), 7 (no re-mint, the pipeline did not move) and 9 (not a step).
The `cpl_memory` rows and the status files are the conductor's, in the same checkpoint PR.

## Open with the standing block

1. **COBIx:** as in 715 and 717, Sam said no COBIx check-ins for now. Start `bash scripts/cobix_watch.sh [state dir]`
   only if he asks.
1a. **Clone light:** `git clone --filter=blob:none` (or `--depth=1` when history is not needed), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head; no dependency-map rebuild inside a PR; no full rerun when the
   input fingerprints match.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes; a fix goes ahead of the next wave only
   when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the M-IDs, so
   its fixes rank by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order:** #3726, then #3727, then this checkpoint PR. `test` aggregates gate, suite (1) to (6) and lints.

## What shipped

- **#3724 (merged):** Colleges by source, `#commons/subjects/sources`: all 118 colleges, a status word per way to look
  (catalog, catalog system, class schedule, department list) and Next, from `kb/_subject_sources.py` and the new attempts
  register `kb/reference/subject_source_attempts.json`. Closes handoff 717's open work 1.
- **#3725 (merged):** the course panel's move tools: Collapse all, a move row per course group, the credit-then-noncredit
  picker, VOCE as *Vocational: Noncredit*, the pinned foot bar.
- **#3726 (open):** the 20th-edition MQ handbook (`kb/reference/mq_handbook_20th.json`: 251 disciplines, three list
  types, the Title 5 provisions), the MQ view's data (`kb/status/mq_view.json`), and a Common SUBJ for the 95 MQ
  disciplines that had none (receipt `kb/receipts/csr_assigned_codes_s717.json`), with a `formerly` record on a code change.
- **#3727 (open):** a sidebar opens beside the view, never over it; the rule is in CLAUDE.md and `presentation_doctrine`.
- KB note `docs/kb-notes/methodology-a-reference-seeded-from-its-consumers-cannot-see-what-they-never-reached.md`; a
  data source entry (the outline's MQ discipline) in `docs/reference/data_sources.md`.

## Read in order

1. `docs/reference/lanes/common-subjects-reference.md` (Status and NEXT).
2. `docs/reference/lanes/commons.md`, the *Subjects, by confidence* paragraph.
3. `docs/common_subject_code_tab_lessons.md` and `docs/commons_lessons.md`, the S717 sections.
4. `docs/coursecontrolnumber_remint.md` before the re-point.

## Sam's decisions this run (in `cpl_memory`)

- `r-mq-view-more-than-codes-sam-2026-11-23`: an MQ view joining disciplines, codes and decisions; *"let's run with
  it"*, with a link on the Commons Subjects card.
- `r-top-vocational-flag-sets-mq-type-sam-2026-11-23`: the TOP vocational asterisk sets a course's MQ type (master's or
  experience), never its discipline.
- `r-csr-codes-settled-on-list-confidence-not-confirmation-sam-2026-11-23`: every MQ discipline gets a code without a
  course; a code on the list is settled; confidence informs; Sam edits with a note; a check flags collisions. It
  supersedes item 6 of the 2026-09-03 authority sheet (C-ID ACCT as a chip on Business).
- `f-mq-handbook-revised-yearly-sam-2026-11-23`: the handbook changes yearly, codes rarely, so the code keeps a history.
- `r-sidebar-beside-view-sam-2026-11-23`; `r-sidebar-tables-sort-resize-and-stack-sam-2026-11-23` (not built).
- `d-next-cip-for-mq-type-sam-2026-11-23`: next, test CIP in place of TOP for MQ type.

Findings: `f-mq-20th-edition-vs-dataset-s717`; `f-csr-seeded-from-mids-left-95-mq-disciplines-uncoded-s717`.
**Correction:** commit `8afaa532` says "LING now calls LING"; the statewide calls still read ANTH, BUSI, CULN, REAL,
JOUR and AVIA, because the model votes from where M-IDs sit. They move at the re-point re-mint.

## Open work (from the lanes' NEXT)

1. **Merge #3726, then #3727,** on a green `test`. Before #3726: `kb/discipline_canonical_subj4.json` holds ESTG for
   Estimating while the receipt and `kb/status/csr_proposed_codes.json` say ESTI; make the three agree.
2. **The MQ view in COBI,** `#commons/subjects/mq`, in the Commons look of the mock
   (https://claude.ai/artifact/SHS5eNN4nb5vLkNCzzWvVE). Its sidebar is the Subjects statewide list filtered to a common
   code, a new filter with its own address. Add a link on the Commons Subjects card, make the sidebar's tables sort
   and resize, and let a count open a second sidebar.
3. **Re-point the folded local codes:** ACCT, ACCTG, ACC and ACTG to ACCT under Accounting; LING; HOSP; the religion
   codes to RLST; MCOM; AERO, with its AFROTC courses to MILS. A re-mint under the playbook, dry run first.
   `kb/reference/subject_discipline_map.json` still sends ACC, ACCT and ACCTG to Business.
4. **CIP in place of TOP for MQ type** (Sam's ask for this session).
5. **Collect the outline's MQ discipline in the SLO pass** (`kb/_course_outcomes_read.py` stops at the heading today).
6. **The panel over COBI's top header bar;** other sidebars convert at their UI pass.
7. **Re-baseline `csr-quarterly.yml` on the 20th edition** before its January compare.
8. **From handoff 717, unchanged:** Sam's ask 3, the same process on every other Commons card (`subjectsParts` in
   `commons_front.js`); probe round 2 and the eLumen, curriQunet and CourseLeaf filers; the code history's next readers;
   the mint takes Confident calls; raise the 787 Unsure codes; Sam's rulings (FLNG, Athletics into KINE); his twelve AED
   titles, then one re-mint.
9. **Waiting, by slug:** `cer-procedures` (the pair apply, on the CER run), `my-college-action-page` (the live count
   after the rebuild) and `program-requirements-harvest` (the CPL Queue routine's collection). This session moved none.

## Patterns that worked

- Read the authority whole and cite its printed page (printed = PDF page - 6).
- Write a bulk code change with a receipt that `git revert` undoes, under a cohort name ending `@bot`.
- Read a minted code aloud before writing it (CERT, DSCO, MDIV, SANT, FATR each read as another word).

## Pitfalls

- **A generated file that reads the common-code list goes stale when the list changes:** rebuild
  `statewide_subject_codes.json`, `local_subject_recommendations.json`, `mq_view.json` and `csr_proposed_codes.json`.
- **`check_generated.sh`'s tail can look clean while the docs lint reads STALE;** read every line.
- **The CSR tab counts a code as a person's pick unless its reviewer ends `@bot`.**
- **A sidebar test reads `root.classList` for `csb-beside`.**
- **#3727 and this checkpoint both write `kb/docs_audit/2026-11-23.*`;** rerun the lint after the second update from
  `main`.

## Let go

At sign-off: the watches on #3726, #3727 and the checkpoint PR, and the artifact watch on the MQ mock. No COBIx watcher ran.

Spend: not available; 2026-11-23T18:17Z to 2026-11-23T20:50Z.

Opening line: *Greetings, you are SkyPetrel (Session 718), see SkyGannet's handoff — `docs/session_718_handoff.md` — let's keep rolling with our queue.*
