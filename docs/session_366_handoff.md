---
title: Session 366 handoff — Sheet 65 open (Vision 2030 goal figures, CPL Pathways' records), four UI passes
date: 2026-10-11
session: 365 (SkyRowan)
tags: [handoff, ui-pass, first-light, accessibility, vision-2030, decision-sheet, program-requirements]
status: current
superseded: true
superseded_by: session_368_handoff.md
---

# You are Session 366

Your moniker is **SkyHazel**. Session 365 (**SkyRowan**, `session_017CScA3ayBb9MBkxrr3qRqi`) ran alone; Sam pasted
the greeting and did not write again. Sam's CPL Queue routine fires at 05:05Z on 2026-10-12; if it started you, follow
`docs/reference/scheduled_sessions.md`.

## First, in this order

0. **One writer.** `list_sessions`; S365 holds no PR, check-in or watch at sign-off (below).
1. **Rule 8:** `cpl_memory` tags `vision-2030`, `ui-pass`, `program-requirements-harvest`. This run's rows:
   `v2030-goal-figures-two-sources-2026-10-11`, `v2030-actions-workplan-verbatim-2026-10-11`,
   `ui-pass-sweep-widths-miss-phone-layout-2026-10-11`, `pathways-file-split-measured-checked-gate-2026-10-11`.
2. **Read Open Asks Sheet 65's replies before anything else** (https://claude.ai/artifact/7gAZzsrv9LRLaYdQxvyFvv,
   current; `ArtifactData list` on `replies`). At sign-off it held none. Sheet 64
   (https://claude.ai/artifact/8cwycsPrrbnTVCJSxeg2q2) is superseded by 65 and never had a reply.

## Sheet 65 — what each answer sets in motion

- **Card 1, Vision 2030 goal figures** (governance lane NEEDS SAM). The tab (`render_vision_2030_html()`) and the annual
  report (`CPL_DATA.vision2030`) state the goals from different sources. *One set, as proposed*: one helper feeds both;
  Goal 1's bar measures students over 250,000 and the credit recommendation line drops its percent (the workplan's
  1,000 counts workgroup recommendations, p. 4); Goals 2 and 3 read `V2030_G2_PROGRESS`/`_CURRENT` and
  `V2030_G3_PROGRESS`/`_CURRENT` from `kb/dashboard_config.json` and show TBA while unset. *Count every MAP
  recommendation*: Goal 1 keeps a full recommendations bar beside the student figure. Extend
  `tests/vision_2030_first_light_test.py`; dispatch `daily-dashboard.yml` after merge (Rule 1).
- **Card 2, CPL Pathways' records** (harvest lane NEXT ④ NEEDS SAM). *Read from the table*: CPL Pathways reads a
  program's record from `program_requirement_records` when a reader opens it (anon sees checked, a reviewer all, marked
  unchecked), the way `program_requirements.js` reads it; the pilot file can stay as the offline tier. *Every record,
  marked*: split `cpl_pathways_roep_data.js` per college (2.4-4.0 MB each) with a not-yet-confirmed mark. Measurements:
  harvest lessons, S365; KB note `methodology-a-published-file-carries-past-the-tables-read-gate`.
- **Either answer leaves the sheet in the same change:** drop the lane's NEEDS SAM, move the card out of the vault
  builder (`CPLBrain/decision-sheets/`), merge the tracker PR first, then the vault PR. Lift the ledger's hold on
  `cobi:cpl-pathways` once card 2 is carried out.

## In flight

Nothing. #2005 (Noncredit & Learning Partners) merged at sign-off; it carries the ledger's hold on CPL Pathways.

## Next in the queue

- **The UI pass:** `python3 scripts/ui_pass.py --next` names **Governance** (never audited; a gated
  register, so seed it before you trust a clean sweep).
- **Harvest NEXT ①:** Long Beach City's 74 records that place none still wait on its reading procedure.
- **Remainders named, not open:** below a 981px frame the veteran map scrolls inside COBI's frame by design; the full
  `cobi-dark` sweep fails 11 routes on main, none touched by S365 (annual-report, canonical-subj4, cip-crosswalk,
  cpl-news, cr-reference, credential-reference, map-export, memory, pipeline, unified-courses, and coci-lookup's focus
  check on some runs). Each is its view's future pass.

## What shipped (S365)

#2001 Vision 2030 UI pass (no sideways scroll at 320px; bars a phone can see; the actions verbatim from the CPL Workplan,
shared with the annual report; widths held to 0-100; daily run dispatched and the section verified live) · #2002 the
harvest lane's NEEDS SAM · #2003 Team & RACI edit mode by keyboard and the dark jump highlight at AA (`--gold-soft` dark
`#40320E`) · #2004 Military Partnerships (the framed map stops repeating the tab's heading; the link takes its token) ·
#2005 Noncredit & Learning Partners · vault #307 Sheets 64-65 and #308 the session note. New seeded targets: `raci-editor`, `raci-directory`,
`nc-partners-editor`, each with `-dark`.

## Safety patterns

- **Measure a plan before building it, and read the table's policy before widening a public file.** The per-college
  split looked like engineering; measured, it was 18.2 MB and a disclosure past the `checked` gate.
- **A sweep sees only its widths and its seeds.** Read 320 and 390 yourself; seed signed-in and team-phrase states
  through the tab's own reads and `activate()`.
- **Prove a new seed measures what you fixed:** break the fix on purpose and watch the target fail (S365 did, eight
  targets).
- **A ledger hold is a reason string** set through `scripts/ui_pass.py`'s own `save()` (a hand-written JSON dump
  rewrites the whole file).

## Not refreshed this checkpoint

The Pipeline tab (the pipeline did not move), `kb/README.md` and `README.md` (no structure or surface change). The
decision sheet is not rebuilt: its cards did not change and its store is empty.

## Sign-off line for Sam

Greetings, you are SkyHazel (Session 366), see SkyRowan's handoff — `docs/session_366_handoff.md` — let's keep rolling with our queue.
