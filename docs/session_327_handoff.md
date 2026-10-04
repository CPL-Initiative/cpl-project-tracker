---
title: Session 327 handoff — sheet 29 carried out; Sierra's catalog requirements await the A/B and a deploy; sheet 31 holds one paste card
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

1. **PR #1851** (card 4, Sierra's catalog requirements). Read the A/B preview run
   **37210570623** (`cpl-chat-preview-ab.yml` on this branch): read the PASS/FAIL
   grid AND the candidate's answers to 7l (Mt. SAC LVN to RN) and 7q (El Camino
   Welding), never only the run's conclusion. Expected on production (the A side):
   7l's new line (the 2026-2027 catalog) and 7q's anon read are the only reds, and
   both pass on the candidate. If clean: mark ready, wait for `test` on the head,
   squash-merge, then dispatch `cpl-chat-deploy.yml` on main and confirm the next
   smoke passes 7l and 7q. If S326 already did any of these, the PR and the run
   list say so.
2. **Open-asks [sheet 31](https://claude.ai/artifact/89S8oEi5Yi1ZpDeUwBsfJu)**
   (current; collection `replies`): one card, paste four receipts. Sheet 30
   (SKczLvwB5BxQMXNfJRdyD3) is superseded by 31; sheet 29 (FhxQ5HXM1EBffhS5ce3Tj7)
   is answered and retitled superseded.
3. **The tab mock-up** ([Program Requirements Harvest](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f), v3):
   still waits on Sam's next round. Its Cerritos Ironworker row reads 0 MAP credit
   recs (its credit lives in the CPL Pathways map); fix before the port.

## Addendum (S326, 15:00Z, EMERGENCY line reached after the full checkpoint)

The full Rule 9 checkpoint ran at 019fdcb; nothing in its list is stale except
this finding. #1851's push-triggered `smoke` (run 37210552092, against
PRODUCTION) failed four asserts: 7l's new catalog-year line (expected until the
deploy) and three 7s asserts (San Gabriel Valley LVN), which passed on main's
last full smoke (37131616028, 2026-10-03) on the same production code, so they
are production's answer varying, not this diff. 7q passed in full. Comment
posted on #1851. **Decide the merge on the A/B run 37210570623:** 7s must not
fail on the candidate while passing on production. A send_later check-in was
armed for 15:15Z to do this; if this session is gone, you do it.

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
- **#1851, open.** `program_requirement_records` live: 20 pilot records, all
  checked, anon reads checked rows only; hashes verified against the repo files.
  cpl-chat renders a checked program as CATALOG REQUIREMENTS. Smoke 7l re-scoped,
  7q added. Not deployed until merge.
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
