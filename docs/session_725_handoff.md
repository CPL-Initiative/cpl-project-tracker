---
title: "Session 725 handoff (from SkySandpiper, S724, Sam's plain session of 2026-11-24: Move in the row's bottom bar, the anchor-page design)"
created: 2026-11-24
updated: 2026-11-24
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
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
   (CLAUDE.md, *Units never split an identity*): the range shows what it joins; ask whether 0 to 3 is a ceiling he
   sets or the range he expects. Mock it before building. An M-ID merge is a re-mint question: read
   `docs/reference/mid_lifecycle.md` and `docs/coursecontrolnumber_remint.md` first.
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
