---
title: A guard test must not be able to fire the action it guards
created: 2026-08-19
updated: 2026-08-19
tags: [methodology, testing, safety, destructive-operations, mutation-testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
  - "[[docs/map_custom_report_load]]"
artifacts:
  - tests/map_custom_report_sync_test.py
  - kb/_sync_map_custom_reports.py
---

# A guard test must not be able to fire the action it guards

> **One-sentence summary** — the natural way to test "this refuses to delete the
> wrong table" is to ask it to delete the wrong table, and that test is correct
> only for as long as the guard works.

## Context

`_sync_map_custom_reports.py` has one destructive call: `truncate(table, key)`,
which empties a staging table. Its guard is an assertion that the name starts
with `stg_`, because the live neighbours are `map_student_credit` (537,908 rows,
student grain) and `map_college_cr_unit`.

## The claim

**A test that proves a guard by attempting the guarded action inherits the
guard's own correctness as a precondition. When the guard is what broke, the
test performs the damage instead of reporting it.**

The first cut looked reasonable:

```python
try:
    sync.truncate("map_student_credit", "key")
    failures.append("truncate() accepted a LIVE table name")
except AssertionError:
    pass
```

With the guard present, this passes and touches nothing. With the guard
**removed** — the exact regression it exists to catch — control falls through to
a real HTTP `DELETE` against the live table. The test is not a detector at that
point; it is the incident.

**The fix is to sever the effect, not the call.** Stub the layer that performs
the action, then assert two things:

1. the guarded call raised, **and**
2. the stub recorded **no** attempt.

```python
_calls = []
sync._request = lambda *a, **k: (_calls.append(a) or (200, b"[]"))
...
check(not _calls, "truncate() issued a request before refusing — the guard "
                  "must come first, or the test itself becomes the destructive act")
```

Assertion 2 is the one that matters, and it is the one the obvious version
cannot make. "It raised" is compatible with "it raised *after* deleting."

**Generalization:** for any irreversible operation — delete, drop, publish,
send, pay — the test must be unable to perform it *even when every guard in the
code is broken*. Isolation lives in the test, not in the code under test.

## How we got here

Found by mutation-testing the suite rather than by reading it. Five mutations
were run against the loader; four failed the test cleanly, and the fifth — the
removed truncate guard — failed with `URLError: Tunnel connection failed: 403`.

That 403 is the sandbox's egress block. **The test only appeared safe because
this machine has no network.** The workflow runs the same suite on a GitHub
runner, which does. A green local run and a destructive remote one differed by
an environment property nobody had thought about.

Two lessons rather than one:

- The obvious version of a guard test is often unsafe in exactly the case it
  exists for.
- **A sandbox restriction can mask a defect and read as a passing test.** An
  error whose text names the *environment* (`403 Forbidden`, `Connection
  refused`, `Name or service not known`) in a test that should never have
  reached the network at all is a finding, not noise.

## See also

- [`methodology-commit-the-test-harness`](methodology-commit-the-test-harness.md)
- [`methodology-a-negative-result-needs-a-positive-control`](methodology-a-negative-result-needs-a-positive-control.md)
