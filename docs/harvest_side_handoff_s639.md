---
title: Program requirements harvest — side-session handoff (S639, second session)
date: 2026-11-12
tags: [handoff, program-requirements, harvest, side-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
related:
  - "[[docs/reference/lanes/program-requirements-harvest]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/reference/conductor_mode]]"
---

# Program requirements harvest: side session beside the S639 conductor

Sam opened a second session from iOS at 00:33Z 2026-11-12 with handoff 639's opening line while SkyQuail (S639, the
conductor, session `…wbUp`) was working. The two agreed one writer by message at 00:44Z: the conductor keeps the
moniker, handoff 640, the COBIx threads, Sheet 181, `kb_curation`, every cer, rename and family apply, and the
`cer-procedures`, `commons` and governance lanes. This session takes the `program-requirements-harvest` lane and
writes this file instead of a numbered handoff.

**Scope (declared for the CPL Queue routine):** `docs/reference/lanes/program-requirements-harvest.md`, the harvest
lessons docs, `kb/program_requirements_reconcile.json`, `kb/_program_requirements_*.py`, `kb/college_reads/`,
`kb/program_requirements_college/`, `kb/receipts/program_requirement_records_*`, the ROEP display build and their
tests; table `program_requirement_records` through `program-requirements-college.yml` only.

**Agreed with the conductor:** receipt-only pushes from harvest runs are fine at any time. A merge that changes
generated `kb/` files waits until no `daily-dashboard`, `cer-decision-apply`, `cred-rename-apply` or
`credential-family-apply` run is in flight (read `list_workflow_runs` first).

## The shared cause, measured live (01:20Z 2026-11-12)

Statewide 17,580 rows; 14,963 pass the machine checks. Of the rest, 1,522 read arithmetic `unequal`, 932
`incomplete`, and about 180 fail coverage or name a course the college does not list. The colleges with the most
degrees reading `incomplete` (a general education pattern named with no units, Butte's cause): Orange Coast 50, Rio
Hondo 30, Grossmont 27, West Valley 27, Glendale 26 (parked), East Los Angeles 23, American River 23, Los Angeles
City 22, Berkeley City 21, Solano 21, Cosumnes River 19, Sacramento City 18, Cerro Coso 14. Victor Valley's 60
failures are 43 certificates reading `incomplete`, a different cause.

## Ledger

| College | Branch | Worker | State |
|---|---|---|---|
| Orange Coast (72 failing of 259) | `claude/harvest-orange-coast-s639` | live | diagnosing why 50 degrees still read incomplete under the S396 steps |
| Los Angeles City (67 of 223) | `claude/harvest-los-angeles-city-s639` | live | diagnosing; no reconcile entry yet |
| Victor Valley (60 of 168) | `claude/harvest-victor-valley-s639` | live | diagnosing the 43 certificates; 37006 and 38352 stay as read (Sheet 85) |
| Berkeley City, San Bernardino Valley, Rio Hondo, Grossmont, West Valley, East Los Angeles | none yet | read-only diagnosis | a workflow of six readers; no file changed |
| American River, 23 reworded programs | to open | conductor of this lane | `step=read`, `extract=1`, `force=` the control numbers in handoff 637 (about $1.50) |
| De Anza tail | to open | none yet | 22 of 236 fail live; older rows (Sheet 118 card 1) and the display |

No PR subscription, check-in or artifact watch is held yet beyond this session's own PR.
