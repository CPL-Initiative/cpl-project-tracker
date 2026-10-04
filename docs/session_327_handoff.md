---
title: Session 327 handoff — sheet 29 carried out; Sierra's catalog requirements live; sheet 31 pasted
date: 2026-10-04
session: 326 (SkyAddendum)
tags: [handoff, program-requirements-harvest, addenda, sierra, decision-sheet]
status: current
---

# You are Session 327

Your moniker is **SkyAmend**. SkyAddendum (S326, `session_01PDrgm8786qQMya6GVqbswn`)
ran a full checkpoint at the context WARN line (107K left), with PR #1851 open and
its A/B preview running.

## First, in this order

1. **Done (S326): #1851 merged (4837edc), Sierra deployed 15:33Z** (run 37213391271);
   smoke on main green (run 37213710695, second attempt; the first missed 7c's quick-list
   window, a question that never reaches the changed code). 7l names the 2026-2027
   catalog and the printed total; 7q passes.
2. **Done (S326): [sheet 31](https://claude.ai/artifact/89S8oEi5Yi1ZpDeUwBsfJu) pasted**
   at 16:56Z, read back live: the three memory rows written, both tables closed to
   public writes. No lane carries NEEDS SAM, so the builder writes no sheet. A paste
   card now carries its SQL (the builder refuses one that does not).
3. **The tab mock-up** ([Program Requirements Harvest](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f), v3):
   still waits on Sam's next round. Its Cerritos Ironworker row reads 0 MAP credit
   recs (its credit lives in the CPL Pathways map); fix before the port.

## What shipped (S326)

- **#1850, merged (8884523).** Sheet 29 cards 2, 3, 5:
  - six catalog addresses run through the migration path (Sam lifted the guard);
  - `program_source_addenda` live in two parts: Part A create-only with a
    **security invoker** write function (RLS keeps public roles out); Part B, the
    privilege close, is a receipt on sheet 31. The census writes it after the
    registry; only a **complete** read (homepage and catalog page answered, own
    address) marks an addendum gone. **Empty until the next apply**: today's
    Sunday 10:29 schedule did not fire (next: 2026-10-11, or a hand dispatch with
    `mode: apply` on main);
  - four registry columns the census never writes (`sequence_host`,
    `sequence_access`, `sequence_note`, `sequence_checked_run`): 18 refused,
    5 not read, 2 open (Irvine Valley, Santa Monica). The sequence reader never
    requests a refused host, follows the college's own map links, and the probe
    prints `CHANGED: file it` when a refused host or an unreached page answers.
- **#1851, merged (4837edc) and deployed.** `program_requirement_records` live: 20 pilot records, all
  checked, anon reads checked rows only; hashes verified against the repo files.
  cpl-chat renders a checked program as CATALOG REQUIREMENTS. Smoke 7l re-scoped,
  7q added.
- Seven `cpl_memory` rows (author `SkyAddendum-s326`), two verified by Sam;
  more from this checkpoint. Lessons 39-47; KB note
  `playbook-ship-a-table-before-its-privilege-close`.

## Decisions Sam made (recorded)

Sheet 29, all five his own calls: 1 later (memory receipts); 2 guard lifted;
3 *"Note this in the record for the college. Rather than ask permission, we will
make the agent aware of the limitation and to continue to look for solutions or
workarounds."*; 4 yes; 5 go. S326 read "workarounds" as other public sources: the
reader keeps the census user agent naming the CPL Initiative and never retries a
refused host under another name. **Confirm that reading with Sam if he raises it.**

## Next work

- The addenda **reading agent** (files `programs_changed`, marks read) once the
  table has rows.
- A sequence read (`program-sequence-ppm.yml`, input `read: 1`) that looks for
  Miramar's Fire Technology map on its own pages.
- The tab port into COBI after Sam's notes; the harvest widens past the pilot.

## Safety patterns

- The Supabase connector holds any statement naming drop / delete / revoke /
  truncate (even in quoted text) and times out at 60 s writing nothing: ship
  create-only, put the close on the sheet.
- A census push reruns 118 college reads; a sequence push reruns 25 probes.
- A mutation loop restores its file in a `finally`; compare with the backup
  before believing a red.
- CLAUDE.md is at 59,992 of 60,000 bytes: add nothing without trimming.
