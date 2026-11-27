---
title: Stackable programs are found by course containment, not by CIP
created: 2026-11-27
updated: 2026-11-27
tags: [methodology, cpl-pathways, programs, stackable-credentials, cip]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cpl_pathways_lessons]]"
  - "[[program-requirements-harvest]]"
  - "[[methodology-top-is-a-last-in-line-signal]]"
artifacts:
  - kb/_build_program_ladders.py
  - kb/status/program_ladders/index.json
---

# Stackable programs are found by course containment, not by CIP

> **A certificate stacks into a degree when the degree's requirements hold its courses; compare the harvested course
> lists, and use a program code only to bridge levels where no shared course list exists.**

## Context

Sam asked for a compact row at the top of a CPL Pathways record showing what a program stacks into (2026-11-27,
`r-stackable-programs-top-row-sam-2026-11-27`). The harvested program records (ROEP) list every program's required
and elective courses at each college, which makes the question answerable from the courses themselves.

## The claim

- **Containment first.** A certificate *contains* into a same-college degree when every one of its courses appears in
  the degree's requirements, and *mostly* when 80% or more do. These are measured facts about the two records.
- **CIP misses stacks across fields.** Colleges file related programs under different program codes: Cerritos files its
  ironworker certificates under Welding (CIP 48.0508) and the Field Ironworkers A.S. under Manufacturing (15.0613). A
  CIP match would never pair them; containment does.
- **The program code bridges levels.** An associate degree and a bachelor's rarely share a harvested course list, so
  *same_field* links them by program CIP4. A program's CIP is reliable for the program (Sam, 2026-09-25); TOP is never
  used ([`methodology-top-is-a-last-in-line-signal`](methodology-top-is-a-last-in-line-signal.md)).
- **A curated link carries what no record shows**, such as Cerritos 42158 to its B.S. Field Ironworker Supervisor,
  whose curriculum is not yet published.

## How we got here

`kb/_build_program_ladders.py` (#3911, S744) measured the harvest: of 7,696 certificates, 3,680 sit wholly inside a
degree (4,427 pairs) and 4,664 at 80% or more; 27 of 35 active bachelor's link to a harvested associate; 8,295 programs
carry at least one link.

## When this applies (and when it doesn't)

It needs both records harvested with their course lists; a program with a named gap in its record can miss a stack it
has. Containment says the courses fit, not that the college advertises the stack or counts the certificate toward the
degree. Across colleges it does not apply: course codes are local, so a cross-college stack needs the common course
layer (M-IDs) instead.

## See also

- [`cpl_pathways_lessons`](../cpl_pathways_lessons.md), *S744*
- PR #3911

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
