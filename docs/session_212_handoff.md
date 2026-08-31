---
title: Session 212 handoff — from SkyLedger (Session 210, the Open Verdicts sitting)
created: 2026-08-30
updated: 2026-08-30
tags: [handoff, session-212, decision-sheets, open-verdicts, funding, governance, register-reanalysis]
kb-status: internal
obsidian-folder: cpl-project-tracker
superseded: true
superseded_by: session_215_handoff.md
---

# You are Session 212

SkyLedger here, closing a very long 2026-08-30. Merged today, in order:
[#1404](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1404)
(branch policy: the `test` gate is doctrine) ·
[#1405](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1405)
(the Fifteen Tables rulings) ·
[#1406](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1406)
(decision sheets become the rule) ·
[#1407](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1407)
(rulings 1–19 executed: Combined column + records) ·
[#1408](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1408)
(frozen header + goal-card policy + pool card wired) ·
[#1409](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1409)
(Blast Radius on the Admin tab). Vault:
[CPLBrain#48](https://github.com/samueltlee/CPLBrain/pull/48) and
[#49](https://github.com/samueltlee/CPLBrain/pull/49) (on-the-fly braindumps —
the rule and two captures). Public KB:
[cpl-knowledge-base#22](https://github.com/CPL-Initiative/cpl-knowledge-base/pull/22)
sits as a DRAFT on purpose — Sam's merge is the curation gate.

## The two rules that now govern how you work with Sam

1. **DECISIONS ARRIVE AS DECISION SHEETS** (CLAUDE.md, Working with the MAP
   team). His verdicts stream back mid-turn, one number at a time; execute
   each as it lands and keep the sheet republished as the live scoreboard.
   `edit:` is where the best verdicts arrive — item 1 turned "400 or 350
   FTES" into "make them dials with an over/under readout". Expect overrides
   and record them verbatim.
2. **CAPTURE UNPLANNED SUBSTANCE ON THE FLY** (same section; vault mechanics
   in CPLBrain's CLAUDE.md + braindump skill). He never says "braindump" —
   the content appearing IS the trigger. Mention each capture in one line.

## Read IN ORDER before touching anything

1. `cpl_memory` (Rule 8 — query FIRST): today's 18 verified rows are under
   author SkyLedgerS210; `scope` is now a two-value vocabulary
   (`general` | `workstream-specific`) — never write any other value.
2. `docs/doctrine_enforcement_lessons.md` + `docs/cpl_funding_lessons.md` —
   the 2026-08-30 sections carry the whole day.
3. The Open Verdicts sheet (`docs/visuals/2026-08-30-open-verdicts.html`) —
   all 19 cards carry Sam's verbatim rulings; it is the record of the sitting.

## Your queue, in priority order

1. **The register re-analysis decision sheet** (Sam's item-8 order): all ~16
   GR register reforms against the post-SB 135 ground — trailer bill language
   became verbatim Ed Code — each row proposed as still-needed-or-not and, if
   needed, an INSTRUMENT: memo / Title 5 / legislative change / procedure.
   Raw material: `docs/gr_sb135_row_sweep.md` + the register's Lane B. Rows
   landing on "memo" feed his guidance-memo queue (item 7). Register rows #2
   and #10 fold in here (approved directionally, not yet rewritten).
2. **Port the Budget Balance readout on Sam's reaction** to the dials mock
   (`docs/visuals/2026-08-30-budget-balance.html`). The dials exist in
   config; the solver already computes feasibility; the build is the
   consolidated over/under surface on the funding tab.
3. **The probe re-tests (S3/S5) + the repaired ablation** — unchanged from
   the S211 handoff, still against the settled corpus; the vault's
   doctrine-probes folder carries criteria and mechanics. P5 stays BLOCKED.
4. **Two future sheets when Sam wants them:** owners for the 30 register
   rows; the 9 cadence candidates.
5. **Carryovers:** the Sierra small-model sweep test (todo
   `s210-fable-sierra-sweep-test`); NC share/factor editors
   (`s202-fable-ncdials`); the 5 British-form filenames;
   `docs/roadmap_archive.md` oversized; `vault_heavy_path` (Sam's
   Windows-side action); the cross-store checker for the two uncaught
   doctrine scenarios (DR-19 is its spec).

## NEEDS SAM (say these back early)

- **React to the Budget Balance dials** — the port waits on it.
- **Merge cpl-knowledge-base#22** (the Rule 8→9 renumber; his click IS the
  curation audit).
- **Confirm the context-pressure hook installed** (he has the PowerShell
  snippet from the sitting).
- **Test-speed follow-ups if he wants them:** the runner is already parallel
  at the measured memory cap (8.5 min is the free-runner floor); the next
  levers are a two-job shard (free on a public repo but splits the
  doctrine-load-bearing `test` check name) or Move 2, affected-only
  selection — both parked by his "1 for now".

## Watch-outs this run earned

- **A piped test run reports the pipe's exit** — KB note
  `methodology-a-piped-test-run-reports-the-pipes-exit`. Verdicts come from
  unpiped exits; CI caught what the local pipe masked (the `nc_lane` pair
  invariant, which the Combined column deliberately changed).
- **After `git checkout -B <branch> origin/main`, the upstream IS
  origin/main** — a bare `git push` targets nothing useful. Push explicitly
  and verify the remote ref moved. `main` was confirmed untouched.
- **The dependency map now maps its own viewer** (`module:admin.js` reads
  `kb/dependency_map.json`) — regenerate the map in any PR that touches
  admin.js, cpl_funding.js, or a workflow.
- **Before proposing tooling, read what is committed** — the "parallelize the
  runner" recommendation was already built (2026-08-28, measured peak-RSS
  cap, tested limiter, temp-file child output). The repo keeps answering
  questions before they are asked.
- The Combined column's hide machinery: NC rows carry one FEWER td (the
  spanning cell); `colHideStyleHtml()` compensates nth-child indices both
  ways. `tests/cpl_funding_combined.test.js` pins it — change one side, run
  the other.

## Safety patterns to honor

- Merge only after the `test` check SUCCEEDS on the current head (the ONE
  sanctioned merge wait); beyond it, `clean` OR `unstable` merges. Poll via
  MCP; a `check_suite` wake may name a superseded head — re-read the current
  head before acting.
- Sam curates LIVE beside sessions — Rule 10 covers ANY shared-table bulk
  write; a write is approvable only if its receipt can undo it (today's
  worked example: the 68-row scope migration, per-row before/after in
  `cpl_memory_log`).
- `cpl_memory` writes: INSERT-only, `plain` on every row, log every write,
  `scope` two values only, never silently supersede a human-sourced row.
- The public KB changes only through its human-gated pipeline — a session
  PREPARES the draft PR; Sam's merge is the gate.

## Moniker

**SkyLedger**, this run. Yours is open.

**Next is Session 213 — `docs/session_213_handoff.md`.**
