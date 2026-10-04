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
3. **CPL Pathways reads the ROEP record** (Sam, 17:20Z, after approving the harvest tab mock-up:
   the harvest tab runs the reading, CPL Pathways shows it to colleges and the public, and a
   misread changes the college's procedure, never the record). Mock-up
   [CPL Pathways ROEP](https://claude.ai/artifact/8hkej9jHsmLRX6cZYxrXbM);
   [open-asks sheet 32](https://claude.ai/artifact/AUF7W1nEqZ1L4xKHVRpRXB) is answered (both as
   proposed, 17:33Z). The lane's NEXT is your first build: one builder writes each program's display
   facts (CPL in three kinds: articulated here, could adopt, for consideration) to a `display`
   column on `program_requirement_records` and to `cpl_pathways_roep_data.js`, and Sierra reads it
   (Sam: "make sure she's wired to understand all the included data and considerations").
4. **The harvest tab mock-up** ([Program Requirements Harvest](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f), v3):
   approved ("mock up looks good"). Its Cerritos Ironworker row reads 0 MAP credit
   recs (its credit lives in the CPL Pathways map); fix before the port.

## The ROEP build (your first job), measured by S326

Sam approved the [CPL Pathways ROEP mock-up](https://claude.ai/artifact/8hkej9jHsmLRX6cZYxrXbM) (v3; its
source is `docs/visuals/2026-10-04-cpl-pathways-roep-mockup.html`: `plan()` computes the "up to"
figure, `gapsFor()` splits gaps by owner) and asked for Sierra "wired to understand all the included
data and considerations". One builder, two readers:

- **The builder** writes each program's display facts: per course, CPL in three kinds (articulated at
  this college; could adopt: the same course identity articulated at another college; for
  consideration: a CER/EACR cert whose credit recommendation names the course's C-ID, CCN or M-ID,
  articulated nowhere yet), the up-to figure and the recommended path's where a map is read, the gaps
  (catalog-versus-state-file differences: the repo records' `missing_explained` and
  `catalog_addition`; the reader's notes), and the map status (registry `sequence_*` columns).
  Outputs: a `display` jsonb column on `program_requirement_records` (an added column, no new
  privilege close) and `cpl_pathways_roep_data.js`.
- **Sources, measured 2026-10-04:** the mock-up's "articulated here" marks are counts of
  `map_college_cr_unit.credit_rec` by course code (reviewer-gated; publish counts and credential
  titles only, never a student column) plus CER industry-credential lines (the Ironworker 15).
  `chatbox_peer_articulations` (public) marks 14 of the Ironworker's 24 courses and none of
  Riverside's, so Sierra must read the builder's facts, never compute her own, or she contradicts
  the page. `program_requirement_records.checks` holds only booleans; the difference lists are in
  the repo records.
- **Sierra:** `fetchCheckedRequirements()` selects `display`; the CATALOG REQUIREMENTS block adds the
  CPL lines, the figure with its definition, the gaps and the map status; the rules add the
  considerations (beta draft; a misread is fixed in the procedure, never by hand; the map recommends
  picks, the catalog keeps the rule; "for consideration" is no articulation). `sierra.js` prefills
  `?ask=` (the mock-up's Ask Sierra link already sends it). Surface `cpl-pathways` joins
  `KNOWN_SURFACES` when the tab is ported. Then an A/B preview, merge, deploy, smoke.

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
