---
title: "Session 668 handoff (from SkyPlover, S667)"
created: 2026-11-16
updated: 2026-11-16
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyPipit (Session 668)

From SkyPlover, S667, Sam's session on 2026-11-16 (16:17Z on, opened by hand: five CPL Pathways changes first, then
*"keep rolling with the queue once it merges"*). A **full checkpoint**: lanes moved and the run wrote data through the
runner (seven `cpl_memory` rows and one guarded correction). Step 7 skipped: the pipeline did not move.

Read this file, then the harvest lane (`docs/reference/lanes/program-requirements-harvest.md`, NEXT), then
`docs/cpl_pathways_lessons.md` S667 and `docs/program_requirements_harvest_lessons.md` S667.

## What shipped

- **#3402** (`da29bf82`): Sam's five CPL Pathways asks. Request Adopt lines on catalog-record course cards
  (`map_links.js`, per Could adopt or For consideration credential); Ask Sierra's chip and side bar on the tab, the
  program's Ask Sierra word opening the bar; an SLOs and objectives side panel on every course list that has outcomes;
  the full window width; the CPL Visual's progress bar, step and clock (`library/cpl-opportunity/`). Guard
  `tests/cpl_pathways_side_panels.test.js`. Lane: `my-college-action-page`.
- **#3403** (`0b12933c`): `kb/plain_words.py`, the one term list for the Commons lint and the decision sheets; the
  commons lane records the six re-clustering cases as settled. **samueltlee/CPLBrain#806** (`7f90ee50`): the sheet
  builder refuses an undefined insider term from Sheet 201 on; Sheet 200 is named, never rebuilt.
- **#3404**: the harvest and governance lanes, this handoff, and seven `cpl_memory` rows applied by
  `supabase-migrate.yml` (run 43923390897) plus one guarded summary fix (run 43926516228), after COBIx's review.

## First things, in order

1. **Step 11 (UTC Nov 17).** Coastline's objectives reread is the full read, then Golden West (`cccd`), plus one
   preparation run. College of the Redwoods (#3387) and Allan Hancock (#3284) are read and wait their turn.
2. **Gate and merge #3404** if it is still open: `test` green on the current head. A receipt commit pushed by the
   runner starts no workflow; dispatch `js-tests.yml` on the branch so `test` reports on that head.
3. **Governance NEXT (1):** `weekly-reflections-summary` runs next about 23:37Z on 11-16. When it is green in
   `live-counts`, group 2 (14 jobs) moves in one PR; 7 of 9 group-1 workflows were already green at S667's read.
4. **Harvest NEXT, from the lane:** (3) the other colleges' plain and 2.0 pairs on curriQunet; (4) slice B's
   extraction with the named-course minimum of one (`d-named-course-minimum-one-s667`), then Skyline 46296 and 32337
   and the self-test recall; (5) #3293; (6) Lassen's pinned capture; (7) Los Medanos and Los Angeles Valley.
5. **Commons NEXT:** `d-huma-m10oi-into-m1110-s652` (HUMA M10OI into M1110, its own small M-ID change); Sam's billing
   paste into `kb/reference/model_spend_daily.json`; Honors reader minors.
6. **Lanes with a NEXT not taken:** `cer-procedures` (the rename batch, `series_aliases`), `library`,
   `college-district-identity`, `eacr-exhibit-cr-adoption`, `implementation-funding` (card 11 is Sam's),
   `reviewer-session-lifetime`, `sierra-retrieval-corpus`, `sierra-page-redesign` (#3159 is Sam's),
   `workplan-annual-goals`, `csm-workspace` (31 KB, over budget), `map-users-student-contact` (next Sunday's contacts),
   `my-college-action-page` (the outcomes panel on live data: verify on the deployed tab once a college with
   `course_outcomes` rows is chosen).

## Session settings

One Opus 5.5 session works the queue. The $40-per-college-per-run limits and the #3351 gates stand. Merge only to
`main`, confirmed with `git log origin/main`. **Database writes go through the runner**, never Execute SQL: a committed
SQL file named in `kb/migrations/.apply`, applied on push to a `claude/` branch, which leaves a receipt.

## Ledger (PR, state, next)

| PR | State | Next |
|---|---|---|
| #3402 | merged `da29bf82` | none |
| #3403 | merged `0b12933c` | none |
| samueltlee/CPLBrain#806 | merged `7f90ee50` | none |
| #3404 | open; rows applied from the branch | merge on green `test` (First thing 2) |
| CPLBrain S667 session note | open | merge |
| #3387, #3284 | drafts; keep | First thing 1 |
| #3293 | draft; keep | harvest NEXT (5) |

## Decisions and Sam's words

`cpl_memory` rows (`kb/migrations/2026-11-16_s667_cpl_memory_rows.sql`, receipt
`kb/receipts/migration_s667_cpl_memory_rows_43923390897.json`; fix receipt
`kb/receipts/migration_s667_cpl_memory_fix_43926516228.json`): Sam's five asks verbatim
(`sam-pathways-five-asks-2026-11-16`, verified), `d-pathways-five-built-s667`, `d-six-cases-settled-s667`,
`d-rcc-two-left-no-pdf-route-s667`, `d-named-course-minimum-one-s667`, `d-plain-words-one-rule-s667`,
`p-tab-listeners-share-one-registry-s667`. COBIx on #3395 (Nov 16) asked to apply all six re-clustering cases; Sam's
Sheet 195 card 2 and his in-session ruling on MATH M1044 stand, answered once on #3395.

## Patterns that worked, and safety

- Measure a definition from committed files when the source is out of the network: 19,137 records answered the
  named-course minimum; then read the records at the edge before naming what they are (COBIx caught two).
- A `course_outcomes` reader names its kind, even one that wants both (`kind=in.(slo,objective)`).
- Two tabs toggling one shared widget ask one registry (`window.CPL_SIERRA_TABS`).
- The full `npm run a11y` crashes Chromium in this container; run a narrowed config of the touched targets.
- A runner's receipt commit starts no workflow: dispatch `js-tests.yml` on the branch for `test` on that head.

## Checkpoint notes

Lint: `my-college-action-page` and `program-requirements-harvest` back under budget (an old paragraph each moved
verbatim to its lessons doc). Not taken: `CLAUDE.md` at 1.04x, `csm-workspace`, `implementation-funding`, `library`,
the dependency map. No KB note. Wiki candidates for `/wiki-ingest`: the plain-words rule's one list; a person's
ruling outweighs a peer's request to apply.

## Let go

The scheduled check-in `trig_01HbjUo2awNhBMUiX7Ta5fyR` fired at 18:22Z and is spent. This session drops its
subscription to #3404 at sign-off; no other PR subscription, check-in or artifact watch is held. The standing sheet
stays [Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current; card 1 answered by #3397).

Spend: not available; 2026-11-16T16:17Z to 2026-11-16T18:45Z.

Greetings, you are SkyPipit (Session 668), see SkyPlover's handoff — `docs/session_668_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_668_handoff.md) — let's keep rolling with our queue.
