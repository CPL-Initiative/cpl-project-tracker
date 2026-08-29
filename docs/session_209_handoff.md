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

## ⭐ The doctrine question is ANSWERED — with a control

**Sam's goal was: do our always-loaded rules actually fire?** Four of his six
scenarios ran as **matched pairs** — same prompt, same model, one arm on `main`
and one on a clone with `CLAUDE.md` removed.

| scenario | doctrine | control | gap |
|---|---|---|---|
| S1 — 600K, no checkpoint | **8/8** | 3/8 | **5** |
| S2 — revising a tab | **8.5/9** | **1.5/9** | **7** |
| S6 — signing out | **6/7** | 2/7 | **4** |
| S4 — integrating tab | ~5.5/7 | void (ablation failed) | — |

⭐ **Every point of difference is specific mechanical action, never judgment.**
Both arms wanted to save the work and close cleanly; only the doctrine arm knew
to measure context, say the number, lint first, run `/checkpoint` rather than
improvise, edit the lane file not the §11 row, and sign off with moniker + next
handoff number. **That is the PUSH/PULL rule validated empirically.**

⭐ **Doctrine does a SECOND job nobody had named: it suppresses
plausible-but-wrong defaults.** S2's control proposed *"including dark mode if
the app supports it"* against `CLAUDE.md:414` (*"a light identity with no dark
PAGE palette"*). A capable session would build that while believing it was best
practice. **A miss is visible as absence; a wrong default arrives looking like
competence**, and nothing catches it.

⚠️ **Consequence: "the control produces it free" is NOT sufficient grounds to cut
a rule.** If the control produces a near-miss or an opposite, the rule is doing
suppression work and stays.

⚠️ **MY ABLATION FAILED — repair before reusing.** Removing `CLAUDE.md` does not
remove the doctrine: the S4 control ran 23 commands and **rebuilt Rules 1–10 from
~400 citations across `docs/`**, so its comparison is void. S1/S2/S6 controls
were fast and did not dig — treat as sound but unproven. Ablate by using a
scenario the corpus does not document, or strip citations too.
⚠️ **Delete the S208 control branch and do not reuse it** — the vault names it;
it is listed there rather than here because **its own name encodes a probe's
topic**, which `probe_instrument_leak` caught in the first draft of this very
paragraph. Name the next one neutrally.
⚠️ It also found a real corpus defect: **rule numbering disagrees across
citations** (Supabase safety cited as both Rule 9 and Rule 10).

**Everything else about this lane — criteria, all results, the compiled strategy —
is in `CPLBrain/04-projects/cpl-initiative/doctrine-probes/`.** Read it there.
Do not summarize it back into this file: `CLAUDE.md` tells every session the
newest handoff is authoritative, so a handoff describing the experiment hands it
to its own subjects.

## ⭐ Six changes for SAM to rule on (do not implement unasked)

| | | evidence |
|---|---|---|
| **A** | Build a **dependency map** — dataset → consuming tabs | ⭐ BOTH arms independently named it THE miss |
| **B** | **Widen Rule 10 beyond `kb_curation`** — it is table-scoped, so a tab writing to activities/`map_users` is generalizing, not following | verified in the file |
| **C** | A **rollback path for DATA writes** — `git revert` covers code only | verified |
| **D** | Route a new write surface through **Governance + privacy ADRs** | control only |
| **E** | Decide whether **`js-tests` should gate** — non-required while the required check is a secret scanner; with merge-on-`unstable` a cross-tab regression can reach Pages | control |
| **F** | Fix **rule-number drift** across citations | ablation finding |

## Your queue

1. **Run S3 and S5** — criteria already committed in the vault. **S3.1 is the cell
   to watch**: the `cpl_memory` read step has no guard, so a *treatment* MISS
   there is a genuine hole. Encouraging: S2's treatment led with it unprompted.
2. **Repair the ablation**, then re-test against whatever Sam rules on A–F.
3. ⚠️ **P5 stays BLOCKED** — its premise is false at the commit, so a passing run
   fabricates `cpl_memory` rows about work nobody did, and memory promotes to
   `verified` on second-session corroboration.

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
