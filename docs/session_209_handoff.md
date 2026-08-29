---
title: Session 209 handoff — from SkyThread (Session 208, threading rules to guards)
created: 2026-08-29
updated: 2026-08-29
tags: [handoff, session-209, doctrine, probes, claude-md, docs-corpus]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 209

SkyThread here. Two PRs:
[cpl-project-tracker#1389](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1389)
and [samueltlee/CPLBrain#38](https://github.com/samueltlee/CPLBrain/pull/38).

## The doctrine-probe lane — state is in the VAULT, not here

⚠️ **Deliberate.** A handoff in this repo is readable by any session that clones
it, and `CLAUDE.md` tells every session the highest-numbered handoff is
authoritative — so a handoff that describes the experiment hands the experiment
to its own subjects. That is the same defeat-by-diligence the lane already found
one level down, and it cost this session a run before it was noticed.

**Everything about that lane — what was found, what is blocked, what to run next,
and the instruments themselves — is in
`CPLBrain/04-projects/cpl-initiative/doctrine-probes/`.** Read it there before
touching the lane. Do not summarize it back into this file.

## A real bug, found incidentally and independently confirmed

`tests/esl_relevel_bands_test.py` imports **`_esl_relevel_dryrun`** — the
superseded absolute bands. The live **`kb/_esl_ladder_relevel_dryrun.py`**
(Sam's per-ladder sets, holding the purpose-carve-out skip) has **no test
referencing it at all**. Verified independently:
`grep -rln _esl_ladder_relevel_dryrun tests/` returns nothing. The guards cover a
dead path; the live one is unguarded. Recorded in
[`lanes/esl-packaging.md`](reference/lanes/esl-packaging.md); **not fixed this
run** — it is ESL work, not doctrine work, and deserves its own care.

## Your queue, in priority order

1. **The doctrine-probe lane.** State, blockers and next actions are in the
   vault (see the section above). ⚠️ Do not restate them here.

2. **The two uncaught scenarios are the real backlog.** `kb/_doctrine_scenarios.py`
   scores **10 of 12** honestly. What is missed: **a `cpl_memory` row that
   contradicts doctrine** (the memory table has no lint at all) and **a
   conditional checkpoint item nobody can audit** (the auditor cannot see the
   vault). Both need a checker spanning two stores — an architecture step, not
   another rule in `CLAUDE.md`.
3. **`cpl_memory.scope` — still Sam's call, still do not write it.** Unchanged
   from 207: 68 of 652 rows, uncontrolled vocabulary, 25 of the 68 duplicated in
   the row's own `tags`. Recommendation stands: a two-value axis, `global` vs
   `lane-local`, with `tags` keeping topic.
4. **Carryover from 205/207, untouched:** the 5 British-form *filenames*,
   `docs/roadmap_archive.md` at 3.48× (decide whether `other` is simply the wrong
   budget for an archive lane), `vault_heavy_path` (45; a Windows-side
   sparse-checkout action for Sam), the two public-KB recommendations awaiting
   Sam's go, and **whether the hook installed** — Sam ran the PowerShell on
   Windows 5.1 and it cannot be tested in the sandbox, so it is reviewed, not
   verified. Ask him.

## Settled — do not re-derive

- **Lane retirement: 0 of 30.** Established by READING all 30. `military-ace` has
  *NEEDS SAM (4 questions)*, `noncredit-cip` has *BLOCKED ON JENNI* **and**
  *BLOCKED ON SAM*, `public-private-split` has *BLOCKED ON SAM ①–⑤*,
  `excel-to-supabase` has *Remaining: P3/P5*, `disposition-grain` holds
  load-bearing invariants. `lane_retirement_signal` runs the test now — **do not
  hand-grep it.** Every hand-grep has been wrong: S206 called five rows
  retirable (four had open-work lists); S208 got it wrong three more ways in one
  run, and the lint's own first cut was wrong once more.
- **The `CLAUDE.md` budget is sorted.** 49,098 → 50,421 B with the S208
  narrative, against 60,000. Rule 9's artifact list is **gone on purpose** —
  `.claude/commands/checkpoint.md` is the authority; do not paste it back.
- **The context meter works.** Verified live this session (`104,066 / 786,077`).
  ⚠️ Its ceiling self-calibrates from compactions the transcript has seen, so in
  a remote session with a different budget the *runway* figure is indicative,
  not exact. The live number is trustworthy; the divisor is the soft part.

## Patterns that earned their keep

- **Break the guard on purpose, against the LIVE file.** Every new guard here was
  perturbation-tested by deleting each claim in turn from the real `CLAUDE.md`
  and asserting exactly one was reported. That is what caught the wrapped-line
  false positive and the arity-dispatch bug.
- **Distrust a score that improves.** "11 of 11" was one guard firing on stub
  fixtures and **concealing the two failures nothing catches**. A rising number
  is the moment to check the fixtures, not to celebrate.
- **Re-measure the inherited number.** Handoff 207 said four lanes carried open
  work; my first three greps said zero did. The handoff was right and my
  instrument was wrong — three times, three different ways.
- **Score a change against `kb/_doctrine_scenarios.py` before building it.**
  Both new scenarios reported — NOTHING — first, which is what justified the
  guard rather than assuming it.

## Safety patterns to honor

- Never force-push `main`. Merge on `clean` **or** `unstable`.
- A `check_suite` wake names a routinely superseded `head_sha` — re-read
  `get_check_runs` on the current head.
- Ask before writing a shared artifact another live session owns. Only
  dependabot PRs were open this run.
- Sam, 2026-08-28: *"If we need to add to a supabase table, recommend."*

## Moniker

**SkyThread**, claimed this run (Sam opened with "Hey Sky" and left it open).
Yours is open too.

**Next is Session 210 — `docs/session_210_handoff.md`.**
