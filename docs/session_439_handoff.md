---
title: "Session 439 handoff: the Annual Goals table reworked and live, Grok parked on the district card, the Course Progress view next"
date: 2026-10-20
session: 438 (SkySumac)
tags: [handoff, workplan-goals, annual-goals, second-reader, commons]
status: current
---

# You are Session 439

Your moniker is **SkySaltbush**. Session 438 (**SkySumac**, `session_0157us6t7hAvuTvG27uYwqbb`) was opened by Sam with
handoff 438's line and two asks of his own. If the routine started you, follow `docs/reference/scheduled_sessions.md`
first.

## Sam's words this run (decisions, recorded with who and when)

- **~14:40Z, the Annual Goals tab:** drop the Total column (*"most of the annual goals are cumulative, so the total
  column mis-states the 2030 target"*), center the numbers, *"auto collapse everything under the first row title of
  the activity, which will make the 3 rows single height as a default"*, delete the blue cell outline on the goal rows,
  add links to the Activity cards. ~15:00Z: *"the thin blue outlines look like someone didn't finish the
  formatting."* `cpl_memory` `sam-annual-goals-no-total-fold-gray-2026-10-20`.
- **~16:30Z, Grok:** *"I guess I'll have another delay on the Grok key since we have to pay for that separately from
  the grok account--need to get the account moved to the RCCD District credit card which will take some time."*
  `cpl_memory` `sam-grok-api-billing-district-card-2026-10-20`.
- **Usage:** extra usage is on, so sessions run past the weekly limit; nothing for a session to do about it.

## What shipped

- **#2291, merged, live after dashboard run 619 (16:08Z) and Pages 16:11Z:** the Annual Workplan Goals table without
  its Total column; values and year headers centered; each name cell is the title, then "Details" (opens a panel
  printed hidden: description, counting lines, chips, an editor's Move and Table) and "Activity card"
  (`#activities-projects/card-<id>`); each Activity header has "Activity cards" (`#activities-projects/activity-<N>`);
  "Show all details" in the head row; no cobalt rule or dashed hover outline in the table. `card_actions.js` lands a
  link: opens the folded section, clears a filter hiding the card, scrolls it clear of the sticky actions bar, focuses
  and marks it. Lane `workplan-annual-goals.md`, lessons S438.
- **Grok, steps given to Sam:** console.x.ai API key (billed apart from the subscription), then `XAI_API_KEY` and
  `XAI_MODEL` as Edge Function secrets. The live `program-requirements-extract` is Supabase version 10 of 2026-10-15,
  before #2246's provider switch: deploy it only once the key exists, then `second-reader.yml` for Cañada College.
- Handoff 438's items 2 and 3 closed: #2289 and CPLBrain#411 were merged; S437's acceptance measurement is in its
  vault note (77.4% of 208 answered cards matched the recommendation, 91.8% since Oct 9).

## Priority

0. **First, three `cpl_memory` rows S438 could not write** (three `execute_sql` timeouts, nothing landed): run
   `kb/receipts/cpl_memory_s438_unwritten_2026-10-20.sql` as one call, read its verify line, and delete this item.
   The slugs named above are in that file.
1. **The CLAUDE.md pass (Sam, 2026-10-20 ~17:15Z: "yes" to S438's proposal).** Tag every rule in the tracker's
   CLAUDE.md keep, update or pull, each with its evidence: stale capability limits (S438 found two: other sessions
   are visible, and the context meter's 786k ceiling against a 1M window), ritual weight (propose a light checkpoint
   for small sessions: handoff, lane, memory rows, status file; the full 13 on a lane state change), and what waits on
   Sam (the auto-mark rule). Change nothing in CLAUDE.md on your own: put the proposed edits on one short sheet and
   apply them on his answers. Keep the PUSH rules (naming, funding vocabulary, data safety, Rules 4 and 5).
2. **The Course Progress view** (Commons lane NEXT): the fourth host of `commons_progress.js`, inside SkyView
   (`prototype/skyview.html`, built by `build_ccr_atlas.py`; a Views-menu entry), its pair from the Commons Course row
   (3,204 of 27,581 cards the auditor scores 0.85 or better), its definition of complete on a card for Sam. Model it on
   `cr_progress.js` and `tests/cr_progress.test.js`; add `a11y.config.js` targets.
3. **The auto-mark rule still waits on Sam's word.** Asked in chat ~15:20Z, unanswered at sign-off. Do not commit it
   without "commit the auto-mark rule". If he has not answered, put it on the standing sheet as a card (Sheet 109;
   `CPLBrain/decision-sheets/decision_sheets.md`), with the six GitHub tools it names.
4. **Grok:** nothing until Sam says the key is in.
5. Small: `kb/_test_activity_card_current.py` (a stale 3.1.2a fixture, as S426 found in the hybrid test) and
   `tests/workplan_description_drafts_test.py` fail on main; CI runs neither. Annual Goals lane NEXT 0a, 0c, 0d.

## Patterns that worked

- Two screenshots, signed out and signed in, named the blue lines before any code changed.
- A preview page from the committed snapshots (`kb/workplan_goals_snapshot.json`, `kb/projects_snapshot.json`)
  through the new renderer, swapped into `index.html` for `npm run a11y` and restored with `git checkout`.
- Clicking a link in Chromium found two faults no test saw: a centered tall card hid its name, and the sticky bar
  covered the top.

## Lessons to honor

- Grep every test for a selector you remove before the first push: three tests pinned the Total cell, and CI's
  shard 2 found the third.
- The full `npm test` does not finish locally in 15 minutes; run the changed tests, then let CI's four shards run.
- **The context meter is stale:** `kb/_context_budget.py` divides by 786,077, while the app's Context panel shows a 1M
  window with auto-compact about 40k short of it. Its warnings come early; the panel is the authority.
- `cpl_memory` writes timed out three times (60s each, nothing reached the database; reads worked): stage them in a
  receipt, as the playbook says, rather than retrying.

## The side session beside S438 (Funding tab, `session_01DyFzLDqybndyR7vXBDAuGQ`, no number taken)

**Sam's words, ~16:49Z** (verbatim in `docs/cpl_funding_lessons.md`; `cpl_memory`
`sam-funding-view-first-my-institution-2026-10-20`, verified): the view first (*All Institutions* or *My
Institution*, the hover saying an institution is a college or a district); under My Institution, require a college or
district; the Funding outcomes numbers follow the chosen institution.

**Shipped, #2293 merged:** Step 1 is the view, Step 2 the chooser (under My Institution only); the explainer's outcome
cards show the chosen college's or district's own target and progress (`scopeProgress()` over `addInstPrios()`, the
step `earnAgg()` sums statewide). Guards `cpl_funding_step_two_view`, `cpl_funding_outcomes_follow_institution`.
Lane `implementation-funding` and the funding lessons updated (both compacted under budget). UI pass: `privacy`,
clean, nothing to fix (ledger recorded).

**Nothing open from it.** If Sam asks for more on the outcome cards, the other sections of the explainer (boxes, worked
examples) are still statewide by design; only Funding outcomes follows the institution.

**Lesson:** renaming rendered text, grep every test for the old words before the push (a sixth suite pinned
*All institutions* and turned CI red once).

## Not refreshed

The UI pass (the ledger keeps its view due), the Pipeline tab (nothing moved), `kb/README.md`, `README.md`, no KB note,
`kb/status/course.json` and the other run logs (no reference touched).

## Let go

S438 holds no PR subscription (#2291 merged), no artifact watch, and its one check-in fired. The side session holds none either (#2293 merged, unsubscribed). The CPL Queue routine
fires next at 05:12Z on 2026-10-21.
