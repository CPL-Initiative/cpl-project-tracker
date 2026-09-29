---
title: Session 214 handoff — from SkyMirror (Session 213, the stale-greeting boot)
created: 2026-08-30
updated: 2026-08-30
tags: [handoff, session-214, gr-register, decision-sheets, doctrine, probes]
kb-status: internal
obsidian-folder: cpl-project-tracker
superseded: true
superseded_by: session_215_handoff.md
---

# You are Session 214

SkyMirror here. 2026-08-30 ran THREE parallel session lines, and two of them
checkpointed within the same hour: `session_213_handoff.md` (SkyLedger's PM
half — #1411/#1412/#1414) and this file (my evening half — #1415, merged onto
it). **Read 213 too**; neither supersedes the other, the 203/204 precedent.
My session booted from a STALE greeting (it named 205/208 while 212 was
highest — Rule 9's known failure mode), verified the ladder, ran Rule 8,
found the S212 queue's item 1 already merged (#1413), and spent the run on
register-lane truth and the doctrine-probe lane's queued groundwork
(vault-side, CPLBrain#59). It also ate the conflicted-PR trap so you don't
have to: zero check runs on a fresh PR means check `mergeable_state` FIRST —
`dirty` produces no `pull_request` run at all.

## Two live facts (carried from 213, still true)

1. **Parallel session lines may still be alive.** The #1413 line is
   subscribed to its PR and owns executing the register verdicts if Sam
   replies THERE. If Sam rules to YOU, you execute — the sheet's provenance
   paragraph states the contract (receipted register edits, the memo-queue
   doc, lane updates, republish as scoreboard). Do not grab the lane
   unprompted; committed docs are the only cross-session sync.
2. **Sam is actively running cold-session tests from a bench artifact he
   holds.** ALL of that program's state, protocol, instruments, and results
   live in the VAULT: `CPLBrain/04-projects/cpl-initiative/doctrine-probes/`
   — read its `README.md` FIRST if he asks for probe support, staging, or
   pastes a bench export. ⚠️ **Never restate that folder's contents —
   topics, criteria, results — in ANY tracker doc or in `cpl_memory`**;
   booting sessions read `cpl_memory`, so a row there hands the answer key
   to future test subjects. This rule was applied retroactively to S213's
   own drafts during the #1414/#1415 merge — it binds you too.

## Read IN ORDER before touching anything

1. `cpl_memory` (Rule 8 — query FIRST, per workstream; re-query when you
   PIVOT workstreams mid-session, that is the rule's unit).
2. `docs/session_213_handoff.md` — the PM half's full picture.
3. The register sheet, if Sam has ruled: `docs/visuals/2026-08-30-register-reanalysis.html`
   — 16 rows × still-needed × instrument, 5 candidate rows (#17–21), the
   three-memo grouping (item 22). His verdicts arrive by number, often
   mid-turn; execute each as it lands.
4. `docs/reference/lanes/gr-register.md` — current truth, including the
   sequencing warning below.

## Your queue, in priority order

1. **Execute Sam's register verdicts when he rules by number** — receipted
   register edits under Rule 10 (fresh read at write-time, per-edit receipts
   in the log, reversible from the receipt). Rows landing "memo" feed his
   guidance-memo queue (three memos are pre-grouped on the sheet).
   ⚠️ **Sequencing:** the Sierra small-model sweep test (todo
   `s210-fable-sierra-sweep-test`) compares against the LAST full-model run,
   so run it BEFORE verdict execution rewrites rows — same ground on both
   sides. If Sam rules first, note the ground moved and re-baseline instead.
2. **Port the Budget Balance readout on Sam's reaction** to the dials mock
   (`docs/visuals/2026-08-30-budget-balance.html`) — unchanged, still waits
   on him.
3. **Probe-support loop on demand** — the pre-run groundwork is DONE
   (criteria re-read with dated addenda, perimeter verified, the ablation
   recipe written). What remains is mostly Sam-run sittings; the vault
   folder's lane-state file says exactly what is runnable today and what
   each needs. This handoff deliberately says nothing more (live fact 2).
4. **The cross-store checker** (`kb/_doctrine_scenarios.py`, honest 10 of 12):
   a `cpl_memory` row contradicting doctrine, and a conditional checkpoint
   item the auditor cannot see — an architecture step spanning two stores;
   DR-19 is its spec. Related standing hole: the leak scan reads `.md` only
   while `kb/cpl_todos.json` renders on the public dashboard.
5. **Carryovers:** NC share/factor editors (`s202-fable-ncdials`); the two
   save-fault sweeps (`s202-fable-savesweep`, `s203-fable-savesweep2`); the
   5 British-form filenames (one coordinated pass: names, wikilinks,
   `cpl_memory` rows); `docs/roadmap_archive.md` oversized (decide whether
   the `other` budget is wrong for an archive lane before compacting);
   `vault_heavy_path` (45 — Sam's Windows-side sparse-checkout);
   `cpl_pathways_ccr_data.js` stale-copy fix; the `prose_only()` 4-space
   continuation blind spot (deliberate pass of its own — the fixer shares
   the definition).

## NEEDS SAM (say these back early)

- **Rule by number on the register re-analysis sheet** (the queue's gate).
- **React to the Budget Balance dials** (queue item 2's gate).
- **Merge cpl-knowledge-base#22** (his click IS the curation gate).
- **Confirm the context-pressure hook installed** (`s206-sam-install-hook`).
- **Export the bench log at the end of every scoring sitting** — scores are
  browser-local until pasted to a session (`s210-sam-export-bench-log`).
- **The probe lane's open decisions** — recorded vault-side; one line from
  him picks the path.

## Watch-outs this run earned

- **A stale greeting is a live possibility, not lore** — this session got one.
  `ls docs/session_*_handoff.md`, sort NUMERICALLY, read the highest, and say
  the divergence out loud before working.
- **A merged PR without its checkpoint leaves the lane lying** — #1413 was on
  main for hours while the lane file still said "queued next sheet". If you
  merge substantive work, move the lane file in the same run, even outside a
  full checkpoint.
- **Rule 8 is per-workstream.** Query again when the session pivots lanes;
  the boot query does not cover the lane you end up working.
- **The To-Do feed is a public render surface** — no instrument phrases, no
  experiment branch names; the docs lint does NOT scan JSON (see queue 4).
- Merge only after the `test` check SUCCEEDS on the current head (docs-only
  ~1.5 min, code ~9); beyond it `clean` OR `unstable` merges; poll via MCP,
  and re-read `get_check_runs` on the CURRENT head after any wake.

## Safety patterns to honor

- Sam curates LIVE beside sessions — Rule 10 covers ANY shared-table bulk
  write; a write is approvable only if its receipt can undo it. Register
  verdict execution is exactly this shape: per-row before/after into
  `cpl_memory_log`-style receipts (`gr_revisions` edits get their own
  receipt trail; see the lane file).
- `cpl_memory` writes: INSERT-only, `status='proposed'`, `plain` on every
  row, `scope` is two values only (`general` | `workstream-specific`), log
  every write, never silently supersede a human-sourced row.
- The public KB changes only through its human-gated pipeline.
- Never force-push `main` (also platform-enforced now).

## Moniker

**SkyMirror**, claimed this run. Yours is open.

**Next is Session 215 — `docs/session_215_handoff.md`.**
