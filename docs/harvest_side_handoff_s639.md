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

## Ledger (02:00Z 2026-11-12)

| College | PR, branch | State |
|---|---|---|
| Los Angeles City (156 of 223 live) | #3130, `claude/harvest-los-angeles-city-s639` | Two local steps (the heading's *Minimum of 60* a floor, GE the printed 18-27). Reconcile 43136137275 filed: 10 of the 24 moved, none regressed. Worker is accounting for the 14 held and a rise in missing outcomes (12 to 26). Then a re-extraction of the records read a page past their heading (about $4.50). Review running. |
| Orange Coast (187 of 259) | #3133, `claude/harvest-orange-coast-s639` | 64 of the 72 live failures still carry the S395 extraction, read before the S396 steps. Ten steps now read *Up to 21*, the A.A.'s *Up to 27*, Cal-GETC *up to 34*, an exact 21. Reconcile 43136182950 running. Review running. |
| Victor Valley (108 of 168) | #3131, `claude/harvest-victor-valley-s639` | `hours_file` step moves 2. 23 noncredit certificates add up to exactly the top of the printed hours range: the worker is building that as its own scorer reading, hours only, and measuring its reach at every college first. Also the four EMS modules (Overview tab only) and four degrees with no GE units. Reconcile not dispatched yet. 37006 and 38352 stay as read (Sheet 85). |
| American River | `claude/harvest-american-river-s639`, no PR | Read 43134279776 (`step=read`, `extract=1`, the 23 forced) rewrote 154 records on the new edition: 16 improved, 30 that passed now fail. **Not loaded, not reread.** A read-only diagnosis is sorting the 30 and reading the run's spend. |
| Rio Hondo, West Valley, Berkeley City | branches `claude/harvest-<college>-s639`, PRs to come | One worker, three branches. Cause: transfer degrees name Cal-GETC with no units; the step cites each college's own Cal-GETC page. Diagnoses simulate 275 of 292, 120 of 133 and 56 of 90 filed. |
| San Bernardino Valley, Grossmont, East Los Angeles | none yet | Diagnosed, waiting on the scorer readings below. |
| De Anza tail | none yet | Live 236 rows: 221 on 2026-2027 (205 pass), 15 on 2025-2026 left behind by the wave (Sheet 118 card 1: remove by the S456 method). 24 rows loaded at 22:43Z carry no display. The display build waits for this wave's rereads. |

**Subscriptions held:** #3129, #3130, #3131, #3133 (a worker's PR subscribes this session when it opens). **Check-in held:** `trig_018CmBFUgZuvuQAiMnMN68yP` (02:12Z, the Orange Coast run). **Workers** do not survive a container restart: brief a fresh one from the PR and this table.

## The six-college diagnosis (read-only, 01:25Z to 01:55Z)

| College | Live pass | Simulated | Cause that pays | Needs |
|---|---|---|---|---|
| Rio Hondo | 245 of 288 | 275 of 292 filed | 29 transfer degrees: Cal-GETC and *DEGREE TOTAL 60*, no GE units | one free read, `set ge_units` gated `transfer` |
| West Valley | 93 of 133 | 120 | 27 transfer degrees, the same | one free read; `ge_units` 34 and `degree_total_minimum` |
| Berkeley City | 35 of 89 | 56 | 21 transfer degrees, the same; 14 local degrees print one combined *General Education and Electives N* | two free reads; no step on the combined line without the college's own GE words |
| San Bernardino Valley | 146 of 200 | 179 | 11 local degrees with no GE units; 19 noncredit certificates printing only *Total Hours N-M* | three free reads; `prefix_aliases`; a scorer reading for the hours total |
| Grossmont | 99 of 140 | 121 | 22 transfer degrees: *Complete transferable units as needed to reach 60* prints no word *elective*, so the scorer's guard fails the flag | a `set` filing the catalog's sentence, and the scorer reading that field |
| East Los Angeles | 92 of 133 | 109 | 19 degrees on the same electives guard; 8 on a double-count sentence | four free reads; the same scorer reading |

**Scorer readings, one writer (the Victor Valley worker's branch holds the first):** (1) an hours-measured program whose course hours add up to exactly the top of the printed range; (2) a noncredit total printed as *Total Hours N-M*; (3) the electives flag honored where a step filed the catalog's own sentence. Each is measured at every college before use, sits beside Sam's narrow `meets` ruling (Sheet 120 card 1) without changing it, and is recorded as this session's call for Sam to revise.
