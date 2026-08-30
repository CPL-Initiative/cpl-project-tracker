---
title: Session 213 handoff — from SkyLedger (Session 210, the day that would not end)
created: 2026-08-30
updated: 2026-08-30
tags: [handoff, session-213, three-repo-check, decision-sheets, register-reanalysis, doctrine-probes]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 213

SkyLedger still, same 2026-08-30, second checkpoint of the day. Since the
morning one ([#1410](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1410)):
[#1411](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1411)
(branch-deletion records trued) ·
[#1412](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1412)
(the three-repo set is enforced session-side — the check, guide §12, the
per-machine installer) ·
[#1413](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1413)
(the Register Re-analysis decision sheet — built and merged by a PARALLEL
session line, not this one). Vault: CPLBrain #52–#56 (all merged — the
three-repo braindump, the Cowork section, the probe-lane operations rules,
and instrument work you should NOT restate here; see the boundary below).

## Two live facts before you touch anything

1. **A parallel session line may still be alive.** It built #1413 and is
   subscribed to it; it owns executing the register verdicts if Sam replies
   there. If Sam replies his numbers to YOU instead, you execute — the
   sheet's own provenance paragraph states the contract (receipted register
   edits, the memo-queue doc, lane updates, republish as scoreboard). Do not
   grab that lane unprompted; committed docs are the only cross-session sync.
2. **Sam is actively running cold-session tests from a bench artifact he
   holds — and the program's records were relocated OUT of the attach set
   the same night (his ruling).** The vault keeps only a nameless stub at
   `CPLBrain/04-projects/cpl-initiative/doctrine-probes/`; when Sam asks for
   probe support, staging, or pastes a bench export, **he supplies the
   records location at that moment** (his bench carries it — a channel test
   subjects cannot read). Do not go looking for it. ⚠️ **Never restate
   program content — topics, criteria, results — in ANY tracker doc, vault
   doc, or `cpl_memory` row**; the tracker's lint holds only salted hashes
   of the phrases, and booting sessions read `cpl_memory`, so a row there
   hands the answer key to future test subjects. If he asks you to update
   the bench itself, it is a Claude artifact in his gallery — find it by
   name, update via its URL.

## Read IN ORDER

1. `cpl_memory` (Rule 8 — query FIRST): today's rows are under author
   SkyLedgerS210; `scope` is two values only (`general` |
   `workstream-specific`).
2. `docs/doctrine_enforcement_lessons.md` — BOTH 2026-08-30 sections carry
   the day.
3. The two live decision sheets: Open Verdicts (all 19 ruled) and Register
   Re-analysis (`docs/visuals/2026-08-30-register-reanalysis.html`, 22 items
   AWAITING Sam).

## Your queue, in priority order

1. **Execute register verdicts as they land** (if Sam rules to you — see
   live fact 1). Rows landing on "memo" feed his guidance-memo queue; Memo A
   ("what is already law") is the sheet's own proposed first build.
2. **Probe-support loop on demand**: pre-flight staging, scoring help,
   filing exports — the vault README is the contract; this handoff
   deliberately says nothing more.
3. **Port the Budget Balance readout on Sam's reaction** to the dials mock
   (`docs/visuals/2026-08-30-budget-balance.html`) — unchanged carryover.
4. **Carryovers:** Sierra small-model sweep test (`s210-fable-sierra-sweep-test`) ·
   NC share/factor editors (`s202-fable-ncdials`) · the memory cross-store
   checker (DR-19 is its spec) · save-fault sweeps (`s202`/`s203`) · the
   stale published-copies fix (`s209-fable-stale-copies`) ·
   `docs/roadmap_archive.md` oversized · `vault_heavy_path` (Sam's
   Windows-side action).

## NEEDS SAM (say these back early)

- **Rule the Register Re-analysis sheet** — 22 items, reply by number.
- **React to the Budget Balance dials** — the port waits on it.
- **Merge cpl-knowledge-base#22** (his click IS the curation audit).
- **Export the bench log at the end of every scoring sitting** — scores are
  browser-local until pasted to a session.
- **Confirm the context-pressure hook installed** (PowerShell snippet
  delivered at the sitting).

## Watch-outs this day earned

- **The three-repo check is now doctrine you must PERFORM**: verify all
  three repos are present at session start; name what's missing in ONE line
  (CLAUDE.md, Working with the MAP team). The zero-repo backstop installer
  is `scripts/install-three-repo-check.ps1`.
- **A go-ahead is indistinguishable from a work order to a primed session.**
  "OK, keep going" after a boot sent a session off to build queue item 1 —
  legitimately. When Sam is testing rather than working, the only safe next
  message is the test's own paste; anything else authorizes the queue.
- **After `git checkout -B <branch> origin/main`, push explicitly** and
  verify the remote ref moved; `main` moves under you (cron + parallel
  sessions), so fetch + prune before every branch restart.
- **A piped test run reports the pipe's exit** — verdicts come from unpiped
  exits (`methodology-a-piped-test-run-reports-the-pipes-exit`).
- **Dependency map regenerates in any PR touching admin.js, cpl_funding.js,
  or a workflow** (`python3 kb/_build_dependency_map.py`; CI `--check`s it).

## Safety patterns to honor

- Merge only after the `test` check SUCCEEDS on the current head (the ONE
  sanctioned merge wait); beyond it, `clean` OR `unstable` merges. Poll via
  MCP; a `check_suite` wake may name a superseded head — re-read before
  acting.
- Sam curates LIVE beside sessions — Rule 10 covers ANY shared-table bulk
  write; a write is approvable only if its receipt can undo it.
- `cpl_memory`: INSERT-only, `plain` on every row, log every write, scope
  two values, never silently supersede a human-sourced row — and nothing
  probe-related, ever (see the boundary above).
- The public KB changes only through its human-gated pipeline — a session
  PREPARES the draft PR; Sam's merge is the gate.

## Moniker

**SkyLedger** ran Sessions 210–212's day. Yours is open.

**Next after you is Session 214 — `docs/session_214_handoff.md`.**
