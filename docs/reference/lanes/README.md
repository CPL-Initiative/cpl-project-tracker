---
title: "Roadmap lanes — how the pointer index and the lane files divide"
created: 2026-09-09
updated: 2026-09-09
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
---

# Roadmap lanes

`CLAUDE.md` §11 is a POINTER INDEX; each lane's current truth lives in a file
here. At checkpoint you update the LANE FILE, and touch the §11 row only when
the lane's STATE changes.

## Why hand-grepping the roadmap for retirable lanes is banned

⚠️ **It has been wrong every single time it was tried.** Session 206 called five
rows retirable-with-no-judgment-calls; four carried an explicit open-work list in
their own text. Session 208 then mis-grepped it three more times in ONE run —
anchoring to line-start (0 hits), searching `NEXT` and missing `Next:`, and
requiring a trailing colon and missing bare `BLOCKED` — each producing a
confident, plausible, wrong list.

`lane_retirement_signal` in `kb/_docs_audit.py` runs the test over every lane
file with a vocabulary measured from the live corpus, and is fail-safe: it names
lanes whose own text claims no open work and deliberately never says "retire
this". Read the ones it names.

## Retiring a lane

Completed rows through S32 are in [`docs/roadmap_archive.md`](../../roadmap_archive.md).
A lane that has shipped and is stable — **no NEXT, no NEEDS SAM, no BLOCKED in
its own text** — moves verbatim to
[`docs/reference/finished_workstreams.md`](../finished_workstreams.md) and its
row leaves §11's table.
