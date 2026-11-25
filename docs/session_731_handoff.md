---
title: "Session 731 handoff (from SkyDunlin, S730, Sam's plain session of 2026-11-25: Needs you folds to its card, the doubt count live, the fold measured, the stray codes, and the subject titles of 103 colleges read by runners)"
created: 2026-11-25
updated: 2026-11-25
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is for Sam's next plain session. Handoff 728 is the CPL Queue routine's (S727, merged as
#3807); a routine firing follows that file, never this one. The routine's S731 (SkyFrigatebird) took the number 731
and wrote handoff 732 for the routine. A plain session follows this file: take the next free session number when you
start (733 or above) and say so in your handoff; the moniker below stays yours.

# You are SkyGodwit, Sam's next plain session

From SkyDunlin (S730), Sam's plain session of 2026-11-25 (~10:52Z to ~15:10Z). A **light checkpoint**, refreshed after
Sam came back: the commons and common-subjects lanes moved inside their PRs, and four `cpl_memory` rows were written; no Roadmap row moved, no re-mint or Rule 10 data write,
no tab joined or left the nav. Skipped: step 2 (no KB structure change), step 3 (README), step 5 (no kb-note crossed the
bar), step 7 (the pipeline did not move).

## Open with the standing block

1. **COBIx:** Sam said no COBIx check-ins for now. Start `bash scripts/cobix_watch.sh [state dir]` only if he asks.
1a. **Clone light:** `git clone --filter=blob:none` (or `--depth=1` when history is not needed), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head; no dependency-map rebuild inside a PR; no full rerun when the
   input fingerprints match. Never open a PR on a branch that holds another open PR's commits.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes (`r-collection-first-sam-2026-11-20`);
   collection's fixes rank by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
2b. **Before a push, `bash scripts/check_generated.sh` must read all ok.**
3. **Merge order:** nothing open of this line's (#3831 carried the title hunt and this refresh). Dependabot's #3383 stays.

## What shipped

- **#3824** (squash `d012b203`): the anchor page, step 4, first slice. A Needs you link folds the page to the card
  holding its item (`#commons/card/<key>`), the item's link focused and highlighted (Sam's S723 ruling kept). The Common
  subject in doubt count reads the Courses List's saved rulings live (`doubtLive`, `kb_curation`
  `ccr_procedure_request`, read-only, Range-paged): a ruled card leaves Needs you, the Courses and M-IDs card and
  Rulings to find at once; "unsure" stays; only the doubt file's cards count. **DECIDED**
  `d-needs-you-folds-and-doubt-live-s730` (yours to revise). Guard `tests/commons_needs_you_queue.test.js` (11,
  mutation-checked). Full `npm test` passed locally.
- **#3826** (squash `d077c4ff`): queue item 7. `npm run a11y` found the fold's headings skipped h1 to h3 (the trail's
  first link is now the folded view's h2), the card title links at 22px (now 24px), and at phone width a wrapped quick
  link's bullet sat on its second line (now its first). New a11y targets `commons-fold`, `commons-fold-dark`; they and
  `commons-front-open` pass at 390 and 1280. A 390px screenshot of the fold read clean.

- **#3831**: Sam's two rulings and the title hunt. Sam ruled 11 Kinesiology doubt cards (the count reads 0) and asked
  about the List's *On a stray identity code* filter: 88 M-ID codes (251 M-IDs, 247 local courses) are neither a common
  subject nor an umbrella code; they were minted on local codes where the discipline was blank. **RULED**
  `r-no-mid-on-a-stray-code-sam-2026-11-25` (*"i should have never minted those 88 codes and left the courses in a
  holding pen"*). Scoring their local subjects found that only 35 of the 247 courses have a local subject title
  collected (19 colleges read statewide), and that one code can mean two subjects at two colleges (Glendale's AT is
  Flight Attendant; the statewide filing says Automotive). Sam asked for the untitled codes as a list for COBIx:
  `kb/subject_title_hunt/20261125_local_subject_codes_without_titles.csv`, 8,786 college and code pairs, tiered (1: the
  stray codes' 101; 2: 164 with holding-pen courses and a common subject under 0.9), each with a recommended title at
  the recommender's measured confidence and blank columns for the title and its source. **PROCEDURE**
  `p-subject-title-carries-its-source-sam-2026-11-25`: every collected title records its source URL, where, method,
  date and finder; only a catalog heading or prefix legend settles it. Sam has the COBIx instructions to paste.

- **#3832** (squash `128102a6`): Sam's go, *"start with the 68 colleges"*, then the rest. Nine workers read each
  catalog's subject index on runners (`kb/subject_title_hunt/colleges.json`, `found/`, plans
  `kb/college_reads/subject_index_*.json`). `kb/_file_found_subject_titles.py` files them straight into
  `kb/hand_filed_catalogs/subjects/` with each title's source, where, method, date and finder; the Subjects build
  lists a college by its headings alone (`headings_only`). The record went from 19 colleges and 1,655 named codes to
  103 and 8,147. A department label, a heading borrowed from another code, or a code under two headings is never filed.
  The CSV is now the leftovers, `kb/subject_title_hunt/20261125_local_subject_codes_without_titles_2.csv`: 2,500 pairs,
  each with `why_no_title`; Sam has the message for COBIx. **RULED** `r-collect-curate-connect-grow-automatic-sam-2026-11-25`
  (*"we want our collect, curate, and connect procedures to be increasingly automatic"*).

## Read in order

1. `docs/reference/lanes/commons.md`: the anchor-page build (steps 2 to 4) inside the S723 to S726 pointer.
2. `docs/commons_lessons.md`, S730 and S729.
3. The anchor-page mock Sam approved: https://claude.ai/artifact/35uJsJ2ahLQ6XcrvfMS8YE.

## Open work, in order

0. **The stray codes (common-subjects-reference lane):** the titles are in. Rescore the 88 stray codes' local subjects
   with the title leading (the statewide codes and recommender already read them after the nightly build), then the
   dry-run re-mint that sends their 247 courses back to Needs an M-ID under their common subject, for Sam to see
   before it applies (`r-no-mid-on-a-stray-code-sam-2026-11-25`). When COBIx's PRs with leftover titles land, write
   each as a found file and run `python3 kb/_file_found_subject_titles.py`, then the subject family in order
   (`scripts/check_generated.sh` names it).

From the commons lane's NEXT:


1. **Step 4, the rest:** the other Needs you items whose counts still wait for the nightly build. Catalogs, outlines,
   held titles, held subject codes and decisions already move at once; check each remaining item against its list's own
   save before adding a read.
2. **Step 3, the rest:** mount the Courses data list under the trail if a cheap mount path appears (the list must render
   into a given container); else leave the link.
3. **Gather, the rest:** the nightly auto combining over saved filters (its confidence score first); the SLOs and
   objectives look-in; the add bars (each a new write surface, Rule 10 a3).
4. Subjects, Credit Recommendations, Exhibits on the same pattern; Sam's remaining doubt rulings (11 cards in
   `kb/ccr_doubt.json`, Kinesiology).
5. **CI, the second half:** skip the generator lint steps on a docs-only PR; rebalance the shards.
6. **ESL:** 10 common courses over about 2,439 local courses; the monthly pass after 2026-11-29 is the work.

Beside the queue, on other lines of sessions: **program-requirements-harvest** is the CPL Queue routine's (its NEXT,
handoff 728); **common-subjects-reference** carries its own NEXT beside item 0 (ECONMT and Electricity's adult-education
codes, Sam's refile in Local subjects; the re-point of folded local codes); **implementation-funding** waits on the team
(`coordPartMissing` after Coalinga, Lake Tahoe and West Valley are confirmed).

## Patterns that worked

- Read a count live by the same test its own list applies, and subtract only from the file's own list, so a carried
  save never comes off twice.
- Measure with `npm run a11y` through a temporary config that requires `a11y.config.js` and keeps only the targets you
  touched (`targets` is the key); `--shots <dir>` writes the screenshots.
- `pr-gate` agent for the merge check: five lines, no thread dump.

## Pitfalls

- **Read the PR number from the create result before you subscribe.** S730 sent both calls in one batch and subscribed to
  #3825, someone else's; it then unsubscribed. The handoff before warned of this.
- Never mutation-check while a background suite reads the same file.
- `git checkout -B <branch> origin/main` right after a merge needs a fresh `git fetch`, or it lands on the old main.
- A worker's plan in a commit re-reads the college on push: commit plans before the data, in their own commit.
- Copper Mountain's registry `catalog_url` answers 404 (the found file names the current PDF); the registry needs it.
- A statewide subject filing is keyed on the letters alone; check a college's own titles before applying one.
- The state list's M-ID column dates from July: count Needs an M-ID through `unified_courses_members.js` and
  `kb/coci_not_applicable.json`, as the List does (1,819).
- `cpl_memory.summary` has a length check; keep a summary under about 400 characters.
- `CLAUDE.md` is over its budget (65 KB of 60 KB); `lanes/commons.md` is at 19.9 KB of 20 KB: compact before adding.

## Safety

- Rule 10: bulk writes insert-only under a cohort email, with a committed receipt.
- Person-settled wins: a save in the Commons is terminal.

## Let go

At sign-off: no PR watch remains (#3824, #3826, #3828 and #3831 and #3832 merged and unsubscribed; nine workers done; #3825 unsubscribed); no check-ins; no
artifact watch; no COBIx watcher.

Spend: not available; 2026-11-25T10:52Z to 2026-11-25T15:10Z.

Opening line: *Greetings, you are SkyGodwit (Session 733), see SkyDunlin's handoff — `docs/session_731_handoff.md` — let's keep rolling with our queue.*
