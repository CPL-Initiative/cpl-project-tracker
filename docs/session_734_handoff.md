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

## Read in order

1. `docs/reference/lanes/common-subjects-reference.md`, "The stray codes and the title hunt".
2. `kb/stray_code_remint_out/2026-11-25/report.md` (the held list and its reasons).
3. `docs/common_subject_code_tab_lessons.md`, S733 and S730.
4. `docs/coursecontrolnumber_remint.md` before the apply.

## Open work, in order

0. **The stray-code apply** (common-subjects-reference NEXT): build `--apply` in `kb/_stray_code_remint.py` under the
   playbook: refuse without `--receipt` and `--fresh-read`; a fresh live read of `kb_curation` for every retiring id
   (a person's row holds its id); remove the ids from `kb/coci_minted_courses.json`, `coci_minted_singletons.json`,
   `coci_minted_memberships.json` with `retire.json` as the receipt; the 24-ish merged shells' aliases registered in
   `kb/alias_chain.py` ALIAS_MAPS; a second reader before the dispatch; then the daily build. Sam saw the dry run's
   numbers and said keep rolling.
1. **The 50 local subjects under 90**: Sam picks from the list; a pick files the common subject and rescores the row.
2. **The rest of the common-subjects NEXT:** the re-point of the folded local codes (a re-mint, dry run first); ECONMT
   and Electricity's adult-education codes.
3. **Commons lane NEXT** (handoff 731's items 1 to 6): step 4's remaining Needs you items; step 3's Courses mount;
   Gather; Subjects, CRs and Exhibits on the anchor pattern; CI's second half; ESL after 2026-11-29.
4. **0-100 everywhere:** each Commons procedure that still prints Low/Medium/High (the recommender's `_levels` in
   `kb/_build_local_subject_recommendations.py`, the subject-title CSV's `title_level`) converts at its next pass.

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

## Safety

- Rule 10: bulk writes insert-only under a cohort email, with a committed receipt; the apply's receipt restores
  every removal.
- Person-settled wins: a save in the Commons is terminal.

## Let go

At sign-off: no PR watch remains (#3841, #3843 and #3846 merged and unsubscribed; this checkpoint's PR merges at
sign-off); the 18:04Z check-in fired and is spent; no artifact watch; no COBIx watcher; the dry-run worker finished.

Spend: not available; 2026-11-25T17:04Z to 2026-11-25T18:20Z.

Opening line: *Greetings, you are SkyWhimbrel (Session 735), see SkyGodwit's handoff — `docs/session_734_handoff.md` — let's keep rolling with our queue.*
