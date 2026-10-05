---
title: Session 333 handoff — the display's identity from the live CCR, OSHA 30 on IWAP 41.09, sheets 37-38, apply_migration allow-listed
date: 2026-10-05
session: 332 (SkyBridge)
tags: [handoff, program-requirements-harvest, roep-display, cpl-pathways, sierra, decision-sheet, permissions]
status: current
superseded: true
superseded_by: session_334_handoff.md
---

# You are Session 333

Your moniker is **SkyHarbor**. SkyBridge (S332, `session_012tqxFyNzoesdTdzhK8ZGzv`) checkpointed at the
context WARN line (about 107,000 tokens left). If Sam's routine started you, read
[`docs/reference/scheduled_sessions.md`](reference/scheduled_sessions.md) first and follow it.

## First, in this order

1. **#1863** (Sierra at the top of the Program Requirements tab, the sheet 38 rulings, the rename plan,
   this checkpoint): merge it on a green `test` if S332 did not
   ([#1863](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1863)). If `main` moved, merge it in and
   regenerate `kb/dependency_map.json` (`python3 kb/_build_dependency_map.py`); never pick sides on it.
2. **#1864** (`apply_migration` on the session allow list): merge it on a green `test` if S332 did not.
3. **The *Ext & Review* rename** (Sam, sheet 38 card 3): after #1863 is on `main`, dispatch
   `cer-decision-apply.yml` on `main` with `plan_dir: kb/cer_decisions_out/2026-10-05`, `mode: dry-run`; read the
   summary; then `mode: commit`; then dispatch `cred-rename-apply.yml`. Confirm `kb/credentials.json` carries
   *Ironworker Apprenticeship — OSHA 30/Extension Review* with *Ext & Review* as an alias. Sam's
   `issuing_agency_override` (California Community Colleges) stays.
4. **Rebuild the display after the rename lands** (`python3 kb/_build_roep_display.py`): the IWAP 41.09 label
   changes. The write is a new one: put it on an open-asks card (or get Sam's word), then apply the receipt
   through `apply_migration` and prove it with the receipt's md5s, built from the receipt's SQL in Python.

## Decisions Sam made this run

- **Sheet 37:** hold the Cerritos high school request, *"Don't worry about this for now until I investigate later."*
- **Sheet 38:** card 1 go on the held writes; card 2 later, *"Not sure I understand the problem here. I assume
  Cerritos teaches osha 30 imbedded in their class"*; card 3 name it; card 4 keep both Fire Inspector 1C
  titles, *"I think these are different though they sound the same"*; card 5 dock Sierra.
- **In chat:** *"Sierra at the top"* (as on My College; he noted a second collapsible on My College would be
  redundant, and the dock lives only in Program Requirements); *"Add apply migrations to allow list"*.
- All recorded in `cpl_memory` (verified rows `sam-sheet37-...`, `sam-sheet38-rulings-...`,
  `sam-sierra-at-top-...`, `sam-apply-migration-allow-listed-...`).

## What shipped

- **#1861** (merged): the ROEP display reads identity from the live CCR. It read
  `coci_minted_memberships.json`, which holds only multi-member identities, so 140 of 289 entries had none.
  Build `81691460ba18`: identities 149 to 285, could adopt 53 to 133, for consideration 0 to 15. Written to
  `program_requirement_records.display`, all 20 rows matching the receipt. Receipts now carry the build in
  their name and cite the one they replace.
- **#1862** (merged): sheet 37's hold; the OSHA 30 finding (lane and ladder); read 13 (Cerritos's catalog prints
  Welding III's outline for IWAP 41.09); the plan check accepts one college's catalog on its vendor host.
- **#1863**, **#1864**: above. Sheet 38 (https://claude.ai/artifact/K51Fac1Tm2NvmF9gZaw9yS) is answered; no lane
  carries a NEEDS SAM, so no sheet 39.
- **cpl_memory**: eight rows (receipts `kb/receipts/cpl_memory_2026-10-05_s332*.sql`); S327's
  `for-consideration-zero-on-pilot` superseded and logged.

## Safety patterns

- **Writes:** no `apply_migration` without Sam's go (a sheet card or his word) and a committed receipt whose
  before-values roll it back. Memory rows go through `execute_sql` (the guard's `cpl_memory` carve-out, no prompt).
- **Prove a rollback from the receipt**, never from a page file loaded through Node: JavaScript prints `0.0` as
  `0` and the md5s differ.
- **`cpl_memory.summary` is capped at 400 characters.** Build SQL text with `"..."` literals and let the
  quoting function double apostrophes; adjacent `'...''...'` literals in Python silently drop them.
- **A new session gets the allow-list change only after Sam edits the setup script** (To-Do item); until then run
  `python3 scripts/install_prompt_guards.py --apply` once.
- The lane file is at about 19,950 of 20,000 bytes; CLAUDE.md at 59,997 of 60,000. Trim before adding.

## Next work (after the four above)

- IWAP 41.09's filing waits on Sam (card 2, later).
- Re-read Cerritos Schedule+ for Spring 2027 IWAP and AED sections once they post.
- Record shape v3 (outcomes as printed); the program view's By requirement / By term layouts.
- The addenda reading agent after the 2026-10-11 apply; widen the harvest past the pilot.
- Raise Miramar's AUTO 156G articulations (EMT, Driver Operator 1B) in the clean-up lane.
