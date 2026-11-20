---
title: A confirming read pages by key, never by offset
created: 2026-11-19
updated: 2026-11-19
tags: [methodology, supabase, postgrest, display, program-requirements]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/program-requirements-harvest]]"
  - "[[docs/program_requirements_harvest_lessons]]"
artifacts:
  - kb/_program_requirements_display_apply.py
  - tests/program_requirements_display_apply_test.py
  - tests/display_receipt_store_test.py
---

# A confirming read pages by key, never by offset

> **A read that checks a large write must start each page after the last key it read, and stop when a page brings no
> new key; a limit-and-offset read gets slower with every page and fails on the last ones.**

## Context

A bulk write is confirmed by reading the rows back and comparing them with what was sent. The display apply of the
program requirements harvest writes about 18,000 rows to `program_requirement_records` and then reads them all through
PostgREST to set its record to `confirmed`. Lessons: [`program_requirements_harvest_lessons`](../program_requirements_harvest_lessons.md), *S685* and *S687*.

## The claim

**Page by key.** Each page asks for the rows after the last key read, ordered by that key:
`or=(college.gt.C,and(college.eq.C,control_number.gt.N))` across colleges, or `control_number=gt.N` inside one college,
with the values PostgREST-quoted. An offset page makes Postgres read and discard every row before it, wide `jsonb`
columns included, so the last page of a large table costs the most, and that is the page that times out.

**Stop on a page with no new key.** The read stops only when every key on a page was already read. It never compares
key order itself: the server's collation orders and filters the pages, and a client-side comparison of keys can read a
good page as one that went backwards. A server that ignored the filter would repeat a page, and this stop ends the
read on it instead of looping.

**A test's fake table follows the same paging.** A fake that answers only `offset=` returns the same rows forever to a
keyed reader. The fake must apply the key filter, and the reader's own stop is the second guard.

## How we got here

- S685, build `3e8088e082eb` (run 44535255196): every write went out, and the confirming read, paged by limit and
  offset over 19 pages, answered HTTP 500. One college's 85 rows had confirmed fine. The record stayed `unconfirmed`;
  a closing live count confirmed the build instead.
- COBIx suspected the confirming read's paging on #3556. #3564 (`bc0bf6ee`) paged it by key; COBIx's second review on #3564 asked
  for the stop to be collation-independent.
- On the way, `tests/display_receipt_store_test.py`'s fake table looped on the keyed read and hung the `lints` job for
  55 minutes (run 44585137180, canceled).
- S687, build `3361e3aa5b7d` (#3567, run 44601141904): 18,255 written, 125 already current, 0 errors, and the state
  `confirmed` from its own read in under 4 minutes. The first full build to confirm on its own read.

## When this applies (and when it doesn't)

Any read-back of a table too large for one response: a confirm, a live count by page, a sync. A small read that fits
one page needs neither. Keyset paging needs a unique, ordered key (here college and control number); a table without
one needs a key added before it can be read this way.

## See also

- CLAUDE.md Rule 10 (b): `kb_curation` reads through PostgREST are Range-paginated.
