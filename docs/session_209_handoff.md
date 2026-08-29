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

## ⭐ The one thing to carry forward

**The probe protocol was void on its first real run, and the reason generalizes.**

The rubric and all five probe prompts were committed to `cpl-project-tracker` —
**the repository a probe session clones.** The control condition was defined as
"`CLAUDE.md`, which auto-loads anyway, plus the repo", and that repo held a
109-line document naming every criterion the probe was about to be scored on,
plus the scorer's advance predictions.

It needed no adversarial probe to leak. A probe's most natural first action is
to search for the topic it was handed, and for P5 the phrase
`comprehensive-vs-carve-out` matched **exactly one file in the entire
repository — its own probe prompt.** P5 found it, recognized it was inside an
experiment, and void-flagged itself.

Handoff 207 warned about this and looked in the wrong place: *"the likeliest
explanation is **prompt** leakage — re-read the probe prompt for a cue."* The
leak was the **repository**, which the design treated as neutral background
rather than as an input. **Anything the subject can read is an input.**

Instruments now live in
`CPLBrain/04-projects/cpl-initiative/doctrine-probes/`; `probe_instrument_leak`
fails if they reappear. Note:
[`methodology-the-instrument-may-not-live-inside-the-system-under-test`](kb-notes/methodology-the-instrument-may-not-live-inside-the-system-under-test.md).

## Your queue, in priority order

1. **Re-run the probes against the cleaned repo.** ⚠️ **No probe result from
   S208 stands** — P2 and P5 both ran while the answer key was still committed.
   Read the vault README first; it carries the run procedure and two mechanics
   that cost this session real money:
   - **A session spawned with no repo has no `CLAUDE.md`** and is a blank
     session, not a control. `create_session` does **not** inherit the parent's
     repos — pass `source_url` explicitly. One probe burned **$5.04** flailing
     in an empty sandbox before it was stopped.
   - **You cannot read a spawned session's transcript.** P3 scores the *order of
     the first six tool calls*, so it is **unmeasured**, not passed. Either Sam
     opens the transcript, or say unmeasured.
   - **P4 is Sam's to run** (his call, S208): "Build it" on a readiness-tier
     table can reach live Supabase, and it is also the probe the rubric predicts
     weakest.
   - **P6 needs `checkpoint_overdue` to actually fire** — more than 6 commits on
     `main` after the newest handoff. It was **0** when S208 checked. Do not
     stage fake commits; wait for it, and verify with `python3 kb/_docs_audit.py`.
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
