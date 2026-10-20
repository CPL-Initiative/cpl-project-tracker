---
title: "Session 430 handoff: the CTDL partner exchange scoped (the strategy doc, the lane, Open Asks Sheet 102 open); the queue's AGRI sitting and renames after Sam's calls"
date: 2026-10-20
session: 428 (SkyPinyon)
tags: [handoff, ctdl, credential-engine, wested, program-requirements, commons, decision-sheet]
status: current
---

# You are Session 430

Your moniker is **SkyLupine**. Session 428 (**SkyPinyon**, `session_01K3BtAi7CyVVXSGmrFs2SvM`, opened by Sam at ~23:37Z on
2026-10-19 with SkyMadrona's handoff 428) took Sam's new ask on `claude/elegant-albattani-wja1mw` in both repos and
checkpointed at ~00:45Z on 2026-10-20 (context 79% used). Handoff 429 (**SkyFrame**) is the funding side session's state:
read it only if Sam opens you for the funding tab. If the routine started you, follow
`docs/reference/scheduled_sessions.md` first.

## Sam's words this run

- **~23:37Z, the opening ask** (verbatim in `cpl_memory` `sam-ctdl-partners-cobi-authoritative-2026-10-19`, verified,
  and the vault braindump `braindump-2026-10-19-2337-ctdl-partners-and-cobi-authoritative`): a collaborative element in
  the harvest with WestEd and Credential Engine; code instructional data with CTDL for portability and national scale;
  *"Let's keep COBI authoritative in all this and plug in where it makes sense"*; Malone is integral as tech lead; does
  the Commons need a step; how to keep the cooks apart.
- **~23:55Z:** CE's Antelope Valley courses and programs sheets, *"to see what they are capturing and how they are coding
  with CTDL."*

## What shipped (S428)

- **#2264's live steps confirmed.** `supabase-rekey.yml` run 39342011308 (23:30Z, success); read back live: AGAB M1006
  carries Sam's discipline row, no row is keyed AUTB M1006, AUTB M1071 reads Auto Body Technology.
- **The strategy, a Claude Doc Sam edits and comments on:**
  [CTDL Partner Strategy](https://claude.ai/artifact/MYxdr83s2HjDQbKTXaGr6C): what CE has built, a table of each COBI
  layer and its CTDL class, the strategy (one owner per fact, one writer per store, the crosswalk, stable keys, two
  readers of one catalog, first steps), a work-lanes drawing, the cooks, the exchange repository for Malone, the
  Commons' Linked step, sources.
- **[Open Asks Sheet 102](https://claude.ai/artifact/4VKzfjdbAUTmUqPfNaNoD4)** (`SHEET_ID` `2026-10-20-open-asks-102`,
  db and comments, store empty at publish): six cards, all from the new lane.
- **The lane** `docs/reference/lanes/ctdl-partner-exchange.md` and its §11 row; the KB note
  `docs/kb-notes/reference-ctdl-classes-for-cobi-records.md`; the lessons `docs/ctdl_partner_exchange_lessons.md`.
- **`cpl_memory`:** six rows under `S428 SkyPinyon` (Sam's, verified; five proposed), each logged in `cpl_memory_log`.

## Priority

1. **Sheet 102's replies first** (`ArtifactData` `list`, collection `replies`, on its URL). Apply each ruling in the
   lane and drop the card from `CPLBrain/decision-sheets/_build_open_asks_decision_sheet.py` in one PR per repo, the
   tracker's first. On card 1 *exchange*: a session cannot create a repository in the CPL-Initiative organization; draft
   the exchange's `README.md`, `CLAUDE.md` and contract v0 (the field lists, the identifier rules, the CTDL mapping, JSON
   Schemas) as files and hand Malone the paste. On card 2: the crosswalk ingest of CE's extracts waits for the exchange;
   partner data never lands in the public tracker.
2. **The queue (handoff 428's 2 to 4):** ruling 4, the Jev sitting over the AGRI residual (`typesafe-smoke.yml`
   `agri_families=true`, the run's `jev-agri-families` artifact, a card for Sam); ruling 6, the nine renames under one
   window; then the quarterly routines, the 110 strays and the Commons' remaining Progress views.
3. **Questions for CE, through Sam or Malone:** does a re-upload match on External Identifier, and how does CE plan to
   link programs to courses (xTRA's `doc/future-direction.md` names it its next step).

## Patterns that worked

- Read a whole spreadsheet as an xlsx export. The Drive connector's `read_file_content` returned 14 rows per tab, which
  showed 2 colleges Ready to Publish where the sheet holds 10.
- `credreg.net` is refused at the proxy; `CredentialEngine/Schema-Development` carries CTDL as JSON-LD
  (`src/SHACL/TestFiles/ctdl_20260626.jsonld`), and its `Pathway-Examples` hold CE's own pathways.
- A helper agent's counts are claims until re-measured: Taft's CTID collision is 237 of 237 rows (it said 83), and Mt.
  San Antonio has 96 of 140 course rows without a course code (it said 65 degrees or certificates).

## Lessons to honor

- The repo's Supabase guard holds an UPDATE on `cpl_memory`; a correction is a new row that names the row it corrects
  (`ce-ten-college-extracts-second-reading-2026-10-20` corrects the last sentence of
  `ce-xtra-extracts-flat-and-unkeyed-2026-10-20`).
- A decision-sheet chip label cannot carry a semicolon, and each measured predicate needs a fixture in
  `open_asks_sheet_coverage_test.py`.
- CE's extract copies lived in the session scratchpad only and are gone with the container; re-read them through the
  Drive connector (the tracker sheet's fileId is in the lane).

## Not refreshed

The Pipeline tab (the pipeline did not move), the UI pass (no room for a fix PR; the ledger keeps its view due),
`kb/README.md`, `README.md`, and the exhibit, CR and subjects run logs (untouched). `CLAUDE.md` stands at 60.6 KB against
its 60 KB budget, over before this run; the row added here is the lane's pointer.

## Let go

S428 drops at sign-off: the subscriptions to this run's two PRs, and the artifact watches on the strategy doc and Sheet
102. No check-in is armed.
