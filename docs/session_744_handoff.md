---
title: "Session 744 handoff (from SkyBrant, S736, Sam's plain session of 2026-11-26 to 11-27: Library publish fixes, the lightning round, LACCD schedule titles, the Accounting dry run)"
created: 2026-11-27
updated: 2026-11-27
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_747_handoff.md
---

**Routing and numbering.** This handoff is for Sam's next plain session. The CPL Queue routine follows its own
(742, SkyWillet's, naming SkyGodwit, whose run writes 743). 742 was taken on `main` before this checkpoint, and 743 is
the routine's next, so this file takes 744. Handoff 738 (SkyWhimbrel's) is folded in here.

# You are SkyCurlew (Session 744), Sam's next plain session

From SkyBrant (S736), Sam's plain session of 2026-11-26T00:02Z to 2026-11-27T15:30Z. A **full checkpoint**: three lanes
moved (`common-subjects-reference`, `commons`, `library`), the Accounting re-point dry run is a re-mint plan, and six
`cpl_memory` rows landed (receipt `kb/receipts/cpl_memory_s736_rows_2026-11-27.sql`). Skipped: step 2 and step 3 (no KB
structure or README-level change; the lightning round's controls are a tab feature), step 7 (no re-mint applied, so the
pipeline did not move), and `kb/status/program-requirements.json` in step 12 (this run did not touch the harvest; the
routine keeps it). No `## Conductor settings` block: conductor mode is retired for plain sessions (checkpoint step 8).

## Open with the standing block

1. **No COBIx watcher.** Sam said no COBIx check-ins for now (`d-cobix-watcher-stopped-on-sam-word-s714`). Start
   `bash scripts/cobix_watch.sh [state dir]` only if he asks. Read a PR's whole thread before you merge it.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1`), never a full clone; fetch `main`
   by name.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head; no dependency-map rebuild inside a PR; no full rerun when the
   input fingerprints match; never a PR on a branch holding another open PR's commits.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes (`r-collection-first-sam-2026-11-20`);
   collection's fixes rank by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
2b. **Before a push, `bash scripts/check_generated.sh` must read all ok.**
3. **Merge order:** this checkpoint's PR, then its CPLBrain twin. Open PRs of SkyBrant's: none besides those two.
4. **At start, read the training notes that ask COBI to act** (once item 2 below lands): `kb_curation` rows with
   `field = 'procedure_note'` and `value->>'act' = 'true'`; until then read every `procedure_note` row since
   2026-11-26 and act on what it asks.

## Sam's words and decisions

- **RULED** `r-schedule-tool-first-for-subject-titles-sam-2026-11-26`: *"search each college's website for their
  schedule tool, which is almost always listed by subject and title"*; *"add these titles instead of guessing"*.
- **Library:** the top Publish opens the form, a prefilled public summary, the sidebar matching the list's height and
  type, progress on a waiting piece; *"the file feature is not needed"* (File a new version removed).
- **The lightning round:** *"needs to pop off the list"*; *"add hover over on the course listed on each card showing the
  course description"*; *"have the catalog link open in bottom bar rather than to a new tab. collapse the bottom section
  with all the explanation text. add a place for me to add a training note for our procedures"*. **DECIDED**
  `d-lightning-round-not-a-subject-and-skip-s736`.
- **2026-11-27:** *"there should be a way to ask you to run a routine to reparse based on the note and perhaps all the
  cerro coso items could be resolved quickly"* (open work 1 and 2).
- He shared Cerro Coso's long-term schedule (2026-11-27), the evidence for open work 1.

## What shipped (all merged)

- **#3864** Adult Ed CPL Starting Points' filter, and its record names its Pages copy. **#3865** Library: top Publish
  opens the form, prefilled summary, sidebar matched, a waiting piece's steps, bar and next `library-publish.yml` run
  (cron `41 */3` UTC: `f-library-check-runs-every-3h-s736`), *Add its public summary* while it waits; a jsdom timer
  guard after a hung shard (`p-setinterval-keeps-jsdom-test-shard-alive-s736`). **#3868** the page's 19 a11y findings;
  re-check passed 01:13Z 2026-11-26, 0 findings.
- **#3867** the Accounting re-point **dry run** (`kb/_acct_repoint_dryrun.py`, `kb/acct_repoint_out/2026-11-26/`): 372
  M-IDs, 907 courses, 1 held, 29 families flagged; Copper Mountain's ACC is ACCESS (DSPS).
- **#3889** the Sign in pane fits a phone; **#3890** a magic link carries `?cpl_return=` and returns to its view in
  another browser.
- **#3893** the lightning round (`commons_subjects.js`): Not a subject, Skip, Save this title, the example course's
  description, the catalog in a bottom bar, How this works folded, Add a training note (`kb_curation` field
  `procedure_note`, key `NOTE:<view>|<time>`; dismissed in `kb/governance_surface_map.json`).
- **#3894** LACCD schedule titles: 171 of 212 untitled codes from the PeopleSoft select-subject lookup (216 subjects,
  term 2268; `f-laccd-schedule-subject-lookup-s736`); 87 differ from the catalog, which stands.
- **#3895** closed (S740's checkpoint fixed the same four census tests on `main`).

## Read in order

1. `docs/reference/lanes/common-subjects-reference.md`, *NEXT (S736)*.
2. `docs/reference/lanes/commons.md`, the lightning round paragraph.
3. `docs/common_subject_code_tab_lessons.md`, S736; `docs/kb-notes/playbook-local-subject-title-sources.md`.
4. `docs/reference/lanes/library.md`, Status.

## Open work, in order (from the lanes' NEXT lines)

1. **Cerro Coso's and Porterville's glued letter** (common-subjects-reference NEXT 1;
   `f-cerro-coso-porterville-letter-glued-to-subject-s736`). COCI stores some Cerro Coso courses as `PHEDC 103`, others
   as `PHED C276`; 26 state-only codes ending in C whose base exists are fake (the list is in the lane; ICC to check),
   and the real ones stay (PSYC MUSC EDUC PHSC SOSC PTEC FRCC EMTC). Porterville the same with P (BIOLP CMRTP ENGLP FIREP
   HLEDP MATHP). Fix in `kb/_build_coci_lookup.py` for those two colleges only, dry run first measuring every consumer
   (about 20 builders; `cpl_coci_course_keys.js` matches MAP articulations), then rebuild the subject family. Sam's
   note on EMTCC asked for it. **Evidence and schedule source:** Cerro Coso's *Long-Term Schedule Effective Fall 2024,
   Active and Inactive Courses* (Sam, 2026-11-27; vault `raw/2026-11-27-cerro-coso-long-term-schedule-fall-2024.md`,
   the PDF with Sam): 459 courses, all SUBJ plus a C-number; 24 of the 26 bases printed (HMSV absent; PHED printed as
   KINS). It lists inactive courses, so it is a second signal for the codes, never a title source beyond them.
2. **A training note that asks COBI to act** (commons NEXT 1): an *Ask COBI to act on this* checkbox (`value.act =
   true`) on the note box in `commons_subjects.js`, and the session-start read in standing item 4.
3. **The builder honors `not_a_subject`** (`kb/subject_decisions.py` lists it refused today), so status counts drop.
4. **LACCD:** 41 codes untitled; offer Sam the 87 schedule titles that differ from the catalog as one list.
5. **The schedule-tool sweep beyond LACCD:** none read. Most untitled: Allan Hancock 77, Glendale 57, Santa Barbara City
   51, Santiago Canyon 39, Santa Monica 36, Canyons 34, Cerro Coso 32, Chabot 32. Reads run on the runners.
6. **The Accounting re-point apply** (handoff 734's item 2): **BLOCKED** on Sam's four `_SUBJ_DISC::ACC/ACCT/ACCTG/ACTG`
   saves under Business (2026-11-24 12:46, a 1,311-row batch): refiled under Accounting, or his say-so. Copper Mountain
   stays college-keyed. On the Subjects run log as a call.
7. **Library:** Sam adds Adult Ed's public summary on the card, then a library-publish run lists it; CPLBrain#870 (the
   page's vault source) needs #3868's a11y edits.
8. **Handoff 734's items 1 and 3 stand:** the 35 held and the 50 under 90 (Sam's picks); the Commons lane NEXT. Item 1a
   was S737's Honors redraw (done, #3870). From 738: score Sam's lightning round once he has worked it, the bad splits
   (`f-bad-code-splits-in-state-list-s737`; item 1 is their Cerro Coso and Porterville part), the reversed
   `PSYCH (PSYCHOLOGY)` label.

Beside the queue: **program-requirements-harvest** is the routine's; **implementation-funding** waits on the team.

## Patterns that worked

- A college's schedule search titles what its catalog leaves blank; a district on one system answers in one read.
- Check a code is real before titling it: a state-only code ending in the campus letter is the fake.

## Safety

- Rule 10: a bulk write is insert-only under a cohort email with a committed receipt; a re-mint follows the playbook.
- Person-settled wins: Sam's Business filings block the Accounting apply until he refiles or says go.
- A session cannot write a Library public field; the summary is his press.

## Let go

The conductor holds no PR subscription, check-in or artifact watch at sign-off; no COBIx watcher.

Spend: not available; 2026-11-26T00:02Z to 2026-11-27T15:30Z.

Opening line: *Greetings, you are SkyCurlew (Session 744), see SkyBrant's handoff — `docs/session_744_handoff.md` — let's keep rolling with our queue.*
