---
title: "Session 543 handoff: kept groups, one List engine for the Catalog Commons, full width, the SLO test"
date: 2026-11-01
session: 542 (SkyTriangulum, Sam's session, live from about 19:28Z)
tags: [handoff, exhibits, exhibits-list, commons, commons-list, slo, course-outcomes]
status: current
---

# You are Session 543

Your moniker is **SkyAndromeda** (galaxy names, Sam at S540). S542 ran a **light checkpoint**: no lane changed state,
no re-mint and no Rule 10 data write. Skipped: kb/README, README, the Pipeline tab (it did not move) and new KB notes
(none crossed the bar). Read `list_sessions` first: S542 may still be live with background builds.

## What shipped (all merged on a passing `test`)

- **#2655** Exhibits List: a band over every run (titles alone sit under *Not in a group*; the 832 Arrest screenshot was
  a render gap), tick rows and **Move** (a new name starts a group), **Out of every group**, **Back to the AI sort**,
  **Keep this group**, **Rename** (a shared name joins two), **Release**. Field `exhibit_group` (DR-07).
- **#2656** `commons_list.js`, one List engine; Exhibits runs on it unchanged. **#2657** CR Reference List
  (`#cr-reference/list`), **#2659** its flag (`_CR_LIST::<wording>`, `list_flag`, reviewer sign-in only, no find and
  replace). **#2658** Subjects List (`#canonical-subj4/list`, adds *Confirm this pick*). **#2660** Program Requirements
  List (`#program-requirements/list`, 20,282 rows, read only).
- **#2661** every List spans the window; its table scrolls in its own box only when narrower than its columns; Edit no
  longer clips. **#2662** Catalog Commons: full width, **Decision Sheet Library**, bold count with a green 0,
  **Completed Decision Sheets** one line each that opens.

## Sam's decisions this run (cpl_memory rows name him)

- Keep groups and move titles from the List (`sam-exhibits-list-kept-groups-2026-11-01`).
- A List for every Catalog Commons group; the CR List gets the flag, no find and replace.
- Lists full width with a sideways scroll when needed (`sam-lists-full-width-scroll-when-needed-2026-11-01`).
- Catalog Commons wording and layout above; then: *"I like the tiles above the list ... integrate what's needed into
  existing tiles and create any others needed to capture everything from 1st into Exhibits view."*
- He asked for the one-time SLO test (done, below), then: *"yes to SLO hints and the nightly harvest"*
  (`sam-slo-hints-and-nightly-harvest-2026-11-01`).
- Where the Courses List lives: *"WE have the COCI lookup tab in COBI...maybe courses in that?"* S542 proceeded on it
  (`sam-courses-list-in-coci-lookup-2026-11-01`). Nothing waits on him; no Open Asks Sheet 154.
- *"Would be nice to use any design lessons and norms from the exhibit list view for courses and all the other commons
  modules...moving toward consistent views for all the folding and consolidation work"*, with *"feel free to add fable as
  advisor on that move"*. S542 wrote the norms: `docs/kb-notes/reference-catalog-commons-list-norms.md`.

## Read in order

1. `docs/cer_v2_redesign_lessons.md`, *Groups you keep, one List engine, outcomes tested (S542)*.
2. `docs/reference/lanes/commons.md` (Status: the engine, the Catalog Commons tab, Next) and `cer-procedures.md`.
3. The SLO report: `CPLBrain/04-projects/cpl-initiative/20261101_SLO_Grouping_Test.md`.
4. The spec contract at the top of `commons_list.js` before touching any List.

## Open work, in order

**First, the PRs S542's background builds opened** (it let go before they finished). List open PRs; for each, check its
`test` on the current head, merge main in if it is behind, and merge on green. Expect five, on these branches:
- `claude/exhibits-tiles-commons`: the Exhibits tiles carry everything in the Commons' Exhibit row (Sam's call).
- `claude/exhibits-slo-hints`: *Outcomes match* hints in the Exhibits List from a nightly neighbors file; it may carry a
  Supabase function as a migration through `supabase-migrate.yml` (check Rule 10 before applying).
- `claude/slo-nightly-queue`: the SLO read as a new numbered step of `scheduled_sessions.md`; check the cost answer it
  gives before the queue runs it (if it costs money beyond a standing go, that is Sam's call).
- `claude/coci-lookup-list`: COCI Lookup on the shared engine as the Courses List, local courses banded by M-ID; check
  its timings at 141,738 rows.
- a branch recording Sam's three answers as plain lines in the cer-procedures, program-requirements-harvest and commons
  lanes (no sheet).
If a branch has no PR, its agent did not finish: rebuild from its brief in this handoff.

1. **Align every List to the norms** (`reference-catalog-commons-list-norms`, revised with Fable's review, which Sam
   asked for). Its *Next, one PR each*: (1) an engine `suggest` slot and the `changed` tracker, CR's rung proposals and
   Subjects' open picks wired in; (2) the filter vocabulary with counts and the status-line words in the engine; (3)
   bands from a spec `groupOf(r)` and filter before sort (do this before merging the COCI Lookup List if its keystroke
   timing is slow). Kept groups stay Exhibits' alone; M-ID and Common SUBJ changes stay re-mints.
2. **Carryover from 542:** step 10's first night (the credential harvest); the cert link's next families (AP, CLEP, IB,
   then the unresolved names); the reference's statewide flag (84 vs 152, code only); step 9's Jev runner; Monterey
   Peninsula's 14; Accept's email (Sheet 146 card 3); Sierra's first-text latency; the college short-name editor.

## The SLO test in one paragraph

746 of 2,663 credentials reach an articulated course with SLOs (nine colleges; 81 to 86% of articulated courses there
carry SLOs). At similarity 0.5 or more on distinct courses, only 36 of 113 pairs share an AI sort group: outcomes find
likeness the titles hide. 45 of 164 groups share almost no outcomes. The harvest is dispatch-only, last loaded
2026-10-14; the cert catalog has skills for 1 of 7,335 certs.

## Lessons to honor

- **Check what the screen draws before re-running a method.** The 832 Arrest "intruders" were never in the group.
- **Stage files by name.** `git add -A` carried a local docs-audit run into #2655.
- **A Supabase-reading tab cannot be driven from the sandbox** (Program Requirements); verify its List in jsdom and on
  a tab that reads committed files.

## Previews

Exhibits List https://claude.ai/artifact/Qqcfxd9xkzdg91rkw6275A (v12); CR List
https://claude.ai/artifact/HdcswFrgHGu8ieH2PN24Ae (v2, the flag). Rebuild with `scripts/build_exhibits_list_preview.py`
and `scripts/build_cr_list_preview.py`.

## Let go

S542 holds PR subscriptions on its own open PRs and the two preview artifacts' watches; all lapse with the session.
The CPL queue fires next at 06:12Z on 2026-11-02.
