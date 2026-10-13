---
title: "Session 382 handoff — Coastline's near misses, Cabrillo's capture and extraction go, then the next college"
date: 2026-10-13
session: 381 (SkyRowan)
tags: [handoff, program-requirements, elumen, courseleaf, coastline, cabrillo, bakersfield, progress-view]
status: current
---

# You are Session 382

Your moniker is **SkyLarch**, on the **program requirements** queue. Session 381 (**SkyRowan**,
`session_01WJngDnfHjhN46medu9sH2K`) ran it with Sam present, on his phone. The Annual Goals queue's handoff is still
`docs/session_379_handoff.md`; its item 0b is closed (below). `list_sessions` first and agree one writer.

## What shipped (S381)

- **Bakersfield, end to end (#2072, merged):** load 38428412859 inserted 229 unchecked; display 38430743762 applied
  build `2121fcc84f86` to all 2,432 rows (31 checked unchanged); procedure record v3 (md5 `c5655144...`). The
  builder's dated reads carry Bakersfield and Coastline.
- **Progress view (#2077, merged):** every parts card, milestone chip and the headline count opens the list it totals;
  The four checks links "Read the N waiting on you"; a call may name its card (`part`). `scripts/queue_status.py`
  refuses a call with no `link`, `view` or `records` (S380's three had none).
- **Open Asks Sheet 74** ([link](https://claude.ai/artifact/3Rmt4evVLC4xo8ChjQZCon), current, fresh store, source in
  `CPLBrain/decision-sheets/open-asks/2026-10-13-open-asks-74.html`): card 1 the Chaffey course outline note paste
  (`apply_migration` timed out a tenth time at 16:33Z), card 2 the migrate runner (#2076, held at its governance step).
- **Sheet 73 card 1 was answered** ("keep", 11:45Z): Move stays reviewer-only; Annual Goals 0b closed in its lane.

## In flight when S381 stopped

- **Coastline (#2074, draft):** S381 added `child_pages()`, `drop_banner_h1()`, spelled-out slug awards, merged main,
  and added `near_miss()`. Re-read 38429656959: 32 of 159, $1.86, **not loaded**. A capture-only run was dispatched
  ~17:25Z on 0ec520b to file each not-found program's near miss (the page that names it best and the refusing gate).
- **Cabrillo (#2078, draft):** its eLumen menu lists departments; `el_department_slugs()` reads each department's
  program links. A capture-only run was dispatched ~17:27Z on 1b341ce.

## Docs to read, in order

1. `docs/reference/lanes/program-requirements-harvest.md`: Phase 2 (eLumen, Cabrillo, Coastline).
2. `docs/program_requirements_harvest_lessons.md`: the S381 section.
3. `cpl_memory` tags `program-requirements-harvest`, `coastline`, `elumen` (rows by `SkyRowanS381`).

## Priority, in order

1. **Coastline's near misses:** read `capture_preview.json`'s `not_found[].near_miss` on `claude/s380-coastline-read`.
   Count the gates; fix the one that refuses the program pages (Information Technology A.S. is the test: the link
   search takes its own page at coverage 1.0). Guard it, re-read with extraction (Sam's go stands for Coastline),
   load, add nothing to the dated reads (already there), display, procedure record, merge #2074 on `test`.
   #2074's `lints` is red until then: `tests/roep_display_test.py` wants every filed record in the display receipt,
   and Coastline's 32 are filed but not loaded (PR comment, 17:3xZ).
2. **Cabrillo's capture:** found against its 281 with a course list. If sound, **ask Sam for the extraction go**
   (about $16 at $0.058 a program) as a card on a fresh sheet, then read, load, dated reads, display, procedure record.
   Merge #2078 on `test` once its capture files.
3. **Next colleges:** the other Leading eLumen colleges (Modesto, Palo Verde, Santiago Canyon: check each menu with
   one page read first); then Advancing CourseLeaf/curriQunet by students (Southwestern, Fresno City, Cypress).
4. **Sheet 74's replies:** read its store before acting. Card 1 "pasted" → read the Chaffey row back; card 2
   "allow" → finish #2076 (governance entry, `js-tests.yml` wiring, Rule 10's pointer), merge, apply card 1 through it.

## Patterns that worked

- **One two-load page read before a capture:** Cabrillo's menu and Coastline's sitemap each answered in two minutes
  what a 27-minute capture could not.
- **A dated read is filed ahead of a college's load** when two branches would otherwise both edit it.

## Safety patterns to honor

- `git stash pop --index`, and `git show --stat HEAD` before dispatching a run on a commit (S381's first Coastline
  dispatch ran on a commit that carried only the dependency map).
- The full `npm test` exceeds a background command's limit here; run the changed files' tests and let CI's `test` run
  the rest. Never switch branches while a local test run reads the tree.
- `scripts/check_generated.sh` after `git add`; merging main into a branch brings `tests/course_outline_index_test.py`.

## Skipped this checkpoint (and why)

- **UI pass (9):** this run's view work was Sam's own ask on the Progress view (#2077, a11y passed light and dark);
  the ledger's next view stays due. **Pipeline view (7):** the M-ID pipeline did not move.

## Subscriptions and check-ins

At sign-off S381 dropped its subscriptions on #2074, #2078 and the checkpoint PR, and holds no check-in (its
`trig_01ShZrDm4svVC2mT7eT5cgSK` fired at 16:59Z). Sheet 74's artifact watch was never confirmed registered. Subscribe
to #2074 and #2078 when you take them up.
