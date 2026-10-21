---
title: "Session 436 handoff: the 110 strays triaged onto Sheet 106, the veteran map's controls as words"
date: 2026-10-20
session: 435 (SkyToyon)
tags: [handoff, common-subjects-reference, ui-pass, veteran-map, decision-sheet]
status: current
superseded: true
superseded_by: session_442_handoff.md
---

# You are Session 436

Your moniker is **SkyTanbark**. Session 435 (**SkyToyon**, `session_01BBxAbUQGuY9kCQv7xyQQQp`) was started by the
CPL Queue routine at 10:12Z on 2026-10-20. It took SkyElderberry's handoff 435 and checkpointed at about 10:50Z. If
the routine started you, follow `docs/reference/scheduled_sessions.md` first.

## Sam's words this run

None. The routine started the run. Open Asks Sheet 105's `replies` store was empty at 10:15Z, and so was Sheet 106's
at publish.

## What shipped

- **#2283**: the CSR's 110 stray codes triaged. `kb/_csr_stray_triage.py` (`kb/csr_out/stray_triage.md`) splits
  them. 9 codes (12 identities) already carry Foreign Languages, so only the code is off.
  `kb/_fl_stray_remint.py` dry-runs those twelve re-keys, and every gate passes
  (`kb/fl_stray_remint_out/2026-10-20/`). The other 101 codes carry no discipline. For these the triage reads the
  colleges' own signal, which the blank worklist cannot read for a stray: the discipline the same college's other
  identities on the same local subject carry. 15 codes pass the gate, and the titles agree on 8 (79 identities).
  Lane markers NEEDS SAM 10 and 11 were added.
- **Open Asks Sheet 106** (https://claude.ai/artifact/7jdv3UK2X5iegWRjkViyjG, vault #409), **open**, three cards:
  1. Sheet 105's forestry stragglers, carried at the same position.
  2. Re-key the twelve Foreign Languages identities.
  3. File the eight checkable blank stray codes.

  Sheet 105 (https://claude.ai/artifact/7mPQz4PNmc7ezD2Dkkijxc) is superseded. A reply there still counts for card 1.
- This checkpoint (#2283 merged 10:46Z): the veteran map's UI pass (the view `ui_pass.py --next`
  named). All three targets swept clean before and after. The gap was the Controls rule: Zoom in, Zoom out, Reset
  and the region buttons were pills. They are now underlined words, and the guard
  `tests/veteran_map_controls_words.test.js` reads 10/10 on the new CSS and 2/10 on the old. The checkpoint also
  carries the lessons (`ui_pass_lessons`, `commons_lessons`), the ledger, the status file and this handoff. The vault
  gets the session note.

## Priority

1. **Read Sheet 106's `replies`** (`ArtifactData` `list`, collection `replies`) **and Sheet 105's** (card 1 only).
   Carry out whatever Sam answered in **one re-key window**:
   - **Card 1, *move-both*:** the CSR lane's NEEDS SAM 9 procedure (`kb/_forestry_wine_remint.py --set stragglers`).
   - **Card 2, *rekey-twelve*:** NEEDS SAM 10 (`kb/_fl_stray_remint.py`). Its apply adds the five new codes to the
     umbrella. Also add them to `kb/foreign_language_subj4.json`.
   - **Card 3, *file-eight*:** NEEDS SAM 11. A pinned dry run in the forestry script's shape, with the discipline
     following the code.

   Two receipts in one window each need their own ALIAS_MAPS entry, in apply order. If the permission check holds an
   apply again, it is a hold: name it on the sheet and move on.
2. **The Commons' remaining Progress views** (Exhibit, Course, CR), built from `commons_progress.js`.
3. **The C-ID source for the quarterly routine:** find one a runner can reach, then set the `authority_tables`
   baseline.
4. Malone's exchange paste still waits on Sam.

## Patterns that worked

- When `list_sessions` is missing, the open PRs and main's log stand in for the one-writer check.
- `scripts/check_generated.sh` reads STALE for a builder that cannot import: the sandbox's `python3` lacked
  `openpyxl`, which `pip` had installed for a different interpreter. `python3 -m pip install openpyxl` fixed it.
  Check the traceback before you regenerate anything.
- A sweep-clean view still owes the rules newer than its last pass. The veteran map is the second view in a row to
  owe the Controls rule; the Fact Sheet is next (`ui_pass.py --next`).

## Lessons to honor

- The discipline blanks are a curator's list (2026-09-08). Never fill one from a title, and a vote alone is not enough
  either: SGNG's sign-making courses vote Work Experience at 100%.

## Not refreshed

- The Pipeline tab: no re-mint applied and no audit count moved.
- `kb/README.md` and `README.md`: no structure or surface changed.
- No KB note and no `cpl_memory` row: the learnings are lessons, and Sam made no ruling.
- The docs-audit `oversized_doc` findings: the CSR lane grew by its two markers.

## Let go

S435 drops its PR subscriptions when both PRs merge. It holds no artifact watch (remote sessions cannot watch) and no
check-in. Sheet 106 is open, and the next session reads its store. The CPL Queue routine fires next at 11:12Z.
