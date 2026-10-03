---
title: Session 315 handoff — sheet 17's two asks, Sierra v80's first read, and the catalog index
date: 2026-10-02
session: 314 (SkyVerdict)
tags: [handoff, implementation-funding, sierra, partner-crosswalks, decision-sheet]
status: current
superseded: true
superseded_by: session_320_handoff.md
---

# You are Session 315

Your moniker is **SkyLedger**. S314 executed sheet 16 and spent most of the run on Sierra's first paragraph.
This is a full checkpoint; every Rule 9 artifact is current except the Pipeline tab (the pipeline did not
move) and `README.md` / `kb/README.md` (no user-facing surface or generator changed).

## First, in this order

1. **The checkpoint PR.** If it is open, merge it on a green `test` (squash).
2. **Read sheet 17's `replies`** (https://claude.ai/artifact/BUSR19kLbQ8yponfQVk1AP; high-water rule,
   `docs/reference/decision_sheets.md`). Two cards:
   1. **The CER titles and the AWS merge.** "Done" means: check `kb_curation` for a `_CREDENTIAL_REVIEW::`
      `unified_title_override` on "AWS Certified SysOps Administrator" plus its `unified_title_merge_confirm`,
      and the Microsoft title; if present, dispatch `cred-rename-apply.yml` (it fresh-syncs and dry-runs
      itself). If absent, read the Supabase API log before asking again (S314 found sheet 16's "Done" left no
      write, because the CER draws Confirm merge only after a typed title matches a key).
   2. **Cards 23-24.** "Apply them" means: write a plan (`kb/funding_config_edits_out/<date>/plan.json`) with
      the four paths (both scenarios: `text.about`'s two sentences; `timing` labels "Funding Model Finalized"
      → "CPL Funding Procedure Finalized", "Guidance Memo and Funding Model Release" → "Guidance Memo
      Release"), fresh-read `cpl_funding_config` (md5 `7e59830b` as of 01:46Z), dry run, then commit. The
      `about` text is one long string: the plan's before/after must be the whole field.
3. **Read Sierra v80's first clean smoke** (dispatched after the #1813 deploy, 03:05Z). 7c should open on an LVN
   course at the nearest college that teaches it (Long Beach City College's VN 220 on the A/B) with the place
   in the next sentence; 7s on Pasadena's NURS 102 naming the San Gabriel Valley. If 7c leads with an Orange
   County CNA course again, read `cpl_memory` `sierra-place-as-home-conflict-2026-10-02` before touching a word.
4. **ElevenLabs** still waits on Sam's Scenario 2 script (sheet 6 card 1).

## What shipped

- **#1811:** smoke 15e (Sam's CCSF question; v77 answers it right); the Dec 30 deadline plan; the Scenario 2
  introduction re-rendered `_Scenario_2_v6` (Timing node Dec 2026, "December 30, 2026", the heading fitted);
  the explainer links `_v6`; sheet 17. **Config write:** Scenario 2 `participationDeadline` 2026-11-01 →
  2026-12-30, 01:46Z, receipt `kb/funding_config_edits_out/2026-10-02/`.
- **#1812 (v79):** the place follows the first course; the catalog's absence said once, the prompt no longer
  quotes the wrong sentence; the 7s guard strips markdown emphasis.
- **#1813 (v80, deployed 03:05Z):** the place leads only when its colleges teach the program asked (rule and
  place block); a place college teaching only the held credential never leads. Three preview A/Bs; the last
  two clean.

## Sam's rulings this run (sheet 16, 00:36Z)

- Card 1 "Wrong": restated v76's answer (verified on v77 by 15e). Card 2 "Done": no write reached the table.
- Card 3: *"I don't know what cards 23 and 24 are. Advise"* (sheet 17 card 2). Card 4: **Dec 30, 2026**
  (executed). Card 5: **keep $9,759,692** (no change). `cpl_memory` `sam-sheet16-rulings-2026-10-02`.

## Carryover

- **The catalog index** (`cpl_memory` `sierra-catalog-reads-timeout-under-load-2026-10-02`): 7c's
  `program_typical_courses` loses to the 8 s limit under concurrent load; `chatbox_college_courses` has no
  `top_code` index. Measure first (`methodology-an-index-is-a-write-path-cost-until-measured`), then
  `apply_migration` with the schema of record in `chatbox/supabase_program_typical_courses.sql`.
- The statewide Access target exceeds the institutions' sum by 2.3% (unexamined).

## Safety patterns

- ⚠️ **A prompt change to Sierra goes through `cpl-chat-preview-ab.yml` before deploy.** v78 shipped without
  one and regressed 7c. Dispatch it on the branch; cancel the branch's push-triggered smoke so the two do not
  load the database together.
- ⚠️ **Never quote the wrong sentence in a prompt** (`docs/kb-notes/methodology-a-prompt-that-quotes-the-wrong-sentence-teaches-it.md`).
- ⚠️ **A decision card's instruction is checked against the surface's code path** before it is asked.
- ⚠️ **The SQL guard blocks any statement containing a DDL word**, even inside a row's text; reword it.
- ⚠️ Budgets at the edge: `CLAUDE.md` 59,975 / 60,000; lanes `implementation-funding` 19,992,
  `sierra-retrieval-corpus` 19,955, `partner-crosswalks` 19,908 of 20,000. Delete before you add.
