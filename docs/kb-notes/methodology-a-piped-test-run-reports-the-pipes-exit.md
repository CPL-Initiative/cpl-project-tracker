---
title: A piped test run reports the pipe's exit, not the suite's
created: 2026-08-30
tags: [methodology, testing, false-green, shell, ci]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-a-harness-must-verify-its-own-fixture]]"
artifacts:
  - tests/run.js
  - tests/cpl_funding_nc_lane.test.js
---

# A piped test run reports the pipe's exit, not the suite's

## The one-sentence rule

`npm test 2>&1 | tail -30` exits with **tail's** status — always 0 — so a
"passing" piped run proves nothing about the suite; check the suite's own exit
(`set -o pipefail`, `$?` on the unpiped command, or read the summary line the
runner prints) before calling anything green.

## The worked failure (2026-08-30)

The Combined award column changed a table invariant: NC rows now carry exactly
one fewer cell than their credit row, because the new cell spans the pair. An
older suite, `cpl_funding_nc_lane`, still asserted equal counts — a real,
deterministic failure on the new code.

The local full-suite run before pushing was launched as
`npm test 2>&1 | tail -30` in the background, and its recorded exit status was
**0**. That zero belonged to `tail`. The suite had failed exactly where CI then
failed it, and the push burned a CI cycle that a direct exit code would have
prevented. The failure was diagnosed from the CI log, reproduced locally in one
command — unpiped — and fixed by pinning the *new* invariant.

Same shape, same afternoon, nearly repeated: a verification loop written as
`node tests/x.test.js | tail -1` reports tail again. The habit that survives:
pipe for *display*, never for *verdict*.

## Why this class recurs

A pipeline's exit status is its **last** command's — POSIX behavior, not a bug —
and the places it bites are precisely the places output is long enough to want
trimming: full suites, background runs, CI-log slimming. Those are also the
places a false green costs most, because "the whole suite passed" is the claim
being made. This repo's other false-green lessons (a harness scoring a drifted
fixture; a check count that fell without failing) share the root: **the signal
consulted was not the signal produced by the thing being judged.**

## The habits

- **Verdicts come from unpiped exits.** `set -o pipefail` at the top of any
  shell block whose exit will be trusted, or run the command bare and trim
  afterward.
- **Prefer the runner's own summary line** (`All N test file(s) passed.` /
  `N of M FAILED`) over the shell's status when both are available — it also
  survives log truncation.
- **A background task's "exit 0" inherits every masking sin of the command
  line it wrapped.** Re-read the command before trusting the notification.
