---
title: "Session 708 handoff (from SkyPrion, S707, Sam's plain session of 2026-11-22: main green again, AED unmapped, subjects before re-mints)"
created: 2026-11-22
updated: 2026-11-22
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_714_handoff.md
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows `docs/session_699_handoff.md`
and the routine's own newest handoff (S703 SkyDovekie writes 704 on #3674), never this file. **Numbering.** If the
routine has taken 708 by the time you start, take the next free number and say so in your handoff.

# You are SkyNoddy (Session 708)

From SkyPrion (S707), Sam's plain session of 2026-11-22, 16:29Z to 17:49Z. A **full checkpoint** (lane state
moved, a `cpl_memory` receipt). Skipped: step 2 and 3 (no KB structure or user-facing surface change), 7 (no re-mint, the
pipeline did not move), and in 12 `kb/status/program-requirements.json` (the routine's open #3674 writes it; one writer
per file).

## Open with the standing block (unchanged from handoff 703)

0. **COBIx's brief is on issue #3358** (comment 7064588752); then issue #3655, the Subjects brief. No COBIx comment
   arrived between 16:30Z and 17:49Z.
0a. **Inside the routine's hours (06:12Z to 14:12Z), open a draft PR in your first minutes whose body declares a
   side-session scope** and says the routine proceeds.
1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background.
1a. **Clone light:** `git clone --filter=blob:none`, never a full clone.
2. **Merge rules:** at most 3 open PRs (the routine's own count separately), oldest first, one update from `main` right
   before a merge, `test` green on the head.
2a. **Sam's work order (2026-11-20):** collection first, ranked by the M-ID cards it unblocks.
3. **Keep a plain session to about an hour and never stand the queue down.**

## What shipped

- **#3691** (`68e839fb`): `main` had been red since 15:44Z on `tests/exhibits_review_card_panels.test.js` check (8).
  The CER procedures run `ac670dd0` cleared the classifier proposal that carried *CAL FIRE Basic Firefighter Training
  (219-hour)* into `kb/exhibits_related.json`; the matcher's self-recall over the shipped titles then found 0 pairs.
  The test now adds the card's own title when the reference lacks it, keeping both checks at full strength.
- **#3687** (S705's PR, `1bdddcd2`): merged on a green `test` after #3691.
- **#3693** (`6cdbb9d6`): the subject map leaves AED unmapped. Only Cerritos uses AED (Adult
  Education, its department list); as the modal subject it gave 46 M-IDs an ELEC prefix, 45 of them shared with other
  colleges (ELEC M90xx holds High School English, Spanish, US History, GED prep, Fitness for Older Adults; about 15
  are electrical). AED joins `_deliberately_unmapped` in the map and its seed; `kb/status/local_subject_titles.json`
  rebuilt (only Cerritos AED's `was` changes). Nothing re-minted.

## Decisions Sam made (verbatim in `cpl_memory`)

- `r-subjects-before-remint-sam-2026-11-22`: *"I'm thinking it would be best to finish the common subject and local
  subject titles before reminting MIDs."* Then: *"order sounds good. i do need to define finish--you can help me
  establish when we have a sufficient collected and curated dataset to work with for the needed or prioritized remints"*.

## Decisions the session made (each Sam's to revise)

- `d-remint-order-subjects-outcomes-dryrun-s707`: settle the scope's codes, rerun the outcomes comparison, then one dry
  run. Sam approved the order.
- `d-remint-ready-gate-draft-s707`: the draft definition of *finish*, an M-ID readiness gate (in the commons lane).
  Sam asked for help setting it; give him the AED scope's count by the gate and let him adjust it.
- `f-aed-electricity-gave-elec-m90-s707`: the finding.

## Open work, from the lanes' NEXT lines

1. **`commons`, the Subjects page (#3655), in order:** (1) a readiness count per M-ID by the draft gate, in a file the
   Subjects page and the re-mint dry run both read, AED scope first (221 members: 66 settled, 28 at read colleges with
   no code, 127 at colleges not read; 74 local codes, led by IHSS, HSED, BSHS and TUTOR/TUTR); (2) statewide defaults by
   the DR-25 route for the scope's codes that read the same everywhere; (3) rerun `kb/_mid_outcomes_compare.py` on
   `course_outcomes` (45,270 rows at 35 colleges, against 17,349 at 18 on 11-12); (4) `kb/_sync_subject_decisions.py`
   reads `course_subject_decision`; (5) one re-mint dry run for the ready AED M-IDs under the playbook; then the rest of
   the lane's list. Measure the AED scope from the 45 ELEC, IDST and ESOL M-IDs: Supervised Tutoring (LSKL M9004, 90
   members) joins a naive count through one Cerritos course.
2. **For the routine (collection):** NOCE has no outcomes or objectives in `course_outcomes`; Mt. SAC's 1,073 SLOs are
   all credit and its 251 noncredit courses (VOC 198, BSHS 22, ESL 11) have none; SDCCE has 198 objectives (loaded
   today). Those three serve the AED scope's high school and noncredit codes. Tell the routine through its handoff or
   #3655; its queue file is its own.
3. **`commons`, the rest, `cer-procedures`, `repo-size`, `common-subjects-reference`, `library`:** as their lanes list
   them. The cer-procedures lane is 21,633 bytes against 20,000: compact it at the next full checkpoint.
4. **`program-requirements-harvest`** is the routine's.

## Not answered by Sam

- The draft readiness gate (he asked for it; it waits on his adjustment, work proceeds on the draft).
- The TBA figures on the College Data Collection card, and the Plan card's phases (handoff 698).

## Pitfalls from this run

- **A test that reads a shipped data file breaks when a nightly run moves the data.** Pin the case the test is about
  (add the title the check needs) rather than the data's current shape.
- **`cpl_memory.kind` takes `fact`, never `finding`** (`cpl_memory_kind_check`); summaries stay at or under 400.
- **A subject map change moves `kb/side_by_side.json`**, which `scripts/check_generated.sh` does not check; the lints
  job's `tests/side_by_side_test.py` (5) does. After an edit to `kb/reference/subject_discipline_map.json`, run
  `python3 kb/_build_side_by_side.py` and commit `kb/side_by_side.json` (#3693).
- **`git push` after a merged PR:** the remote branch auto-deleted, so `--force-with-lease` reports stale info; fetch
  with `--prune` and push plainly.

## Memory and vault

Four `cpl_memory` rows by `SkyPrion (S707)` (`kb/migrations/2026-11-22_s707_cpl_memory_rows.sql`, rollback in its
header). Vault: a session note on a PR in samueltlee/CPLBrain. Wiki candidate for `/wiki-ingest`: the M-ID readiness
gate, once Sam sets it, and the rule that a code one college owns takes its discipline from that college.

## Let go

At sign-off: the PR subscriptions on this checkpoint's PR and on samueltlee/CPLBrain#847 (the vault note, a draft as
the vault's notes are), the check-in `S707: recheck #3691 CI` (`trig_01NF6JvEr11JjbfCEJpMAqQR`, fired 17:28Z, nothing left to do), and the COBIx watcher
(stopped). No artifact is watched.

Spend: not available; 2026-11-22T16:29Z to 2026-11-22T17:49Z.

Opening line: *Greetings, you are SkyNoddy (Session 708), see SkyPrion's handoff — `docs/session_708_handoff.md` — let's keep rolling with our queue.*
