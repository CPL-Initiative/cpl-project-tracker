---
title: "Session 734 handoff (from SkyGodwit, S733, Sam's plain session of 2026-11-25: COBIx's titles filed, the stray-code rescore scored 0 to 100, the re-mint dry run)"
created: 2026-11-25
updated: 2026-11-25
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is for Sam's next plain session. Handoff 732 is the CPL Queue routine's (S731, SkyFrigatebird);
a routine firing follows that file, never this one. A plain session follows this file: take the next free session
number when you start (735 or above, if the routine has taken 734) and say so in your handoff; the moniker stays yours.

# You are SkyWhimbrel, Sam's next plain session

From SkyGodwit (S733), Sam's plain session of 2026-11-25 (17:04Z to about 18:20Z). A **checkpoint with the lane moved**
(the common-subjects-reference lane's stray-code state and NEXT); no Rule 10 data write beyond `cpl_memory` rows; the
re-mint is a dry run only. Skipped: step 2 (no KB structure change), step 3 (no user-facing surface), step 5 (no note
crossed the bar), step 7 (no re-mint applied, no roadmap row moved); step 12 refreshed `subjects.json` only (the harvest is the routine's, which wrote `program-requirements.json` last).

## Open with the standing block

1. **COBIx:** Sam said no COBIx check-ins for now. Start `bash scripts/cobix_watch.sh [state dir]` only if he asks.
1a. **Clone light:** `git clone --filter=blob:none` (or `--depth=1` when history is not needed), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head (suite 1-6 and lints 1-4); no dependency-map rebuild inside a PR;
   no full rerun when the input fingerprints match. Never open a PR on a branch that holds another open PR's commits.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes (`r-collection-first-sam-2026-11-20`);
   collection's fixes rank by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
2b. **Before a push, `bash scripts/check_generated.sh` must read all ok.**
3. **Merge order:** this checkpoint's PR first. Nothing else of this line is open; dependabot's #3383 stays.

## Sam's words this run

- **RULED** `r-confidence-0-100-in-all-commons-procedures-sam-2026-11-25` (verified): *"remember that i want to use
  confidence bars 0-100 rather than low, med, high throughout all commons procedures"*. Every worklist, rescore,
  dry-run scope and report in a Commons procedure carries a 0-100 score and a threshold, never Low/Medium/High.
- *"merge the dry run and keep rolling"*: #3843 merged on his word.
- He asked when the Commons numbers change: the Subjects card reads the committed status files, live since #3841's
  Pages deploy; Needs an M-ID and the recommendations refresh in the 06:17Z daily build; the stray-code counts move
  only after the apply.
- On the CSR Local subjects view (row A, one Interdisciplinary Studies course under Astronomy): *"the edit button
  isn't working right and the sidebar showing the courses does not allow me to move a course to another common
  subject"*, then *"there should at least be a side bar that allows me to move one or more courses to another
  subject"*. Built in #3851.
- *"keep rolling"*: the apply, the seeder fix and the 0-100 recommender followed.

## What shipped

- **#3841** (`ed4c7526`): `kb/_file_found_subject_titles.py --csv` files a filled leftovers row (a title and its source
  URL) as a find; a `department label` row stays a hint; a CSV find names the filled file as its `run`. COBIx's
  batches filed: 911 titles at 18 colleges. Subject family rebuilt: 116 colleges named, 9,058 named codes.
- **#3843** (`44f5c0d7`): `kb/_stray_code_remint.py`, a dry run. **DECIDED** `d-stray-remint-retire-not-rekey-s733`:
  in-scope M-IDs retire and their courses return to Needs an M-ID; a merged shell takes an alias to its merge target;
  a local subject with only a proposal (no filing) keeps its ids held until filed.
- **#3846** (`7a591bb9`): `kb/_stray_code_rescore.py` scores the 116 stray local subjects 0-100 from measured rates
  (statewide model probability; at least 91 where the college's heading names the discipline; at most 50 with no
  college title or where title and filing disagree). Threshold 90 (the model's self-recall: 97%). 66 in scope, 50 for a
  person (`kb/subject_title_hunt/20261125_stray_codes_a_person_picks.md`). Dry run: **92 retire, 48 held, Needs an M-ID
  1,819 to 1,918** (`kb/stray_code_remint_out/2026-11-25/report.md`).

- **#3851** (`9bc58ecc`): CSR Local subjects, a sidebar listing a code's courses with their M-IDs; check one or more,
  pick a Common SUBJ, "Move the checked courses" (`course_subject_decision`, shared from `commons_subjects.js`), with
  take-back; Edit also changes the filing. `kb/_statewide_subject_codes.py` adds an `mid` column to the course files.
- **#3853** (`a0a709de`): **the stray-code re-mint applied.** 60 retired, 20 merged shells aliased (registered in
  `kb/alias_chain.py`), 35 held as unfiled; 27 bot `kb_curation` rows deleted live at 19:40Z (27 matched, 27 deleted;
  restore SQL in `kb/stray_code_remint_out/2026-11-25/applied/`). Needs an M-ID 1,819 to 1,881. Second reader: FIX
  THEN APPLY (the post-apply chain's re-seed had dropped 99 assigned codes; main's seed kept). Daily build dispatched.
- **#3857** (`584eaa08`): `kb/_seed_canonical_subj4.py` carries curator-set entries and stamps forward; guard
  `tests/csr_seed_keeps_codes_test.py`.
- **#3858** (`864ed8d4`): `tests/honors_of_rows_check_test.py` case 5 tolerates a moved payload (main was red).
- **#3859** (`8f01d33c`): the local-subject recommender scores 0-100 (caps: thin 59, program titles 89, disagreement
  89; agreement joins `1 - prod(1 - p)` to 99); totals `*_90_plus`, `*_60_to_89`, `*_under_60`; the Subjects panel
  draws `CPL_COMMONS.confBar`.

## Read in order

1. `docs/reference/lanes/common-subjects-reference.md`, "The stray codes and the title hunt".
2. `kb/stray_code_remint_out/2026-11-25/report.md` (the held list and its reasons).
3. `docs/common_subject_code_tab_lessons.md`, S733 and S730.
4. `docs/coursecontrolnumber_remint.md` before the apply.

## Open work, in order

0. **The statewide-codes view and MQ chip to 0-100:** a worker was converting `levelOf`/`confWords` (Confident,
   Likely, Leaning, Unsure) in `commons_subjects.js` on `claude/s733-statewide-0-100` at sign-off; check the branch, open
   its PR, merge on green.
1. **The 35 held and the 50 under 90**: file their common subjects (Sam's picks list, or courses moved in the #3851
   sidebar), then rerun `kb/_stray_code_rescore.py` and the dry run for the rest.
1a. **The S653 honors plan needs a redraw** (`kb/_honors_of_s653_dryrun.py`): the new alias map makes it stale.
1b. **COBIx's CSV format:** new subject-title CSVs carry a 0-100 `title_confidence`, no `title_level`
   (`kb/subject_title_hunt/README.md`); tell COBIx when Sam resumes check-ins.
2. **The rest of the common-subjects NEXT:** the re-point of the folded local codes (a re-mint, dry run first); ECONMT
   and Electricity's adult-education codes.
3. **Commons lane NEXT** (handoff 731's items 1 to 6): step 4's remaining Needs you items; step 3's Courses mount;
   Gather; Subjects, CRs and Exhibits on the anchor pattern; CI's second half; ESL after 2026-11-29.
Beside the queue: **program-requirements-harvest** is the CPL Queue routine's (handoff 732); **implementation-funding**
waits on the team. A plain session "Simplified funding page refinements" holds `funding-model/` and `cpl_funding.js`.

## Patterns that worked

- `pr-gate` for every merge check; read `test` as suite 1-6 plus lints 1-4 (no run is named `test`).
- A worker for the dry run on a sibling branch while the first PR's CI ran; merge `main` into it after the squash.
- Run `tests/subject_headings_filer_test.py` locally before pushing filed titles.

## Pitfalls

- A squash merge means a branch cut from the PR head conflicts on every shared file: take `main`'s side for generated
  files after the merge.
- A dry run's pins must be refrozen (`--freeze`, then replace the PINS block) whenever its scope rule changes.
- `CLAUDE.md` is over its budget (65 KB of 60 KB): do not add to it.

## Beside this session: the funding page side job (2026-11-25, 17:05Z to about 19:20Z)

A separate session, *Simplified funding page refinements*, worked the public funding page while SkyGodwit worked the
queue (one writer each; no file overlap). A light checkpoint; it adds this section instead of a new handoff, so this
file stays yours. What landed, all on the public page (lane `implementation-funding`, the Simple View lines):

- #3844, #3849: the Simple view switch shows again (white on white before); a caret on each row; # and District off
  in Simple view; the As of / Ver. label hidden from readers not signed in; a college's name opens its MAP landing
  page in a bottom bar (65%, resizable, works inside COBI's frame). Sam turned Simple view on for the public.
- #3845: MAP's College Contacts report now carries *Noncredit CPL Lead* (+ Email); the sync fills
  `map_college_contacts.nc_cpl_lead`, and `has_nc_cpl_lead` reads it or the landing-page title. 27 colleges meet the
  NC lead condition (was 2). Migration `kb/migrations/2026-11-25_nc_lead_from_contacts.sql`, rollback beside it.
- #3852 (merged): *How to maximize funding* on each credit priority row, a panel beside the table
  with the row's dollars, what the model counts, the strategies, Get Help in Office Hours, Priority N Strategies and
  Ask Sierra.
- Offered, not asked for: a phone layout for the institution table (the lane's NEXT).

## Safety

- Rule 10: bulk writes insert-only under a cohort email, with a committed receipt; the apply's receipt restores
  every removal.
- Person-settled wins: a save in the Commons is terminal.

## Let go

At sign-off: no PR watch remains (#3841, #3843, #3846, #3851, #3853, #3857, #3858 and #3859 merged and unsubscribed;
this checkpoint's PR merges at sign-off); the 18:04Z check-in is spent; no artifact watch; no COBIx watcher; the
statewide 0-100 worker may still be finishing on its branch (item 0).

Spend: not available; 2026-11-25T17:04Z to 2026-11-25T22:15Z.

Opening line: *Greetings, you are SkyWhimbrel (Session 735), see SkyGodwit's handoff — `docs/session_734_handoff.md` — let's keep rolling with our queue.*
