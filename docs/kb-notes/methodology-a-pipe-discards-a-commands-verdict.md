---
title: A pipe discards a command's verdict
created: 2026-09-15
updated: 2026-09-15
tags: [methodology, verification, testing, ci]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - tests/run.js
  - kb/_build_dependency_map.py
---

# A pipe discards a command's verdict

> **One-sentence summary** — filtering a command's output through `grep`, `tail` or `head` replaces its exit code with the filter's, so a gate behind a pipe reports success no matter what the gate decided.

## Context

Twice in one session (2026-09-15) a check that had FAILED was read as having passed, because its
output went through a pipe before anyone looked at it. Both were caught, but the first cost a wasted
CI cycle and a false report to Sam that the test suite was green.

## The two occurrences

**A red test run reported as green.**

```
node tests/run.js 2>&1 | grep -E "^FAIL|FAILED|assertions passed"
```

`tests/run.js` exited 1 with `1 of 333 test file(s) FAILED:` followed by the failing file's name on
the NEXT line — which the pattern did not match, so the name never printed. And the pipeline's exit
code is `grep`'s, not the runner's, so the harness reported **"exited with code 0"** on a red run.
The session pushed on that reading. An unfiltered rerun named the file
(`cpl_funding_metric_wiring.test.js`) immediately.

**A stale artifact pushed past its own gate.**

```
python3 kb/_build_dependency_map.py --check 2>&1 | tail -1 && git push ...
```

Same mechanism. `dependency map is STALE` printed on screen while `&&` read `tail`'s success and the
push went ahead. CI would have caught it — a stale dependency map is exactly what had turned a PR
red earlier the same day — so the pipe had converted a local, free failure into a remote, slow one.

## The rule

**Never put a gate behind a pipe.** Run it bare, read the exit code, then act.

- Want the output shortened? Run the command, capture to a file, and read the file — the exit code
  stays the command's: `cmd > out.txt 2>&1; echo "EXIT=$?"; tail out.txt`.
- Want it in a chain? Put the bare command in the chain and filter afterwards, never before `&&`.
- `set -o pipefail` fixes the exit code but NOT the swallowed filename, which is half the loss.

## Why it is easy to miss

A filtered run still prints lots of green. The failure is invisible in exactly the way that looks
like success: rows of `PASS`, a plausible summary line, and an exit code that says fine. Nothing in
the output announces that the verdict was discarded — the reader has to know the pipe did it.

## Related

- The same session's separate finding that **`npm test` passing is not CI passing**: CI runs
  `kb/_build_dependency_map.py --check`, which a local `node tests/run.js` does not. "Local suite
  green" and "CI green" are different claims.
