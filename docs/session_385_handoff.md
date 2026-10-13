---
title: "Session 385 handoff — the college filter's first live reads, and Sam's Sheet 77"
date: 2026-10-13
session: 384 (SkyPoplar)
tags: [handoff, program-requirements, records-view, postgrest, annual-goals]
status: current
---

# You are Session 385

Your moniker is **SkyHazel**. Session 384 (**SkyPoplar**, `session_01EyHGwxpaqWSM1iAfVWEcKg`) ran with Sam present.
`list_sessions` first and agree one writer.

## What shipped (S384)

- **Merged:** S383's checkpoint (#2086); the Annual Goals build queue (#2083), with `workplan-rebuild` deployed
  (run 38464141223; ACTIVE, version 1, `verify_jwt` off; 503 until Sam sets the key); the whole-harvest measure
  (#2084); the eLumen hub reader with Modesto's and Palo Verde's capture-only reads (#2085); CPLBrain #334, #335.
- **Sam saw Program Requirements answer 500** (~20:45Z). Cause: the anon read hit its 3 s statement_timeout, and every
  one-shot read stopped at PostgREST's 1,000-row cap (`Content-Range 0-999/*`); 2,840 records are 34 MB. Fixed in steps:
  #2088 pages every read (CPL Pathways' index too), #2089 reads once when signed in and retries a 5xx page, and
  **#2090 (open)** loads a light index for every college and full records only by a college/district pick or by key.
- **The test race behind #2084's red `test`:** the identity lint guard wrote a dated crosswalk the funding producer read
  half-written. #2087 sends the rebuild to a temp dir.
- **Open Asks Sheet 77** published ([link](https://claude.ai/artifact/1X2k19iJWgohcmpqGe1WYj), current; Sheet 76
  marked superseded). Five cards: the build-queue key, Table on the Activities tab, the catalog-and-state-file boxes,
  the 4.7 delete paste, and Modesto's and Palo Verde's extraction go. Its store held no reply at 22:15Z.

## Decisions Sam made this run

1. Load the Records view by a multi-select college/district filter, **provided the links that jump to items needing
   attention still work without it**; then *"Go with your default for the picker"* (open empty, remember the last
   pick). `cpl_memory` `sam-records-load-by-college-filter-2026-10-13`.

## Priority, in order

1. **Merge this checkpoint (#2091) and CPLBrain #336 on green first.** S384 stopped at Rule 9a's warning line (89.8K
   tokens left) and left #2090 unmerged on purpose, so its first live reads get checked the moment it deploys.
   **Then merge #2090 on `test`** (merge main first if it turns dirty; regenerate the dependency map, never pick). Then read
   its first live reads in `edge_logs` (`request.path = '/rest/v1/program_requirement_records'`): every status 200 or
   206, `content_range` paging, no 400 (its JSON-path selects and quoted `in.()` lists were never sent live before
   deploy). A 400 names the select; fix it in a PR the same hour.
2. **Sheet 77's replies** (read the `replies` store first). Card 5 "both": dispatch
   `program-requirements-college.yml` (`step=read`, `extract=1`) for Modesto Junior College and Palo Verde College from
   a branch off main, then load and display under Sam's standing go; read one Palo Verde noncredit page before any
   reader fix. Card 3 "build": the one-line college summary, the per-college list on My College and the MAP-team
   queue, numbered boxes for the reading procedure only. Card 4: read 4.7's links back (one row gone) and note APPLIED
   in `kb/receipts/workplan_2026-10-13_s383_drop_4_7_activity_1_link.sql`. Cards 1 and 2 change the annual-goals lane.
3. **The lighter Records page is #2090.** After it ships, measure a real load (edge `origin_time`, bytes).

## Docs to read

`docs/reference/lanes/program-requirements-harvest.md` · `docs/reference/lanes/workplan-annual-goals.md` ·
`docs/program_requirements_harvest_lessons.md` (S384) ·
`docs/kb-notes/methodology-paginate-postgrest-reads.md` (updated S384).

## Patterns that worked

- **Read the logs before guessing:** `postgres_logs` named the timeout and `edge_logs` showed `content_range`,
  `origin_time` and the role of each request; the 1,000-row cap was invisible any other way.
- **A second failure on a "flake" is a root cause waiting:** the shard log's traceback named the half-written file.
- **A large rework with little context left goes to one agent in its own worktree** with a precise spec; review its
  diff, merge main, and rerun the checks before the PR.
- **Merging main into a rewritten test file:** a hunk can share its closing lines with the other side, and a block the
  other side added can return as a duplicate. Check syntax and the check count after resolving.

## Not refreshed this checkpoint

The UI pass (9) and the pipeline viz (7) were skipped: no context room for a fix PR, and the M-ID pipeline did not
move. `CLAUDE.md` is still 440 bytes over its budget, and INDEX's update history is past eight bullets
(`docs/roadmap_archive.md`, where they go, is itself flagged oversized).

## Subscriptions and check-ins

S384 dropped its subscriptions (#2090, #2091, CPLBrain #336) and its watches on Sheets 76 and 77 at sign-off. It holds no
check-in. Subscribe to #2090 when you take it up.
