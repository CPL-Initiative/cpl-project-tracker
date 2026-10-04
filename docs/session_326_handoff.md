---
title: Session 326 handoff — sheet 29 holds five calls; the Program Requirements tab mock-up waits on Sam; addenda are recorded
date: 2026-10-04
session: 325 (SkyReader)
tags: [handoff, program-requirements-harvest, addenda, sierra, decision-sheet]
status: current
---

# You are Session 326

Your moniker is **SkyAddendum**. SkyReader (S325,
`session_014vvy3E2TaWumkZdsYeLZYb`) ended on an **EMERGENCY checkpoint** (context
at 33K tokens left). NOT refreshed, so do these first: **`kb/cpl_todos.json`** (still
says S324; add sheet 29, the tab mock-up, the addenda go), **`cpl_memory` rows**
(below), the **CPLBrain session note** `07-session-notes/2026-10-04-skyreader-...md`
on vault branch `claude/skyreader-session-325-vault` (PR #232, open, holds today's
braindump), and the pipeline tab (unmoved, skip). Lessons 33-38, the KB note
`methodology-probe-the-class-before-calling-a-refusal-local` and the INDEX bullet
did land.

## First, in this order

1. **Read sheet 29's replies** ([Open Asks Sheet 29](https://claude.ai/artifact/FhxQ5HXM1EBffhS5ce3Tj7),
   current; collection `replies`). Five cards: (1) two memory receipts, (2) six
   catalog addresses, (3) how the pilot reads Miramar's sequence (the Program
   Mapper answers 403 at all 17 hosts reached), (4) may Sierra say "required" and
   give a total for a record that passed all four checks, (5) "Go" on the addenda
   table (`kb/supabase_program_source_addenda.sql`, NOT applied). Execute the
   verdicts; change the lane's NEEDS SAM markers in the same PR.
   [Sheet 28](https://claude.ai/artifact/8opUAZ9y9QKMbzPd2Vvz7Y) is superseded by 29.
2. **Link every sheet you name in chat** (Sam's rule, 2026-10-04, in CLAUDE.md).
3. **The tab mock-up** ([Program Requirements Harvest](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f),
   v3; source in the S325 scratchpad, rebuild from
   `docs/reference/lanes/program-requirements-harvest.md` if lost): Sam's notes
   applied (intro behind About, Catalogs a plain table, one Ask Sierra link). Wait
   for his next round, then port into COBI. Fix first: Cerritos Ironworker shows 0
   MAP credit recs (its credit lives in the CPL Pathways map).
4. Second census dry run on #1848 (run 37200460417, head f2cab65) was not read:
   confirm 78 addenda at 52 colleges and 112 addresses / 95 years unchanged.

## What shipped (S325)

- **#1847** sequence pass `kb/_program_sequence_ppm.py` (own workflow): Miramar's
  mapper `san-diego-miramar.programmapper.com` answered 403 (run 37197332656); the
  24-source probe (run 37198225537): 17 of 17 mapper hosts 403, Irvine Valley's own
  maps page answers. Sheet 28.
- **#1848** census records addenda (`addendum_links`, `addendum_start_year`): 78 at
  52 colleges (19 name 2026-27, 41 name 2025-26, 18 none); proposed addenda table;
  sheet 29; numbered sheet titles; the sheet-link rule.

## Decisions Sam made this run (record in cpl_memory, verified_by Sam)

- 11:1xZ: "No need for governance at this point. Everything is public record and
  we can mark the tab and contents as beta draft."
- "Integrate Sierra in the tab design", then 11:33Z: one Ask Sierra link; "Most
  important with her is that she has access to the catalog and pathway data we are
  assembling but also the logic and agentic procedures we're iterating."
- "later we will be integrating all this in SkyView."
- Addenda: "We need to track this in our schema and have our agents aware."
- "Can't find sheet 28... add the sheet link next to a presence to it in chat."

Vault braindump: `CPLBrain/03-professional/braindumps/braindump-2026-10-04-1115-program-requirements-tab-public-record.md`.

## Safety patterns

- A mapper refusal is never worked around; re-reading Miramar's mapper needs the
  dispatch input `read: 1`.
- A census push reruns 118 college reads; replay a filter offline against a run's
  evidence first.
- Count with code before a number goes on a sheet (S325 mis-typed a split once).
- CLAUDE.md sits at 59,992 of 60,000 bytes: add nothing without trimming.
