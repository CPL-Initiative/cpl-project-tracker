---
title: "Session 692 handoff (from SkyShrike, the plain session of 2026-11-20)"
created: 2026-11-20
updated: 2026-11-20
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** A CPL Queue routine firing follows `docs/session_691_handoff.md` (S690, the conductor, writes it on
#3599), never this file. This handoff is for Sam's next plain session on the Commons build.

# You are SkyGannet (Session 692)

From SkyShrike, the plain session with Sam of 2026-11-20 (ran beside S690's conductor run). A **full checkpoint**
(lanes moved; the run wrote a memory receipt), written by the checkpoint-docs worker at about 17:00Z. Skipped: steps 2
and 3 (no KB structure or user-facing surface beyond #3605's own), 7 (no M-ID pipeline move) and 9 (the UI pass is
its own queue item). **You run on Fable 5.2 as a single plain session, no conductor and no workers** (Sam: *"i'll
stick with fable and up the limit"*); that is his exception to the standing block's Opus 5.5 line.

## Open with the standing block (COBIx on #3358; Sam's rule for the next two or three sessions)

1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background; act on each new
   `<!-- cobix -->` comment. Read a PR's whole thread before you merge it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1`), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from
   `main` right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match.
   Collection comes first (`r-collection-first-sam-2026-11-20`); collection serves the M-IDs
   (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order:** S690's #3604 (wave), #3602 (follow-up) and #3599 (its declaration and handoff 691) are the
   conductor's to land; this checkpoint's PR is yours or this session's; dependabot's #3383 waits as before.

## What shipped

- **#3605 (`161a77cd`):** the 12 still-taught courses in `kb/reference/blocked_catalog_hunt.json`;
  `kb/_blocked_catalogs.py` hunts a college only while it has one (4 on the to-do; El Camino and Fullerton set aside);
  Needs you names its groups for their work; one count on both pages; catalog addresses open in a new tab with Sam's
  line. Guard `tests/commons_outline_fixes.test.js`.
- **The mock, locked by Sam** (*"yes, build it!"*): https://claude.ai/artifact/68ERWyrwiApcF3QM1KuYM2 (version 16).
  Source, scripts and the version-by-version README with his words: `CPLBrain/04-projects/cpl-initiative/commons-order-mock/`.
- **Memory:** four rows applied and read back (`kb/migrations/2026-11-20_commons_outline_fixes_memory_rows.sql`); nine
  more drafted for the session to apply: `kb/migrations/2026-11-20_plain_session_checkpoint_memory_rows.sql`.

Read in order: this file; that README; the NEXT of [`commons`](reference/lanes/commons.md) and
[`common-subjects-reference`](reference/lanes/common-subjects-reference.md); `docs/commons_lessons.md`, *The plain
session of 2026-11-20*; `docs/reference/pipeline_reference.md` section 8 before any table work;
[`methodology-check-the-saved-reads-before-calling-a-source-blocked`](kb-notes/methodology-check-the-saved-reads-before-calling-a-source-blocked.md).

## Priority work, in order (from the commons lane's NEXT and Sam's mock)

1. **The side panel slice** (`r-hand-over-in-place-sam-2026-11-20`): a private file store, a hand-over table, sign-in
   rules, the governance map entry (Rule 10 a3, `kb/governance_surface_map.json`; an outline can name faculty, so the
   file stays private and only parsed outcomes are filed), and the nightly reader's pickup; built from the mock. A
   course opens the Courses tab's card; a college opens College Data Collection's own panel
   (`d-college-opens-cdc-panel-2026-11-20`).
2. **The three Collect cards** (catalog programs, course outlines, credentials) and the curation ladder with owners;
   step b is the Courses bot's (`d-step-b-owner-courses-bot-2026-11-20`).
3. **A committed M-ID census builder on one base**, from the vault's `mid_census_one_base.py`; settle the one
   definition (15,720 counted against the Commons' 15,911). Fix the published local course lists first: six of the
   eight most-linked credit cards have none.
4. **The no-longer-offered flag** (`r-no-longer-offered-sam-2026-11-20`) once the Spring 2026, Spring 2025 and Fall
   2024 term files and the catalog check exist (`q-term-report-sources-2026-11-20`). Never call it inactive.
5. **`.claude/commands/checkpoint.md`'s standing block should carry Sam's work order** (still owed).

Also open in the lanes: the commons lane's #3570 gaps and open data questions, the Rule G dry run then apply with its
own `--expect`, and the CSR lane's ECONMT and Electricity codes. Three lanes wait on other sessions, by slug:
`program-requirements-harvest` is S690's (the conductor's collection run, through handoff 691); `library` (the failing
check row first, then parts 4 and 3) and `common-cr-reference` (the exact match from issue #3523) are plain-session
work after the Commons slice above, unless Sam names them first.

## Decisions Sam made

- **No longer offered** (his words in `docs/reference/sam_rulings.md` and
  `CPLBrain/03-professional/braindumps/braindump-2026-11-20-1300-no-longer-offered-set-aside.md`): a set-aside for
  courses and programs the state lists and a college stopped offering; strict at first (the session read *"yes to
  everything"* as every factor agreeing, and he did not correct it). It partly reverses the Nov 17 one-term rule, so
  nothing is set aside yet.
- **Hand it over in place** (`braindump-2026-11-20-1546-hand-over-in-place-drop-box-try-the-link.md`): side panel,
  drop box, Try the link, paste, an API box, *"for all our commons datasets"*.
- **Credit recommendations join the curation order:** already `r-curation-order-adds-crs-sam-2026-11-20` (S689).
- **Delegated** (*"want you to go with your recommendation"*): the Courses bot owns step b; a one-college M-ID card
  counts as done, flagged.
- **Bot-checked sites:** our named reader reads North Orange and Southwestern with no challenge and stops at one
  (#3536); a site that challenges it goes by hand with a note to the college, which waits on the night's run (COBIx
  reviews the draft, Sam sends).

## Patterns that worked

A mock first, versioned with Sam's words beside each version; every name on a page opening a place to act; ranking
collection by the cards that carry credit.

## Safety patterns to honor

- Check the reader's committed captures before advising that a source is blocked
  (`p-check-saved-reads-before-blocked-2026-11-20`).
- A `cpl_memory` summary is at most 400 characters; one longer row refuses the whole insert
  (`p-memory-summary-400-chars-2026-11-20`).
- Do not stamp `kb/status/program-requirements.json`: S690 is its writer today.
- Never file a person's name from an outline page.

## Ledger and let go

| PR or branch | State | Next |
|---|---|---|
| #3605 | merged (`161a77cd`) | none |
| this checkpoint (`claude/laughing-hawking-9u66zr-checkpoint`) | open, ready | gate on `test`, merge |
| samueltlee/CPLBrain#831 (`claude/laughing-hawking-9u66zr`) | open | the session note rides it; merge |
| #3604, #3602, #3599 | S690's | the conductor's |

The session holds no PR subscription, check-in or artifact watch it names here; it drops any at sign-off.

Spend: $51.34 (Fable 5.2 $51.34); infrastructure $51.34; 2026-11-20T12:17Z to 2026-11-20T17:05Z.

**At sign-off.** Both memory receipts are applied and read back: the four rows of `kb/migrations/2026-11-20_commons_outline_fixes_memory_rows.sql` and the nine of `kb/migrations/2026-11-20_plain_session_checkpoint_memory_rows.sql`. The vault's session note and the mock's source are on samueltlee/CPLBrain#831. Let go: the watch on #3605 (merged), the scheduled check on it (deleted), and the watches on this checkpoint's PR and on CPLBrain#831 once each merges. The mock's own artifact watch stays registered with the session that published it; no tool here drops it.

Opening line: *Greetings, you are SkyGannet (Session 692), see SkyShrike's handoff — `docs/session_692_handoff.md` — let's keep rolling with our queue.*
