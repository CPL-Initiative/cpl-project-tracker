---
title: A memory-bound suite scales across machines, and the check keeps its name
created: 2026-09-24
updated: 2026-09-24
tags: [methodology, testing, ci, jsdom, memory, test-infra, github-actions]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-test-file-is-a-memory-budget]]"
  - "[[docs/reference/branch_policy]]"
artifacts:
  - tests/lib/shard.js
  - tests/run.js
  - .github/workflows/js-tests.yml
  - tests/js_suite_gate_test.py
---

# A memory-bound suite scales across machines, and the check keeps its name

> **One-sentence summary** — when a test runner is already as wide as one
> machine's memory allows, wall time is the suite's serial time over that
> width and nothing inside the runner can lower it; the lever is more
> machines, and the way to add them without touching the merge doctrine is a
> matrix of shard jobs fanned into one job that keeps the name the doctrine
> polls for.

## Context

Sam, 2026-09-24: *"would it make sense to chunk our npm tests for git--they're
taking 20 mins + each now."* The `npm test` step read 18 minutes on the CI
runner that day against 9–10 a month earlier. The doctrine line that budgets
the merge wait still said *"a code diff ~9."*

The runner had already taken the in-machine step on 2026-08-28: files run four
at a time, each in its own process, the width derived from measured peak RSS
against a 16 GB runner (`tests/run.js`). It could not go wider. The
`cpl_funding_*` family peaks at 2–4 GB a file, so four is what fits.

## The claim

**1. Measure before sharding, because a wall-time jump has two possible causes
and only one of them sharding fixes well.** Run-to-run variance on hosted
runners is real: one run on 2026-09-23 finished the same step in 9 minutes on
a near-identical tree, between two 18-minute runs. Sharding helps that too,
but the case for it rests on growth, and growth is what the file-level
timing showed.

**2. Time every file, on a box shaped like the runner.** 362 files, 3,592 s
serial, 898 s wall at 4-wide on a 4-cpu / 16 GB box. One family,
`cpl_funding_*`, was 56 files and 3,111 s: **87%** of the suite, up from 28
files and 78% on 2026-08-28. The wall time was serial ÷ 4 to the second, so
the runner was already perfectly packed. There was no scheduling left to win.

**3. When width is capped by memory, wall time scales only with machines.**
Four shards of every fourth file in the sorted list carry 777 / 1,000 /
1,021 / 794 s of serial work each (±14%), about 4.3 minutes apiece at
4-wide. Round-robin over the *alphabetical* list is deliberate: the heavy
family is contiguous, so each shard holds 14 of its 56 files and the
per-file variance averages out. A recorded-durations file would balance a
little better and rot within a week; a hash scatters the family unevenly.

**4. The check the doctrine polls keeps its name, and the conditional stays
off it.** The merge policy waits on a check named `test`. Sharding replaced
one job with four, and the way to change the shape without changing the
policy is a fan-in job *named* `test` that `needs` every shard and every
lint and runs on `!cancelled()`, reading each need's result. The E gate's
`if:` moves onto the shard jobs, which are never the required check. A
skipped required check never reports and blocks a PR forever; that rule was
already pinned by `tests/js_suite_gate_test.py`, which now pins the new
shape from both sides.

**5. A shard must refuse the two green-looking mistakes.** An empty shard
(more shards than files) exits 1 rather than reporting a pass over nothing,
and `--update-floor` on a shard is refused, because the check-floor ledger
is written whole and one shard's counts would erase every other shard's
floors.

## How we got here

| Probe | Result |
|---|---|
| `npm test` step, run 36013462480 (main, 2026-09-24) | 18 min 15 s |
| same step, run 35908673473 (main, 2026-09-23 19:20) | 9 min 9 s |
| every file timed locally, 4-wide | 3,592 s serial, 898 s wall |
| `cpl_funding_*` share of serial time | 56 files, 3,111 s, 87% |
| round-robin, 4 shards | 777 / 1,000 / 1,021 / 794 s |
| round-robin, 6 shards | 502–702 s |
| fan-in shell under 8 result combinations | run+success and skip+skipped pass, the rest exit 1 |
| first sharded run, PR #1682 (17:12–17:20 UTC) | gate 24 s · lints 1 min 47 s · shards 3.5–6 min · `test` reported 7 min 16 s after the push |

## When this applies (and when it doesn't)

Applies to any suite whose runner is width-capped by memory rather than by
cores: jsdom and headless-browser suites, anything that boots a rendered
document per case. The in-file remedy (split the file, budget windows) is the
earlier note; this one starts where that one stops, at the machine.

It does not apply to a CPU-bound suite on an under-used machine, where a
wider pool is cheaper than a second runner. And it is not a reason to stop
watching the family's cost: 87% of the suite in one tab's fixtures means the
next 20 files there cost more than the next 200 elsewhere, and a slower boot
in `tests/lib/cpl_funding_harness.js` moves every shard at once.

## See also

- `tests/lib/shard.js` — the partition and the measured table
- `.github/workflows/js-tests.yml` — the four jobs and the forever-block warning
- `[[docs/kb-notes/methodology-a-test-file-is-a-memory-budget]]` — the in-file half
- `[[docs/reference/branch_policy]]` — why `test` is doctrine rather than branch protection

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
