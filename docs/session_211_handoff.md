---
title: Session 211 handoff — from SkyLedger (Session 210, all six remediations built)
created: 2026-08-30
updated: 2026-08-30
tags: [handoff, session-211, doctrine, remediations, citation-drift, memory-consolidation]
kb-status: internal
obsidian-folder: cpl-project-tracker
superseded: true
superseded_by: session_215_handoff.md
---

# You are Session 211

SkyLedger here. Four PRs, all merged:
[#1400](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1400)
(remediation E — the js-tests gate),
[#1401](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1401)
(the docs-only skip-path verification, riding on the S210 lessons section),
[#1402](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1402)
(remediations B, C, D, F), and
[samueltlee/CPLBrain#46](https://github.com/samueltlee/CPLBrain/pull/46)
(the vault's Rule-8→9 renumber). Plus the checkpoint commit carrying this file.

## Where the doctrine lane now stands

**All six remediations from Sam's 2026-08-29 ruling are BUILT.** A (#1396,
S209) · B/C/D (#1402: Rule 10 widened to any shared-table bulk write;
reversible-from-receipt with `docs/reference/data_write_rollback.md`; new
write surfaces route through Governance + the privacy ADRs) · E (#1400:
one `if:` on `npm test`, fail-safe skip-list in `scripts/js_suite_gate.sh`,
gate steps verified live on both PR shapes — docs PRs report in ~1.5 min;
⚠️ honest caveat: both verification runs' CHECKS were themselves red at the
stale-dependency-map step until #1402 cured it — main@ba76dcb is green,
confirmed) · F (#1402:
16 living files renumbered, `citation_drift` lint added). **E's endgame
RESOLVED late 2026-08-30, Sam's amended ruling:** a required-check ruleset was
live-tested and REJECTED all five cron push attempts (GH013 — rulesets gate
every ref update, no Actions-bot bypass), so the `test` gate is
**doctrine-level**: the check must SUCCEED on the head before a session
merges (branch policy amended; evidence in
`docs/reference/branch_policy.md`'s dated section). The ruleset stays Active
with **force-push + deletion blocks only** — Rule 5 mechanically enforced
for the first time. No flip is pending; the deploy-key bypass stays in the
drawer.

Read IN ORDER before touching anything:
1. `cpl_memory` (Rule 8 — query FIRST): tags `doctrine`, `dependency-map`;
   this run's rows are under author SkyLedgerS210.
2. `docs/doctrine_enforcement_lessons.md` — the 2026-08-30 sections hold the
   full E-gate and B/C/D/F stories, including the two false greens.
3. `CPLBrain/04-projects/cpl-initiative/doctrine-probes/` — the probe lane's
   state, criteria, and queue live in the VAULT, not here.

## Your queue, in priority order

1. **The probe re-tests (S3/S5) + the repaired ablation** — now against a
   SETTLED corpus (that was the point of finishing B–F first). Before
   spawning anything: re-read the vault criteria against the post-remediation
   corpus and record dated addenda beside the rubric where ground truth moved
   (never edit the rubric in place). Ablation notes: `dependency_map.md`
   regenerates FROM CODE, so deleting `CLAUDE.md` no longer removes the
   cross-impact doctrine — a control getting it "free" from the map is the
   pruning instrument working, not contamination. Honor the vault mechanics:
   pass `source_url` on spawn, a probe's only channel back is a PR, P5 stays
   BLOCKED (false premise + memory-write risk), P4 is Sam's, P6 waits for
   `checkpoint_overdue` to fire naturally.
2. **The two uncaught scenarios** (`kb/_doctrine_scenarios.py`, honest 10 of
   12): a `cpl_memory` row contradicting doctrine, and a conditional
   checkpoint item the auditor cannot see. Both need a checker spanning two
   stores — an architecture step, not another `CLAUDE.md` rule.
3. **`cpl_memory.scope` — STILL Sam's call, still do not write it.** Unchanged
   since 207: ~68 of 650+ rows carry `scope`, uncontrolled vocabulary.
   Standing recommendation: two values (`global` vs `lane-local`), `tags`
   keeps topic. Put it to him, then execute what he picks.
4. **Carryovers, untouched:** the 5 British-form *filenames*;
   `docs/roadmap_archive.md` oversized (decide whether `other` is the wrong
   budget for an archive lane); `vault_heavy_path` (45 — Sam's Windows-side
   sparse-checkout action); the two public-KB recommendations awaiting his
   go; whether the context-pressure hook installed on his machine (ask).

## RESOLVED after this handoff was first written (2026-08-30, same day)

- **The 15 governance candidates are RULED** (the Fifteen Tables sheet):
  DR-19..DR-23 + CA-07, folds into DR-09/DR-13, `cpl_reflections` dismissed.
  Register + surface map carry it; noise guard back to <25; queue now 11
  (9 cadences + 2 tab RPC candidates still to judge). DR-19 carries Sam's
  memory edit-rules clarification and doubles as the S211 checker's spec.
- **Row `f7`'s provenance refreshed** to Rule 10c on Sam's approval (the
  before-value is in `cpl_memory_log`).
- **Decision sheets are now the standing method for Sam's decisions** (his
  ruling, verbatim in the memory row
  `sam-ruled-decisions-arrive-as-decision-sheets`): pending judgments are
  gathered onto ONE numbered First Light sheet in `docs/visuals/`, he replies
  by number, a session executes. Doctrine: the CLAUDE.md bullet under
  *Working with the MAP team*; human-facing:
  `docs/working_with_claude_code.md` §11. **Every open verdict as of
  2026-08-30 evening is on `docs/visuals/2026-08-30-open-verdicts.html`**
  (19 items — it consolidates this file's NEEDS SAM list, the To-Do feed's
  For-Sam items, and the 2 remaining tab candidates). If Sam has ruled by
  the time you read this, execute from his reply; if not, the sheet is
  already served — do not re-ask item by item.

## NEEDS SAM (say these back to him early)

- **React to the "Blast Radius" Admin-pane mock** (S209's artifact).
- **Delete the S208 control branch** on GitHub — its NAME is written only in
  the vault's probe lane-state file, because the name itself encodes a probe
  topic (this bullet's first draft reproduced it and tripped
  `probe_instrument_leak` — the third recursion of that leak class). Sessions
  cannot delete branches; it is a one-click for Sam.
- **`cpl_memory.scope` ruling** (queue item 3).
- **Public KB `claude/CLAUDE.md`**: one "(Rule 8)" → "(Rule 9)" — that repo
  changes only through its human-gated curation pipeline, so it is his.
- **Confirm the context-pressure hook installed** on Windows.

## Watch-outs this run earned

- **A score that improves is when to check the fixtures — and now the harness
  checks them itself.** `_assert_fixtures_current()` refuses to score when
  `BASE_CRITICAL`/`BASE_RULES` no longer satisfy the guard registry. If you
  grow `CRITICAL_RULE_DOCTRINE`, the harness will crash with the claim to
  add — that crash is the feature. KB note:
  `methodology-a-harness-must-verify-its-own-fixture`.
- **`prose_only()` masks 4-space list continuations as code AND the
  unindented lines after them** — latent corpus-wide blind spot for the
  spelling/word-pair lints. Not patched (the fixer shares the definition);
  worth a deliberate pass of its own.
- **A workflow edit is a dependency-map input.** Touch
  `.github/workflows/` → rebuild `kb/dependency_map.json` in the same PR, or
  main's push runs go red at the drift check (#1400 did exactly this;
  #1402 cured it).
- **Cite rules as they are numbered TODAY; capsules stay verbatim.** The
  `citation_drift` lint guards living docs; grow it one measured pattern at
  a time — the exhibit skill has its OWN internal Rule 8b/9 numbering.
- The gate's decision rule lives in `scripts/js_suite_gate.sh`; its boundary
  is pinned both ways by `tests/js_suite_gate_test.py`. Change one, run the
  other.
- **Adversarially verify the checkpoint before committing it — it paid four
  times here.** Three refuter agents (GitHub facts / paths / numbers) caught:
  a handoff bullet corrupted by a killed background loop's disk state; an
  INHERITED S209 claim refuted (`kb/credentials.json` is NOT rebuilt by
  `cos-authority-sync.yml` — the `--apply-issuers` branch that writes it
  never runs there, and the regenerated map agrees; only the
  `cpl_pathways_ccr_data.js` stale-copy find stands); the renumber count
  (16 living files, not 14); and the missing caveat that the E-gate
  verification runs were themselves red at the stale-map step.

## Safety patterns to honor

- Never force-push `main` (now also platform-enforced). Merge only after
  the `test` check SUCCEEDS on the head; beyond that, `clean` OR `unstable`
  merges. Poll CI via MCP tools; a `check_suite` wake names a superseded
  `head_sha`.
- Sam curates LIVE beside sessions — Rule 10 now covers ANY shared-table
  bulk write, and a write is only approvable if its receipt can undo it.
- `cpl_memory` writes: INSERT-only, `status='proposed'`, `plain` on every
  row, log to `cpl_memory_log`, never silently supersede a human-sourced row.

## Moniker

**SkyLedger**, claimed this run (Sam left it open). Yours is open too.

**Next is Session 212 — `docs/session_212_handoff.md`.**
