---
title: A load id should be the content, so an unchanged load writes nothing
created: 2026-10-02
updated: 2026-10-02
tags: [methodology, supabase, loaders, reliability]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[methodology-a-gateway-error-is-not-an-answer]]"
artifacts:
  - chatbox/sync_program_courses.py
  - tests/program_courses_build_test.py
---

# A load id should be the content, so an unchanged load writes nothing

> **One-sentence summary** — Stamp a bulk load with a hash of its rows, check whether that exact load is
> already live before writing, and only then upsert and prune; a timestamp id rewrites the whole table on
> every run and makes the table slowest at the moment you need to verify it.

## Context

`coci_program_courses` (313,710 rows) loads by upsert under a load id, then deletes earlier loads only after
an exact count proves this load complete, so a reader never sees half a program's course list. The first
version stamped each run with its build time. Every merge that touched the builder's paths re-ran the sync,
so every merge rewrote all 313,710 rows, though the source had not changed since July.

## What happened

Right after each full write the verifying count ran 8 s or more for two minutes, past the 8 s statement
timeout PostgREST runs under, read 3.5 s a minute later, and 93 ms once autovacuum had finished
(runs 37047373446 and 37049825510, 2026-10-02). Retrying with longer waits only treated the symptom.

## The claim

1. **The load id is the content:** the source date plus a SHA-256 of the sorted rows. A rebuild of the same
   payload yields the same id.
2. **Check before writing:** if the table holds exactly this load and no other, write nothing. A failed check
   answers "not live", which costs one full load and never skips one.
3. **Then upsert, count, prune,** with patient retries on the count, since a new load still leaves the table
   slow until autovacuum settles it.

## Why it generalizes

Any loader triggered by code changes, not data changes, re-runs far more often than its source moves. Make
an unchanged payload a no-op, and the expensive path runs only when the data does.
