---
title: A guard must fail closed when it cannot decide
created: 2026-11-18
updated: 2026-11-18
tags: [methodology, guards, testing, exhibits, review]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - docs/engineering_practices_lessons.md
  - docs/reference/lanes/cer-procedures.md
  - docs/kb-notes/methodology-a-failed-read-is-not-an-empty-result.md
  - docs/kb-notes/methodology-a-single-decider-guard-is-only-as-wide-as-the-files-it-reads.md
artifacts:
  - exhibits.js
  - tests/exhibits_list_left.test.js
---

# A guard must fail closed when it cannot decide

> **One-sentence summary** — a guard patched one bypass at a time keeps leaking; once one finding class reaches a third
> round, rebuild the guard as one choke point every writer passes through, and make every state where it lacks the
> answer (an input not loaded, a record with no value) hold the write.

## Context

The Exhibits List's combine guard stops a fold that joins Sam's graded and cert-based CPL type groups unless a person
presses a second time and the override is logged. In S679 (2026-11-18) a second reader found a surface that folded
without the check, three rounds running. Each fix closed the surface named and left the next one open.

## The claim

**Patching the surface a reader names does not converge.** Each writer that folds a title is one more place the check
has to be remembered. After the third round of one finding class, the fix is a redesign: every fold goes through one
function (`foldWrite` for a single fold, `foldGate` for a save that folds many), and no writer reaches the store any
other way.

**One choke point is still not enough if it fails open.** The fourth read of the redesigned guard found two paths that
let a fold through, and both were states where the guard lacked its input: the CPL types file had not loaded, and
1,025 of 2,849 titles carry no type. A guard that reads "no answer" as "no conflict" passes exactly the cases it cannot
see. The rule is to hold: while the types are unread the fold is held with a message and the next press reads again,
and an untyped title takes the two-press check with its override logged.

**Design the unknown state first.** List the guard's inputs, and for each one say what happens when it is missing,
empty, late or unparseable. Each of those answers is "hold", unless a person has said otherwise.

## How we got here

#3477 (the leftover-title Rename and Combine) went through three review rounds on guard bypasses; the third moved every
fold behind one choke point. The second reader of #3482 (the shared `combine_guard.js` for the Common Exhibit Reference
tab's five writers) then found the fail-open paths: the types-not-loaded path and the untyped titles. Lessons:
`docs/engineering_practices_lessons.md`, *2026-11-18 — S679*.

## When this applies (and when it doesn't)

It applies to any check that stands between a person's action and a shared write: a combine, a merge, a delete, a
publish. It does not apply to a display hint, where failing open shows a little less and harms nothing. A hold needs a
way out that a person can see (a message and a retry, or the second press), or the guard turns into a dead button.

## See also

- [`methodology-a-failed-read-is-not-an-empty-result`](methodology-a-failed-read-is-not-an-empty-result.md)
- [`methodology-a-single-decider-guard-is-only-as-wide-as-the-files-it-reads`](methodology-a-single-decider-guard-is-only-as-wide-as-the-files-it-reads.md)
- `.claude/skills/conductor-brief/SKILL.md` (replace a design on the third round of one finding class)
