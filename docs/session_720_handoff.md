---
title: "Session 720 handoff (from SkyShearwater, S719, Sam's plain session of 2026-11-24: the web-search pass, the MQ view, every Commons card in the Subjects design)"
created: 2026-11-24
updated: 2026-11-24
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_726_handoff.md
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows `docs/session_699_handoff.md`
and the routine's own newest handoff, never this file. **Numbering.** If 720 is taken when you start, take the next
free number and say so in your handoff.

# You are SkyCormorant (Session 720)

From SkyShearwater (S719), Sam's plain session of 2026-11-24. A **full checkpoint**: the commons and
common-subjects-reference lanes moved. Skipped: step 2 (no KB structure, generator or audit artifact changed), step 3
(`README.md` lists tabs, not the Commons' views, and the MQ view, #3745, sits inside the Commons tab), step 7 (no
re-mint; the pipeline did not move) and step 9 (not a step). The `cpl_memory` receipt is drafted in the checkpoint PR;
the conductor applies it and writes the status files.

## Open with the standing block

1. **COBIx:** as in 715 to 719, Sam said no COBIx check-ins for now. Start `bash scripts/cobix_watch.sh [state dir]`
   only if he asks.
1a. **Clone light:** `git clone --filter=blob:none` (or `--depth=1` when history is not needed), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head; no dependency-map rebuild inside a PR; no full rerun when the
   input fingerprints match. Never open a PR on a branch that holds another open PR's commits.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes; a fix goes ahead of the next wave only
   when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the M-IDs, so
   its fixes rank by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
2b. **A CI wake that names an older head: read the current head's checks and say nothing.**
2c. **Before a push, `bash scripts/check_generated.sh` must read all ok;** it covers every kb/status file.
3. **Merge order:** #3748, then this checkpoint PR.

## What shipped (merged unless marked open)

- **#3740** `levels()` matches a college's name as the table does (Los Angeles Trade-Technical).
- **#3741** the web-search pass for all 205 untitled codes with no filed search: 313 searches on file; a program label
  only where the page lists the code's courses; run 45304208269 read 69 pages, none names its code.
- **#3743** every Commons card but Plan in the Subjects card's checks design; a Confident line only on Courses and M-IDs.
- **#3744** the quarterly MQ baseline on the 20th edition (run 45311236371, COMPARE same), its test tied to the
  handbook file.
- **#3745** (`48d67aa4`) the MQ view at `#commons/subjects/mq`, the statewide code filter at its own address, sidebar tables
  that sort and resize, a second sidebar beside the first.
- **#3748 (open):** the cards answer their own edits (Exhibit titles, Courses data, Credit
  Recommendations live; the rest say why not). This closes Sam's S715 ask 3.

## Read in order

1. `docs/reference/lanes/commons.md`, the *Subjects, by confidence* and cards paragraphs (their NEXT).
2. `docs/reference/lanes/common-subjects-reference.md` (Status and NEXT (S719)).
3. `docs/common_subject_code_tab_lessons.md` and `docs/commons_lessons.md`, the S719 sections.
4. `docs/kb-notes/methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh.md`, its fourth instance.
5. `docs/coursecontrolnumber_remint.md` before the re-point.

## Sam's words this run

- ~01:20Z: *"In this session, let's finish the subjects work and apply the design from the subject card to the other
  commons cards."* He sent nothing else.

**DECIDED by the session (his to revise):** `d-program-label-lists-the-codes-courses-s719`,
`d-search-row-records-its-own-query-s719`, `d-cards-checks-design-s719`, `d-cards-live-figures-s719`,
`d-mq-view-addresses-s719`, `d-second-sidebar-beside-first-s719`, `d-csr-baseline-20th-s719`.

## Open work (from the lanes' NEXT)

1. **Merge #3748** on a green `test`, after one update from `main`.
2. **Southwestern PE/A, PE/I, PE/T, PE/L, PE/D to ES/A, ES/I, ES/T, ES/S, DANC:** Sam's word (a person's word is a
   source for `kb/reference/subject_code_history/`) or a printed source. The 2017-2018 archive answers
   `robots_disallow` (`f-southwestern-pe-es-behind-robots-s719`).
3. **Read the printed MICROTK to IT line** (LATTC's catalog PDF) and DSPS to ACCS (Mt. San Antonio).
4. **A small per-code courses file under `kb/`,** so the MQ courses sidebar stops loading the 17 MB `coci_lookup_data.js`.
5. **Two sidebars open:** the view's last ~124px strip gives way to the pair.
6. **College Data Collection's stuck colleges live** (a `commons_data.js` state change); the CR Progress view reads the
   card's live count.
7. **Re-read `kb/reference/mq_sections.json` from the 20th edition** (`f-mq-sections-still-19th-s719`).
8. **From handoff 719:** re-point the folded local codes (a re-mint, dry run first); CIP in place of TOP for MQ type;
   the outline's MQ discipline in the SLO pass; probe round 2 and the filers; the code history's next readers; the mint
   takes Confident calls; the 787 Unsure codes; FLNG and Athletics into KINE; Sam's twelve AED titles, then one re-mint.
9. **Waiting, by slug:** `cer-procedures`, `my-college-action-page`, `program-requirements-harvest`. S719 moved none.

## Patterns that worked

- Measure a width rule in a browser: Playwright's scrollWidth against clientWidth caught what jsdom reads as zero.
- Pin a test to the file a value must agree with, never to its literal.
- Size a search fan-out to the turn's web-search allowance, which every helper shares.

## Pitfalls

- A search summary is not the page: file a title from a page read or a printed line.
- A grouped search does not stand for a row; a row records only its own query.
- `robots_disallow` closes a source; the reader respects it.
- Worker worktrees land under `.claude/worktrees/`; a brief's named path is not honored.

## Let go

At sign-off: the PR watches on #3745 (merged), #3748 and the checkpoint PR. No COBIx watcher ran; no artifact watches.

Spend: not available; 2026-11-24T01:09Z to 2026-11-24T03:37Z.

Opening line: *Greetings, you are SkyCormorant (Session 720), see SkyShearwater's handoff — `docs/session_720_handoff.md` — let's keep rolling with our queue.*
