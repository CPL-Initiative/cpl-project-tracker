---
title: "Session 711 handoff (from SkyGuillemot, S710, Sam's plain session of 2026-11-22: the AED scope's re-mint dry run)"
created: 2026-11-22
updated: 2026-11-22
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_714_handoff.md
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows `docs/session_699_handoff.md`
and the routine's own newest handoff, never this file. **Numbering.** If the routine has taken 711 by the time you
start, take the next free number and say so in your handoff.

# You are SkyRazorbill (Session 711)

From SkyGuillemot (S710), Sam's plain session of 2026-11-22, 22:46Z to about 23:40Z. **Read `docs/session_708_handoff.md`
first for the standing block; handoffs 709 and 710's open work stands** except the commons item this run closed.

A **light checkpoint**: the commons lane moved with its PR, three `cpl_memory` rows, no re-mint and no data receipt.
Skipped: steps 2, 3, 5, 7 and 9 (no KB structure, nav, re-mint or pipeline change), 4 (no retired text), and 12 (no
status file reads the queue).

## Open with the standing block (unchanged from handoff 703)

Handoff 708 carries it. No COBIx comment arrived on #3358 or #3655 during this run; it fell outside the routine's
hours, so no side-session draft PR was needed. The routine's four S703 PRs (#3675, #3683, #3684, #3686) are its own.

## What shipped

- **This PR** (`kb/_scope_remint_dryrun.py`, `kb/scope_remint_out/2026-11-22-aed/`, `tests/scope_remint_dryrun_test.py`,
  its step in `js-tests.yml`): the commons lane's NEXT (5), the one re-mint dry run. Measurement only; the script has
  no apply path.
  - It reads `kb/status/mid_readiness.json`. Of the 34 ready, **31 move ELEC → VOCE**, discipline Electricity →
    Vocational, all gap-filled (VOCE M9100 to M9102, M90RT to M90SU), none onto a slot an earlier re-mint vacated or
    SkyView draws. **3 stay**: ELEC M1018, M9044 and M9051 are each one Cerritos course listed under AED and ELAP
    (`d-crosslisted-split-keeps-its-identity-s710`). An apply would re-key 3 curation keys and 7 `merge_into` pointers.
  - The plan's shape is the one `_eths_remint.apply_plan` consumes, so an apply reuses that code and its post-gates.

## Decisions the session made (each Sam's to revise)

- `d-crosslisted-split-keeps-its-identity-s710`, above.

## Findings

- `f-aed-dryrun-31-move-to-voce-s710`: the count above.
- `f-category-save-moves-electrical-to-voce-s710`: all 31 follow one reviewer save, Cerritos AED Short-term
  Vocational → VOCE (14:22Z). Six titles read as Electricity (ECT Adv Theory, Elec Theory, Electrical Calculations,
  ECT Ind Light Load, Electrical Lighting, Introduction to Electrical Trade) and six as small business (Small Business
  Finances, Growing a Small Business, Social Media, each with its Spanish twin). A course move (`CRS:`) on the
  Subjects page before the apply keeps them in their field; the dry run then rereads them.

## Open work

1. **`commons`, from its NEXT line:** (1) Cerritos AED's saves under Elementary and Secondary Basic Skills and the
   uncategorized band (a person's); (2) statewide defaults by the DR-25 route; (3) a store for answering outcomes
   splits; (4) the sync reads `course_subject_decision`; (5) the apply, once Sam sets the gate and the twelve titles
   are read: `kb/_scope_remint_dryrun.py` again, then the playbook (`docs/coursecontrolnumber_remint.md`).
2. **The readiness gate is still a draft.** Show Sam the 34, the 31 moves and the twelve titles; let him set it.
3. **`cer-procedures`** (compact below 20,000 bytes at the next full checkpoint), **`repo-size`**,
   **`my-college-action-page`** (handoff 709's item 2), as their lanes list them. **`program-requirements-harvest`**
   is the routine's. The commons lane is 19,296 bytes; it reaches its budget soon.

## Pitfalls from this run

- **A gap-fill under VOCE never keeps a number:** VOCE already holds M90AP and the rest of the old ELEC numbers, so
  every move reads `gap-filled`. That is expected, not a fault.
- **The dry run reads the readiness file as committed.** After a person's save, rerun `python3 kb/_mid_readiness.py`
  (or wait for the nightly) before the dry run, or it plans from yesterday's gate.

## Memory and vault

Three `cpl_memory` rows by `SkyGuillemot (S710)`: `kb/migrations/2026-11-22_s710_cpl_memory_rows.sql`, applied, rollback
in its header. Vault: a session note on a draft PR in samueltlee/CPLBrain. Wiki candidate: the M-ID readiness gate,
once Sam sets it.

## Let go

At sign-off: the PR subscription on this PR (after it merges) and on the vault note's PR. No check-in, watcher or
artifact is held.

Spend: not available; 2026-11-22T22:46Z to about 23:40Z.

Opening line: *Greetings, you are SkyRazorbill (Session 711), see SkyGuillemot's handoff — `docs/session_711_handoff.md` — let's keep rolling with our queue.*
