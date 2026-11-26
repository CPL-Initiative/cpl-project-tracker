---
title: "Session 726 handoff (from SkyPlover, S725, Sam's plain session of 2026-11-25: Gather, the first slice)"
created: 2026-11-25
updated: 2026-11-25
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_738_handoff.md
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows the routine's own newest
handoff, never this file. If 726 is taken when you start, take the next free number and say so in your handoff.

# You are SkyAvocet (Session 726)

From SkyPlover (S725), Sam's plain session of 2026-11-25 (~00:03Z to ~01:45Z). A **light checkpoint**: no Rule 10 data
write, no re-mint, no Roadmap row moved, no tab joined or left the nav (Gather is a view inside Courses and Programs).
Skipped: step 2 (no KB structure change), step 3 (README), step 5 (no kb-note crossed the bar), step 7 (the pipeline did
not move). Status files refreshed: `program-requirements.json` and `course.json`.

## Open with the standing block

1. **COBIx:** Sam said no COBIx check-ins for now. Start `bash scripts/cobix_watch.sh [state dir]` only if he asks.
1a. **Clone light:** `git clone --filter=blob:none` (or `--depth=1` when history is not needed), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head; no dependency-map rebuild inside a PR; no full rerun when the
   input fingerprints match. Never open a PR on a branch that holds another open PR's commits.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes (`r-collection-first-sam-2026-11-20`);
   collection's fixes rank by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
2b. **Before a push, `bash scripts/check_generated.sh` must read all ok.**
3. **Merge order:** this checkpoint PR. No other PR of this session is open.

## What shipped (merged)

- **#3799** Gather, the first slice: `commons_gather.js`, the **Gather** view of Courses and Programs,
  `#coci-lookup/gather?w=&in=&cs=&ls=&to=`. Words (space = all, comma or *or* = either, minus = leave out, quotes = a
  phrase, a word matches a word's start); Look in Title or Description; ticks from the target's common subject and the
  local subjects that carry it (TOP never ticks); insert-only `kb_curation` `merge_into` rows (`<M-ID>` and
  `CN:<control>`), standing rows left alone, a title rename, Take it back; the saved decisions a merge ends. Real data:
  `adapt` into PEDS M1029 lists 55 common courses (35 ticked) and 254 local courses (133 ticked).
  **DECIDED** `d-gather-first-slice-s725`.

## Read in order

1. `docs/reference/lanes/commons.md`, the *LIVE (S725): Gather* sentence and the anchor-page NEXT after it.
2. `docs/commons_lessons.md`, S725 and S724.
3. The Gather mock (seven versions): https://claude.ai/artifact/PzL4Kf7oV49BGaYwF5gh1T; the anchor-page mock Sam
   approved: https://claude.ai/artifact/35uJsJ2ahLQ6XcrvfMS8YE.

## Open work, in order

0. **The adapt gather is Sam's to run.** Ask him once, in one line, whether he ran it; if he wants it run for him, the
   session's choice is the starting ticks, saved under a cohort email with a committed receipt (Rule 10).
1. **Gather, the rest** (each a new write surface: map it in `kb/governance_surface_map.json` and give it a rollback
   receipt before it ships, Rule 10 a3): **saved filters** (named, shared, opened from their own address; Sam: *"might
   come in handy for auto combining"*: a nightly run gathers new matches above a confidence score); the **SLOs and
   objectives** look-in (needs a bulk outcome read; 28 MB in `course_outcomes`); the **add bars** (a description,
   outcomes, or a link alone that the nightly collection reads; a blocked site shows on the course).
2. **ESL with Gather:** Sam, *"els will be a similar case of big mid consolidation into just a few"*; read
   `docs/reference/lanes/esl-packaging.md` (comprehensives and carve-outs) before designing the variables.
3. **The anchor-page build, step 2:** the Common courses / Local courses toggle on the Courses List.
4. **Step 3:** the Commons page as home base; a card's title folds the cards into that card's list with its tabs.
5. **Step 4:** Needs you as the one ranked queue; every change reaches its counts at once.
6. Then Subjects, Credit Recommendations, Exhibits on the same pattern; Sam's remaining doubt rulings.
7. **CI, the second half** (S722's item): skip the generator lint steps on a docs-only PR; rebalance the four shards.
8. **Waiting, by lane:** `common-subjects-reference`, `implementation-funding` (the other session's), `cer-procedures`,
   `my-college-action-page`, `program-requirements-harvest`.

## Patterns that worked

- Build on the approved mock's shape; carry its real-data counts into the test as the browser check.
- Mutation-check each new guard (turn it off; the test must fail).
- Before adding a view, grep the tests for the old view row.

## Pitfalls

- `kb_curation_no_anon_email` scans source: add `reviewer_email` to a select only beside a token.
- `--gold-soft` exists only in dark mode; there is no light tint token.
- At 390px the Courses and Programs tab is 423px wide (the shell, Gather or not); `npm run a11y` has not run on Gather.
- `CLAUDE.md` stays over its 60,000-byte budget.

## Let go

At sign-off: no PR watch remains (#3799 merged, unsubscribed); the backup check-in was deleted; no artifact watch was
opened this run; no COBIx watcher.

Spend: not available; 2026-11-25T00:03Z to 2026-11-25T01:45Z.

Opening line: *Greetings, you are SkyAvocet (Session 726), see SkyPlover's handoff — `docs/session_726_handoff.md` — let's keep rolling with our queue.*
