---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-10-03
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/sierra-retrieval-corpus]]"
---

# Program requirements harvest

**What this lane is:** for every active program at the 115 credit colleges, a
record of how its courses count toward the award (required, choose N courses or
units from a list, open elective), the program total, the catalog year and the
source, plus the recommended term sequence where a college publishes one. From
it: which courses a learner qualifies for through CPL, and the units saved.

## Status

🔨 **Planning (S319, 2026-10-03).** Sam's three statements that opened it are
verbatim in the vault: `CPLBrain/03-professional/braindumps/braindump-2026-10-03-1433-program-requirements-from-local-catalogs.md`
(the gap; the COCI ROE fields and the summer amnesty; our own best version, a
source registry, an agent per college). The plan is a Claude Doc Sam edits and
comments on: [Program Requirements Harvest Plan](https://claude.ai/code/artifact/77ae8cb2-443b-45e3-b287-594c9c9b8744).

**Sam's rulings so far (2026-10-03):** build our own best version now; the
Butte College Tech Center's COCI ROE fields are a parallel track, never a gate
(*"working on that end is often a slog or dead end"*); start from use cases and
test against real catalog pages; a per-college source registry kept current by
agents; a per-college tab; an agent per college that the college and the MAP
team own and train.

**Measured (2026-10-03):**
- The Data Mart Program Course File (2026-07-16) has 11 columns. None marks a
  course required, places it in a block, orders it by term, or gives a unit
  total. It names every course a program lists (313,710 rows, 20,451 of 22,335
  programs), which gives every harvest a closed list to check against.
- 115 colleges award active credit programs (118 with noncredit-only).
- Active programs: 8,343 Certificates of Achievement, 3,730 A.S., 2,448 A.A.,
  2,573 noncredit, 2,959 ADTs, 35 baccalaureates. ADT structure comes from the
  TMC templates (`tmc_templates.js`).
- No catalog URL is stored anywhere in our data; the registry starts empty.
- From this container, CourseLeaf (Cerritos, Foothill) and curriQunet (San
  Diego) catalogs blocked plain reads in July (`docs/cpl_pathways_lessons.md`).
  GitHub runners with a real browser are the untested next channel.
- `cpl-news.yml` is the worked pattern for an agentic harvest: a scheduled
  workflow calls an Edge Function that holds the Anthropic key.

**NEEDS SAM:** the eight calls in the plan's "Your calls" section, carried as one
card on the open-asks sheet: which source wins on disagreement, the pilot
colleges, who checks the 20-program sample, sequencing in the pilot, reading
college websites from runners, the model key path, publication, and the Tech
Center contact.

**NEXT (on Sam's answers):** Phase 0, the census: a `program_source_registry`
table and an agent that fills one row per credit college (catalog home and year,
platform, format, CMS public view, sequence source, access notes). Then Phase 1,
the pilot: five colleges, four program shapes each, scored on course coverage,
no invented courses, unit arithmetic, and agreement with a person.
