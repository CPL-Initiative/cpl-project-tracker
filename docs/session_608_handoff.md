---
title: "Session 608 handoff: Columbia 31 to 52 passing; its local degrees get CC-GE's 21 and the 60 as a floor, the reconcile in flight"
date: 2026-11-08
session: 607 (SkyBode, the CPL Queue routine's 10:12Z firing, 2026-11-08)
tags: [handoff, program-requirements-harvest, scheduled-sessions]
status: superseded
superseded: true
superseded_by: session_621_handoff.md
---

# You are Session 608

Your moniker is **SkyCondor** (galaxy names).

This checkpoint is **light**. No Roadmap row moved and there was no re-mint. The run's data writes were runner steps,
each with its committed receipt: reread 42470609423
(`kb/receipts/program_requirement_records_college_reread_columbia_42470609423.json`, 23 replaced, before-values) and
display apply 42470928680 (its applied record commits to the branch). Skipped, each unchanged this run: `kb/README.md`,
`README.md`, the pipeline view, KB notes, `cpl_memory` (the finding is in the lessons; a scheduled firing cannot write
through `execute_sql` anyway), and the dependency map's `oversized_doc`, which is generated. No decision sheet was
rebuilt: nothing new waits on Sam, and the contacts titles question (item 4) is still for the next sheet.

## What shipped

1. **#2917 carries #2916 and #2915.** Both heads were runner commits, which start no `test`. Close both with a pointer
   to #2917 once it merges.
2. **Columbia, step 12: 31 to 52 of 82 passing.** S606's Cal-GETC step moved all 21 transfer degrees (reconcile
   42466476925). Reread 42470609423, display build `15f40f7d1781`, `step=display` 42470928680.
3. **Columbia's local degrees.** Page read 42470655341 (`kb/college_reads/columbia_ccge_pattern.json`) found CC-GE's
   *"complete 21 semester units of general education coursework"* and the degree page's *"Complete a minimum of 60
   degree-applicable semester units"*. Two `set` steps in `kb/program_requirements_reconcile.json` give a page naming the
   CC-GE pattern GE 21 to 34 and the 60 as a floor. The college gate moved from `transfer` to `associate` (it runs
   before any step's own gate). Simulated on the filed records, 28 of 30 failing degree checks pass. **Reconcile
   42471133430** (`extract=0`) was queued behind the display apply at sign-off.
4. The start's reads found nothing new: no to-dos marked done, no Exhibits-tab rules or re-analysis requests, and the
   Library's two open requests (DSP Version 3, IACA) are known waits.

## Decisions Sam made this run

None (an unattended firing). The local-degree steps proceeded on the recommendation; deleting the two steps reverses
them. Put this on the next sheet as *Proceeded on the recommendation (S607, 2026-11-08); reply to reverse*.

## Open work, in order

0. **#2917:** read reconcile 42471133430's result on the branch (`kb/program_requirements_college/columbia/summary.json`;
   expect about 78 passing). Then dispatch `step=reread` with `college=Columbia College`, run
   `kb/_build_roep_display.py` on the branch (it needs `openpyxl`), commit, and dispatch `step=display`. Merge #2917 on a
   passing `test`, then close #2916 and #2915 with a pointer. A runner commit as head starts no `test`, so push a
   session commit last.
1. **Redwoods (50%):** the by-shape read, as Columbia's (lessons S605). Never two runs on one host.
2. **Write the staged memory rows when a person can approve the prompt:** `kb/receipts/cpl_memory_2026-11-08_s603.sql`
   and `..._s604.sql`. Check that the slugs are absent first. This belongs to Sam's next hand-opened session.
3. **SLOs (step 11), on 2026-11-09 UTC:** Cuesta's trial on #2910. `next_slo_colleges.py --college cuesta` prints the
   `.run` lines. The day's one full read goes to `--next --skip cuesta`.
4. **Contacts titles for Sam:** does *Dean of Enrollment Services* (4 colleges) read as `dean_ar`, and *Dean of Career
   Education* as `dean_cte`? A question for the next sheet. The next weekly read is Sunday 2026-11-15.
5. **Library side lane:** IACA waits on Crystal Nasio's note, and DSP Version 3's draft waits on Sam's Replace.
   `docs/library_handoff.md` keeps the alignment, CER and Sierra items.
6. **Carried, unchanged:**
   - the TMC Builder's real-browser save and resume;
   - **security step 5** (`docs/security/cobix_round1_reply_2026-11-05.md`), each item its own PR under Sheet 167 card 4;
   - the `environment:` lines, after Sam creates `database` and `database-scheduled`;
   - COBIx's small items (stable credential keys, CPL Pathways on `college_id`, the "Reading" tiles), with one vault PR;
   - the Worker `?secret=` drop, once Sam confirms #2893 is deployed;
   - noncredit categories, which wait on Jenni's Q1.
7. **Lanes worked this week whose NEXT waits:**
   - On the team or on real traffic: `local-course-cr-alignment`, `my-college-action-page`, `reviewer-session-lifetime`,
     `sierra-retrieval-corpus`, `commons`, `common-subjects-reference`.
   - On a step or a person: `map-users-student-contact` (the next weekly read), `org-phrase-scope-auth` (step 5),
     `noncredit-cip-categories` (Jenni), and `cer-procedures` (Sam's *Another look*).
   - Sam steers: `college-district-identity`, `common-cr-reference`, `csm-workspace`, `eacr-exhibit-cr-adoption`,
     `governance-team-enablement`, `implementation-funding`.
   - `library`: item 5.

## Safety patterns

- A college-level `awards` gate in the reconcile file runs before every step's own. Check it before you add a step
  for another kind of award.
- Simulate a reconcile step on the filed records (`reconcile()` with a text naming the pattern, then `degree_check`)
  before you dispatch the run.
- A degree floor passes any sum past it, so check that each degree over the floor passes its own program check first.
- An unattended firing cannot write through `execute_sql`. Reads work.

## Let go

This session made no PR subscriptions, check-ins or artifact watches. Open PRs: #2917 (this run's; reconcile in
flight), #2916 and #2915 (carried by #2917), #2910 (the routine's, Cuesta's trial), and #2894 (Sam's review).
The vault session note merged as CPLBrain #717.

> *Greetings, you are SkyCondor (Session 608), see SkyBode's handoff — `docs/session_608_handoff.md` — let's keep rolling with our queue.*
