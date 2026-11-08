---
title: "Session 606 handoff: S604's three PRs merged; the Coordinator Guide's Request Quick Adopt links; Columbia's failures read by shape"
date: 2026-11-08
session: 605 (SkySextans, the CPL Queue routine's 08:12Z firing, 2026-11-08)
tags: [handoff, library, program-requirements-harvest, scheduled-sessions]
status: current
superseded: true
superseded_by: session_607_handoff.md
---

# You are Session 606

Your moniker is **SkyFornax** (galaxy names).

This checkpoint is **light**. No Roadmap row moved, and there was no re-mint. The one data write is a single Library
record, moved by a migration with its rollback through `supabase-migrate.yml`. Skipped, each unchanged this run:
`kb/README.md`, `README.md`, the pipeline view, KB notes, the run logs under `kb/status/`, `cpl_memory` (the one
durable finding, BMT's `View=Military`, is in the Library lessons and the safety patterns below), and the dependency map's
`oversized_doc` (a generated file, 1.02x, which this run did not touch). No decision sheet was rebuilt, because nothing
is waiting on Sam.

## What shipped

1. **S604's three PRs merged** on a passing `test`: #2913 (credential watch), #2914 (contacts harvest), #2912 (its
   checkpoint). S604 had finished, but it left them open.
2. **Library, step 6: the Coordinator Guide's Revise request** (Sam, 2026-11-05: *"can you add the Request Adopt
   buttons to any courses or exhibits possible?"*). Draft 2 is republished at the same artifact
   (https://claude.ai/artifact/7HPvgHpX8jnfpCLd7e4Tv1, version 1794125894-480b). Under *Setting up MAP*, a table gives
   Request Quick Adopt for Basic Military Training and the seven statewide credit recommendations the most colleges
   have adopted. Each link opens the MAP exhibit card, and every ID was checked against MAP's API. Basic Military
   Training takes `View=Military`. The Credential Catalog joins Resources. axe found nothing at 390 and 1440px, light
   and dark. The vault source is committed (CPLBrain). The record moves by
   `kb/migrations/2026-11-08_library_coordinator_guide_draft2.sql` (run 42462409021, queued at sign-off).
3. **Catalog sweep, step 12: Columbia read by shape.** 47 of its 51 arithmetic failures name a GE pattern with no
   units, and the major sums correctly. A free page read (`kb/college_reads/columbia_ge_units.json`) was pushed on #2915
   to find how the catalog words CC-GE's units (lessons, S605).

## Decisions Sam made this run

None (an unattended firing).

## Open work, in order

0. **#2915 (this run's PR):** confirm the migrate run wrote its receipt to the branch and read the record back
   (`version` Draft 2, `regen` null). A runner's receipt commit starts no `test`, so push the next change, then merge
   on a passing `test`. If the apply failed, fix it and write `.apply` again.
1. **Columbia's GE step.** Read the `college-page-read` run's log for `columbia_ge_units` on #2915's branch. Then add
   Columbia College to `kb/program_requirements_reconcile.json`:
   - a `set` of Cal-GETC 34 on `awards: transfer`, with Taft's pattern and the Monterey Peninsula citation;
   - a `set` of CC-GE's units on local degrees, cited from Columbia's own words, only if the page prints a figure.
   Run the free reconcile on the branch, and count what moves to passing against the stopping rule. If no page prints
   CC-GE's units, park the local degrees as Taft's were, with no invented step.
2. **Write the staged memory rows when a person can approve the prompt:** `kb/receipts/cpl_memory_2026-11-08_s603.sql`
   and `..._s604.sql`. Check the slugs are absent first. A scheduled firing hits the same timeout, so this belongs to
   Sam's next session.
3. **SLOs (step 11), on 2026-11-09 UTC:** Cuesta's trial on #2910. `next_slo_colleges.py --college cuesta` prints
   the `.run` lines. The day's one full read goes to `--next --skip cuesta`.
4. **Redwoods (50%):** the same by-shape read as Columbia's, after Columbia's step. Never both on one host.
5. **Contacts titles for Sam:** does *Dean of Enrollment Services* (4 colleges) read as `dean_ar`, and *Dean of Career
   Education* as `dean_cte`? A question for the next sheet. The next weekly read is Sunday 2026-11-15.
6. **Library side lane:** IACA (waiting on Crystal Nasio's note) and DSP Version 3 (draft ready, waiting on Sam's
   Replace). `docs/library_handoff.md` keeps the alignment, CER and Sierra items.
7. **Carried, unchanged:**
   - the TMC Builder's real-browser save and resume;
   - **security step 5** (`docs/security/cobix_round1_reply_2026-11-05.md`), each item its own PR under Sheet 167 card 4;
   - the `environment:` lines, after Sam creates `database` and `database-scheduled`;
   - COBIx's small items (stable credential keys, CPL Pathways on `college_id`, the "Reading" tiles), with one vault PR;
   - the Worker `?secret=` drop, once Sam confirms #2893 is deployed;
   - noncredit categories, which wait on Jenni's Q1.
8. **Lanes worked this week whose NEXT waits:**
   - On the team or real traffic: `local-course-cr-alignment`, `my-college-action-page`, `reviewer-session-lifetime`,
     `sierra-retrieval-corpus`, `commons`, `common-subjects-reference`.
   - Waiting on a step or a person: `map-users-student-contact` (the next weekly read), `org-phrase-scope-auth`
     (step 5), `noncredit-cip-categories` (Jenni), and `cer-procedures` (Sam's *Another look*).
   - Sam steers: `college-district-identity`, `common-cr-reference`, `csm-workspace`, `eacr-exhibit-cr-adoption`,
     `governance-team-enablement`, `implementation-funding`.
   - `library`: item 6.

## Safety patterns

- An unattended firing cannot write through `execute_sql`, because the approval prompt times out. A single guarded
  record update goes through `supabase-migrate.yml` as a migration with its rollback, as the Library's draft writes do.
- A link to a MAP exhibit card names its tab: `View=Military` for a military exhibit (BMT's `CPLTypeDescription`),
  `View=Non-Military` otherwise. `map_links.js` assumes Non-Military because its index holds no military IDs.
- A session that finishes its checkpoint should merge its own green PRs before it stops. S604 left three open.

## Let go

This session made no PR subscriptions, check-ins or artifact watches (the remote session cannot watch an artifact).
Open PRs: #2915 (this run's; migrate and page read queued at sign-off), #2910 (the routine's, Cuesta's trial),
#2894 (Sam's review).

> *Greetings, you are SkyFornax (Session 606), see SkySextans's handoff — `docs/session_606_handoff.md` — let's keep rolling with our queue.*
