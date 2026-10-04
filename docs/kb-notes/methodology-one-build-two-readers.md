---
title: When a page and an assistant show the same facts, build them once
created: 2026-10-04
updated: 2026-10-04
tags: [methodology, sierra, cpl-pathways, program-requirements, consistency]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/reference/lanes/program-requirements-harvest]]"
artifacts:
  - kb/_build_roep_display.py
  - tests/roep_display_test.py
  - cpl_pathways_roep_data.js
  - chatbox/supabase/functions/cpl-chat/index.ts
---

# When a page and an assistant show the same facts, build them once

> **One builder writes the facts, both readers quote them, and a guard holds the
> two outputs equal; an assistant that computes its own figure is a second answer.**

## Context

CPL Pathways shows each program's CPL "up to" figure and the CPL on each course;
Sierra answers the same questions in conversation. Sam asked for both
(2026-10-04): the page for colleges and the public, Sierra "wired to understand
all the included data and considerations". Lessons:
[`docs/program_requirements_harvest_lessons.md`](../program_requirements_harvest_lessons.md), S327.

## The claim

**Facts that two surfaces show come from one build.** `kb/_build_roep_display.py`
writes each program's facts once and emits them twice: a static data file for
the page and a database column for the assistant. Both carry the same build
stamp.

**The assistant quotes; it never derives.** Sierra's prompt carries each
program's figure as a sentence with its definition, and her rules say to give
the figure as the line states it and never compute another. A model asked to
add up units will add them up, and its sum will differ from the page's
whenever a choice block or an option group is involved.

**A guard holds the two outputs to each other, not to the inputs.** The inputs
(the CER, MAP's articulation feed) are rebuilt every morning, so rebuilding
from them in CI would fail daily. `tests/roep_display_test.py` instead checks
that the page's file and the database receipt hold identical facts, that the
figure recomputes from the page's own data, and that no student field appears.

**The database proves it holds the build.** The builder prints a read-only
query that compares `md5(display::text)` per row against fingerprints computed
the way Postgres prints `jsonb` (keys shortest first, then bytewise; `, ` and
`: ` separators). Every row says match, differs or missing.

## How we got here

The mock-up computed "up to" in the browser. S326 measured that a public table
Sierra could read marked 14 of the Ironworker's 24 courses with CPL where the
mock-up marked 15, and none of Riverside's: two sources, two answers. S327 moved
the computation into the builder, ported the mock-up's `plan()` line for line,
and wired Sierra to the column. Mutating one figure in the page's file failed
three checks.

## When to apply

Any figure or classification that appears on a COBI tab or public page and in
Sierra's answers: CPL figures, readiness tiers, funding shares, course lists.

## When NOT to apply

Facts only one surface shows, or a live count whose source is already a single
table both read directly.

## Related

- [`methodology-a-stored-value-does-not-follow-its-function`](methodology-a-stored-value-does-not-follow-its-function.md)
- [`playbook-ship-a-table-before-its-privilege-close`](playbook-ship-a-table-before-its-privilege-close.md)
