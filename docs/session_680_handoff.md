---
title: "Session 680 handoff (from SkyKinglet, S679)"
created: 2026-11-18
updated: 2026-11-18
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyPhoebe (Session 680)

From SkyKinglet, S679, Sam's session of 2026-11-18 (00:10Z to about 03:20Z), worked from SkyWaxwing's handoff 679. A
**full checkpoint**: the run made Rule 10 data writes. Its documents were written by the conductor's checkpoint-docs
worker. Not refreshed: step 12's headline and `next_run` in `kb/status/program-requirements.json` (both need Supabase
or `get_trigger`, which the worker does not hold; they stand as S678 left them) and the whole-harvest row. Skipped:
step 2 `kb/README.md` (no KB generator changed), step 3 `README.md` (no surface listed there changed), step 7 (no
roadmap row, auditor count or re-mint moved).

Read this file, then the NEXT lines of `docs/reference/lanes/cer-procedures.md` (*Titles that have left MAP*),
`docs/reference/lanes/program-requirements-harvest.md` and `docs/reference/lanes/common-cr-reference.md`, then
`docs/engineering_practices_lessons.md` *S679*.

## What shipped (9 merged)

- **#3473** the blocked-catalog to-do. **#3475** the S678 checkpoint. **#3467** Courses rulings stick. **#3474** the
  side-by-side view.
- **#3468** ACE `CreditRecommendation` kept in `map_ace_catalog_cr`, applied by run 44209026812; a failed ACE check
  stores no ACE text that night, the MAP load goes ahead, and the run exits 1.
- **#3478** Sam's three Nov 17 rulings: `short_high` keyed on the catalog's printed range (165 records at 56
  colleges); the local-degree general education overlap (78 at 21); the general education open slot built and OFF
  behind `CPL_GE_AREA_SLOT_FILL`. 73 short local degrees and 9 short lists carry a note.
- **#3481** the guarded UPDATE of those 243 rows, applied 02:41Z by run 44224714543 after the clean pre-read (run
  44224061547); `follow_verdict` marked none checked. Rollback committed, NOT applied:
  `kb/migrations/2026-11-18_s679_prreq_rescore_rollback.sql`.
- **#3479** Sam's slash-to-"and" ruling (`kb/slash_titles.py`, guarded in `check_generated.sh`). **Applied:**
  `cred-rename-apply.yml` run 44227947795, 03:09Z, commit `64f13edc`: 80 keys, 95 local titles, 103 articulations,
  `kb_curation` 81 ok, 0 failed. Undo `kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-18`.
- **#3477** the left-map apply nightly in `scripts/daily_build.sh`; Rename and Combine on the leftover row; Move only on
  unused titles; the combine guard as one choke point that fails closed.

## Open work, in order (from the lane NEXT lines)

1. **#3482 (draft)**, the shared `combine_guard.js` for the Common Exhibit Reference tab's five writers: a worker is
   fixing the second reader's findings (untyped titles get an `unknown` two-press check, the reject in `load` is caught,
   the undo handles a double rename). Merge on green `test` after a second read (cer-procedures NEXT 1).
2. **#3472 (draft, head `4ca0f456`)**, the re-point list: rebuild it on `main`'s renamed titles (step 1, the rename,
   is done), then the MAP snapshot run, then the reviewed apply. Dry run: 590 applied, 89 held.
3. **Harvest** (program-requirements-harvest NEXT): (1) Golden West's objectives full read (`cccd`); (3) the
   `NCL_EXTRACT` switch; (4) #3293 and Cosumnes River; (5) Lassen; (6) Los Medanos and Los Angeles Valley, with a
   person; (7) confirm the harvest card shows #3465's `spent_usd`; (8) ruling 3's self-recall run with
   `CPL_GE_AREA_SLOT_FILL=1` on captured pages, then a PR turns it on.
4. **Common CR Reference**: read the first `map_ace_catalog_cr` fill after the 04:57 UTC load and re-measure 859
   typographic rows and 25,984 waiting on ACE text.
5. **Commons**: the retired-course drops; Sam's billing paste after Nov 15.
6. **governance-team-enablement** (NEXT 2): `daily-dashboard.yml` into `live-counts` in its own PR.
7. **implementation-funding** waits on others: Sam's card 11 measure texts in the tab, the one request to Pedro, the
   `ppa` cutover when CollegeID2 lands, and map@rccd.edu after Governance maps the sender. Library and
   my-college-action-page keep their NEXT lines behind this queue.

## For Sam

**Eight slash titles held** (whole names on each side). Default on no reply: they stay as printed.
DSST A History of the Vietnam War / Civil War and Reconstruction; Wall and Column Forms / Cutting and Burning
(Carpentry); Video Gaming 1 / Computer Programming and Game Design; Standards and Training for Corrections (STC) /
Board of Parole Hearings; Metal Building Erection 1 / Foreman Training; Nursing Skills / Clinical Simulation Laboratory
Advanced; Water Treatment Operator Grade T3 / Distribution Grade D3; Emergency Medical Responder (EMR) / Healthcare
Provider CPR. The committed plan's `held` list names the first seven; the eighth was named by the conductor.

## Decisions (Sam's, and the conductor's)

Sam, in session about 01:10Z: *"I believe I replaced the / with and to avoid formatting issues and should be a general
rule for other titles. UA Plumbers and Pipefitters"*. The conductor's: ruling 2 follows the catalog's range (COBIx's
count corrected a narrowing); the slash line (words take "and", codes and official names stay, C-ID descriptors exempt,
spaced whole-name pairs held); Move only on unused titles; untyped titles get the two-press check; no confidence field
for a course list, so the note is the mark; a failed ACE check never blocks the MAP load; the combine guard is one choke
point that fails closed. Rows: `kb/migrations/2026-11-18_s679_cpl_memory_rows.sql` (13, rollback beside it; it folds
in the unapplied slash row file, now removed); the conductor points `.apply` at it.

## Patterns that worked

- A count beats an argument (COBIx on the `short_high` scope). Pre-read, apply, then file the rollback built from the
  returned rows. On a third round of one finding class, redesign into one choke point (KB note
  `methodology-a-guard-must-fail-closed-when-it-cannot-decide`).

## Safety patterns to honor

Each merge changes `kb/dependency_map.json` and conflicts every open PR: merges serialize at about 11 minutes of CI each.
Auto-resolve only the dependency maps; stop on any other conflict (a merge once committed markers into
`kb/migrations/.apply`). Worker worktrees go outside the repo; unlock, then remove, after checking the head. Ask
pr-gate for facts only. `cpl_memory` summaries stay at or under 400 characters.

## Session settings

One Opus 5.5 session works the queue; up to 3 workers in sparse worktrees. The $40 limits and the #3351 gates stand.
Database writes and read-only counts go through the runner.

## Ledger and let go

| PR | State | Next |
|---|---|---|
| #3482 combine guard | draft; worker fixing | merge on green `test` after a second read |
| #3472 re-point list | draft, `4ca0f456` | rebuild, MAP snapshot, reviewed apply |
| #3421, #3387, #3293, #3284, #3383 | older, untouched | per their lanes |
| `claude/s679-checkpoint` | draft, this checkpoint | the conductor applies the memory rows, then merges |

The conductor drops every PR subscription (#3482, #3472 and this checkpoint's), its check-ins and artifact watches at
sign-off and names them in its closing message. The standing sheet stays
[Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current).

Spend: not available; 2026-11-18T00:10Z to 2026-11-18T03:20Z.

PRs merged (substantive, not counting this checkpoint): 9 (#3473, #3475, #3467, #3474, #3468, #3478, #3481, #3479, #3477).

Opening line: *Greetings, you are SkyPhoebe (Session 680), see SkyKinglet's handoff, `docs/session_680_handoff.md`,
let's keep rolling with our queue.*
