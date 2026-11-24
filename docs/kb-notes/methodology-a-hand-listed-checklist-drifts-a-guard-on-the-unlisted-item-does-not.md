---
title: A hand-listed checklist drifts; a guard that fails on the unlisted item does not
created: 2026-11-24
updated: 2026-11-24
tags: [methodology, ci, generators, guards, maintenance, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-derive-a-listing-from-the-things-it-lists]]"
  - "[[methodology-a-guard-must-fail-closed-when-it-cannot-decide]]"
  - "[[engineering_practices_lessons]]"
artifacts:
  - scripts/check_generated.sh
  - tests/check_generated_covers_status_test.py
---

# A hand-listed checklist drifts; a guard that fails on the unlisted item does not

> **One-sentence summary** — a check that names its items by hand covers what existed when it was written; when the
> items cannot all be checked, enumerate the whole set and fail on any item that is neither checked nor excused with a
> reason, so coverage grows with each new item instead of decaying.

## Context

`scripts/check_generated.sh` is the step CLAUDE.md names as the last thing before a push: it reruns each generator in
`--check` mode and reads *All generated files are current*. On 2026-11-24 it named 4 of the 31 files under
`kb/status/`. Session 718 lost CI rounds to files it did not name: `statewide_subject_codes.json` and
`subject_sources.json` went stale when a PR rebuilt `local_subject_titles.json`, which both read, while the script said
everything was current. The lints job failed each one in turn, a round each. Sam, the same day: *"I think we have come
to this conclusion several times in the past, but still it recurs. If there is something solid we can embed in our
handoff and rules or .md. advise"*.

## The claim

A checklist written by hand records the items its author knew of. Each new item arrives unlisted, and nothing reports
the omission: the check passes, because it passes on everything it checks. Reminders do not fix this; earlier sessions
had reached the same conclusion and the gap recurred.

When every item can be checked, derive the list from the items
([`methodology-derive-a-listing-from-the-things-it-lists`](methodology-derive-a-listing-from-the-things-it-lists.md)).
When some cannot (a file a daily job stamps with the clock, a file copied from a live table), keep the list by hand
and add a guard that reads the whole set: each item must be on the checklist or on an exclusion list with a non-empty
reason, never both, and an exclusion for an item that no longer exists fails too. A new item then fails the guard on
the day it is added, and its author chooses a check line or writes down why none can hold it.

## How we got here

#3737 added `tests/check_generated_covers_status_test.py`: 20 status files now have check lines, 11 sit in
`NOT_CHECKED` with reasons (the Commons status file stamps `written_at` each run; the harvest census files come from a
live read only the runner holds). The guard proves it can fail on each run: it is handed a made-up file in neither
place, a gone entry, an empty reason and a file in both, and must name each. The same session's other lost rounds have
the same shape: a test file not registered with the runner (`every_test_runs` caught it), and a filer that re-sorted
rows a check compared in order.

## When this applies (and when it doesn't)

It applies wherever a list is meant to cover a set that grows: generated files, tests a runner must load, workflows a
gate must read. It does not apply where the set is closed and small enough to read whole at a glance; there the guard
costs more than the omission. An exclusion's reason is the point of the exclusion list: an entry without one becomes
a hand list of its own.

## See also

- `docs/engineering_practices_lessons.md`, the S718 section.
- [`methodology-a-guard-must-fail-closed-when-it-cannot-decide`](methodology-a-guard-must-fail-closed-when-it-cannot-decide.md)
