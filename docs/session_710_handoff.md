---
title: "Session 710 handoff (from SkyMurrelet, S709, Sam's plain session of 2026-11-22: the re-mint readiness count, AED scope first)"
created: 2026-11-22
updated: 2026-11-22
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_714_handoff.md
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows `docs/session_699_handoff.md`
and the routine's own newest handoff, never this file. **Numbering.** If the routine has taken 710 by the time you
start, take the next free number and say so in your handoff.

# You are SkyGuillemot (Session 710)

From SkyMurrelet (S709), Sam's plain session of 2026-11-22, 20:17Z to about 21:00Z. **Read `docs/session_708_handoff.md`
and `docs/session_709_handoff.md` first: their open work stands,** except the two commons items this run closed.

A **light checkpoint**: the commons lane moved with its PR, four `cpl_memory` rows, no re-mint and no data receipt.
Skipped: steps 2, 3, 5, 7 and 9 (no KB structure, nav, re-mint or pipeline change), 4 (no retired text), and 12 (no
status file reads the queue).

## Open with the standing block (unchanged from handoff 703)

Handoff 708 carries it. No COBIx comment arrived on #3358 or #3655 during this run. This run fell outside the
routine's hours, so no side-session draft PR was needed.

## What shipped

- **#3697** (`kb/_mid_readiness.py`, `kb/status/mid_readiness.json`, `kb/_mid_outcomes_compare.py`, the nightly step in
  `scripts/daily_build.sh`, `tests/mid_readiness_test.py`): the commons lane's NEXT (1) and (3).
  - The readiness count by the draft gate `d-remint-ready-gate-draft-s707`. A scope is every M-ID with a member under one
    college's code (AED at Cerritos first). A person's save or statewide filing settles a member; the subject map
    alone settles nothing (`d-readiness-map-is-not-settled-s709`). The outcomes test passes only when the newest
    compare counts the rows the committed reads hold.
  - On this tree the AED scope is **127 M-IDs (120 ELEC), 3,084 members**, read from `unified_courses_members.js`;
    S707's 46 and 221 came from the May preview `kb/coci_minted_memberships.json` (`f-aed-scope-is-127-mids-s709`).
    **34 are ready**, all Cerritos noncredit settled to VOCE. Within ELEC (224 members) most held M-IDs wait on one
    Cerritos AED course in a category with no save: Elementary and Secondary Basic Skills 32, no category 26,
    Workforce Preparation 19.
  - The outcomes compare reran on the committed reads: 26 hosts, 45,673 rows, 35 colleges. Its JSON is now written
    gzipped past the 5 MB file limit (`d-compare-json-gzip-over-limit-s709`), and the readiness build reads either form.

## Decisions the session made (each Sam's to revise)

- `d-readiness-map-is-not-settled-s709` and `d-compare-json-gzip-over-limit-s709`, above.

## Findings

- `f-uncategorized-noncredit-takes-no-code-s709`: a noncredit course with no category in the export cannot take a
  common code (`subject_decisions` refuses a code on `nc:uncategorized`). 120 AED-scope members sit there, so the
  gate holds them as *no noncredit category*. The fix is either the export's category or a rule for that band;
  which is a lane call for the noncredit categories, not settled here.

## Open work

1. **`commons`, from its NEXT line** (the Subjects paragraph): (1) Cerritos AED's saves under Elementary and Secondary
   Basic Skills and the uncategorized band, the largest ELEC unblock (a person's, on the Subjects page; give Sam the
   count from `kb/status/mid_readiness.json` `codes_to_settle`); (2) statewide defaults by the DR-25 route; (3) where a
   strong or partial outcomes split gets answered (no store exists, so each such split holds); (4) the sync reads
   `course_subject_decision`; (5) one re-mint dry run for the 34 ready AED M-IDs under
   `docs/coursecontrolnumber_remint.md`, reading `kb/status/mid_readiness.json`.
2. **The readiness gate is still a draft.** Show Sam the 34 and the held reasons and let him set it.
3. **`cer-procedures`** (compact below 20,000 bytes at the next full checkpoint), **`repo-size`**,
   **`my-college-action-page`** (handoff 709's item 2), as their lanes list them. **`program-requirements-harvest`**
   is the routine's.

## Pitfalls from this run

- **`kb/coci_minted_memberships.json` is a May preview.** Count M-ID membership from `unified_courses_members.js`
  (the compare's `load_members`), which the nightly rebuilds in the current era.
- **The compare is not nightly.** When the reads grow, `kb/status/mid_readiness.json` holds every M-ID on the
  outcomes test until a session reruns `python3 kb/_mid_outcomes_compare.py` (about 50 s) and commits the `.json.gz`
  and `.md`.
- **The session's assigned branch is the harness's.** This run pushed to `claude/session-709-handoff-91w19b`, as the
  session's instructions required.

## Memory and vault

Four `cpl_memory` rows by `SkyMurrelet (S709)`: `kb/migrations/2026-11-22_s709_cpl_memory_rows.sql`, applied, rollback
in its header. Vault: a session note on a draft PR in samueltlee/CPLBrain. Wiki candidate: the M-ID readiness gate,
once Sam sets it.

## Let go

At sign-off: the PR subscription on #3697 (after it merges) and on the vault note's PR. No check-in, watcher or
artifact is held.

Spend: not available; 2026-11-22T20:17Z to about 21:00Z.

Opening line: *Greetings, you are SkyGuillemot (Session 710), see SkyMurrelet's handoff — `docs/session_710_handoff.md` — let's keep rolling with our queue.*
