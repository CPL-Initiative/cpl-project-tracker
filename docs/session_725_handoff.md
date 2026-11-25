---
title: "Session 725 handoff (from SkySandpiper, S724, Sam's plain session of 2026-11-24: Move in the row's bottom bar, the anchor-page design)"
created: 2026-11-24
updated: 2026-11-24
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_726_handoff.md
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows the routine's own newest
handoff, never this file. If 725 is taken when you start, take the next free number and say so in your handoff.

# You are SkyPlover (Session 725)

From SkySandpiper (S724), Sam's plain session of 2026-11-24 (~20:55Z to ~23:45Z). A **full checkpoint**: one Rule 10
data write (KIN 38A), no Roadmap row moved, no tab joined or left. Skipped: step 2 (no KB structure change), step 3 (the
Courses List changed inside its tab only), step 5 (no kb-note crossed the bar), step 7 (the pipeline did not move).

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

## What shipped (all merged)

- **#3790** a *why in doubt* line on each band; Cabrillo KIN 38A from KINE M1267 to KINE M1344 *Yoga, Beginning*
  (cohort `commons-s724@bot`, receipt `kb/receipts/commons_kine_m1267_kin38a_move_2026-11-24_s724.sql`).
- **#3792** *Blocked on COBI*, never Sky, on the Exhibits queue.
- **#3793** a box on each band ticks its courses; Move picks a common subject (its MQ list and provision from
  `kb/status/mq_view.json`) then a common course from a table with descriptions, units and local courses.
- **#3794, #3796** CLAUDE.md: sidebar for narrow work, bottom bar for wide work, one anchor page per Commons card;
  bottom-bar tabs act as well as inform.
- **#3797** the Courses List's selected course opens a **bottom bar of tabs** (`panel.below`, `panel.tabs`/`panel.tab`
  in `commons_list.js`): Course, Move, Its common course, Catalog, History; every panel table sorts, filters, resizes.

## Sam's words this run

All verbatim in `docs/commons_lessons.md`, S724. **RULED:** `r-sidebar-narrow-bottom-bar-wide-sam-2026-11-24`,
`r-bottom-bar-tabs-act-and-inform-sam-2026-11-24`, `r-lists-sort-resize-filter-act-on-row-sam-2026-11-24`.
**Wishlist:** `w-anchor-page-per-commons-card-sam-2026-11-24`. **DECIDED:** `d-kin38a-to-yoga-beginning-s724`.

## Read in order

1. `docs/reference/lanes/commons.md`, the *LIVE (S723 to S724)* paragraph and its NEXT.
2. `docs/commons_lessons.md`, S724.
3. The approved mock: https://claude.ai/artifact/35uJsJ2ahLQ6XcrvfMS8YE (the Commons as home base).

## Open work, in order

0. **Sam's ask at the checkpoint (answer it first):** *"move all the mids with adapt in the title to one mid: Adaptive
   Physical Education and set the units to 0-3"*, then find every local course with *adapt* in its title, in another
   M-ID or none, *"do a quick view to uncheck any that don't belong"*, and move them all into that one M-ID. It fits
   step 2: the **Common courses** row grain with a box on each row, a **Gather** tab (search the whole list by title
   words, tick, uncheck, move into one M-ID), and a merge of common courses into one. Units follow the members
   (CLAUDE.md, *Units never split an identity*); Sam: *"a range i expect them to show, not a limit"*. **Mocked on real
   data:** https://claude.ai/artifact/PzL4Kf7oV49BGaYwF5gh1T (target PEDS M1029; 56 common courses, 40 ticked; 203
   loose local courses, 148 ticked; each unticked row says why). **Decided:** a merge is one `merge_into` row per
   merged M-ID, the save `kb/_apply_curation.py` already folds; no re-mint, no alias map (Sam: *"we're still in the
   building phase and don't need to keep an audit trail on mids yet"*); Gather lists saved decisions it would end.
   Sam's direction (`v-mid-decisions-automatic-and-fluid-sam-2026-11-24`): as SLO and objective data fill in, M-ID
   decisions grow automatic from confidence scores; keep consolidation low impact and fluid. Gather's starting ticks
   should come from those scores, title words being the first signal.
   Sam on version 2: *"gather looks good as long as we can reuse this gather for other cases by changing variables
   (common and local subjects, keywords, etc."*. Build it as one tool: words (space = all, comma or *or* = either,
   minus = leave out, quotes = a phrase; a word matches its start), the common subject, the local subject codes, the
   target, each in the view's address so a gather can be linked and rerun.
   Sam then asked *"can we have the option to save a word filter we like?"* (mock v3): **Saved filters**, named, each
   holding its words, common subject and local subjects, saved under the reviewer's name for the whole team and opened
   from its own address. A deliberate save, so it sits outside *Tabs never remember a filter*. Storing it is a new
   field on a shared table: map it in `kb/governance_surface_map.json` before it ships (Rule 10 a3).
   Sam: *"the saved filters might come in handy for auto combining"*: a saved filter can run nightly, gathering new
   matches that clear a confidence score and listing the rest for review (the same low-impact saves, each undoable).
   Sam: *"could the filter look in either the title or description or both on a toggle?"* (mock v4): a *Look in*
   toggle, saved with the filter; each row shows its description in small type. Then (mock v5): *"integrate in the
   slos and objective on the course rows with a show slos and objectives link to expand"*, the toggle searching them
   too (Title, Description, SLOs and objectives, All three); and *"if there are no slos or objectives, the link could
   say that and offer another bottom bar to drop them in manually"*: *Add them* opens a bar to paste SLOs and
   objectives with their source. A manual save to `course_outcomes` is a new write surface: governance map and a
   rollback receipt first (Rule 10 a3). Only 14 of the 203 loose adapt courses carry outcomes today.
   Sam (mock v6): *"for courses with no description add the smae note and link with paste bar"*: *Add it* opens the
   same kind of bar to paste a catalog description with its source.
   Sam: *"will need a link bar for those as well, so our procedure can refresh later via the link (assuming it isn't
   blocked to the runner)"* (mock v7): a link alone is enough; it registers the page for the nightly collection to
   read and refresh, and a blocked site shows on the course (see `docs/reference/blocked_sources.md`).
   Sam then: *"els will be a similar case of big mid consolidation into just a few"*: build Gather for both; read
   `docs/reference/lanes/esl-packaging.md` (the comprehensives and carve-outs) before designing it.
1. **The anchor-page build, step 2:** the Common courses / Local courses toggle on the Courses List.
2. **Step 3:** the Commons page as home base; a card's title folds the cards into that card's list with its tabs.
3. **Step 4:** Needs you as the one ranked queue; every change reaches its counts at once.
4. Then Subjects, Credit Recommendations, Exhibits, each onto the same pattern.
5. Sam's remaining Common subject in doubt rulings; common and local subject labels in the other tabs at their UI pass.
6. **CI, the second half** (S722's item): skip the generator lint steps on a docs-only PR; rebalance the four shards.
7. **Waiting, by lane:** `common-subjects-reference`, `implementation-funding` (the other session's), `cer-procedures`,
   `my-college-action-page`, `program-requirements-harvest`.

## Patterns that worked

- Mock first, one reaction per version; build only the approved shape.
- Mutation-check a new guard (turn the feature off; the test must fail).
- Rerun every test that loads `commons_list.js` after an engine change.

## Pitfalls

- A CLAUDE.md rule's wording can satisfy another rule's guard; run `tests/docs_audit_test.py` before pushing.
- `CLAUDE.md` stays over its 60,000-byte budget (about 65 KB).
- Not browser-verified this run, and `npm run a11y` did not run on the bottom bar.

## Let go

At sign-off: no PR watch remains; no check-ins; the mock artifacts' comment watches came with publishing
(https://claude.ai/artifact/FUG6rrpDdHhcJzW3UCXnR5, Qds36mo7ovNCy4zR8gV1Cz, MQyz6m26hn5K1Udc43uuux,
35uJsJ2ahLQ6XcrvfMS8YE); no COBIx watcher.

Spend: not available; 2026-11-24T20:55Z to 2026-11-24T23:45Z.

Opening line: *Greetings, you are SkyPlover (Session 725), see SkySandpiper's handoff — `docs/session_725_handoff.md` — let's keep rolling with our queue.*
