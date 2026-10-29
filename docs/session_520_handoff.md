---
title: "Session 520 handoff: the CSM team's funding fixes, Sam's eight FAQs, and why Sierra choked"
date: 2026-10-29
session: 519 (SkyCloudberry, Sam's session)
tags: [handoff, funding, faq, sierra, map-custom-reports]
status: current
---

# You are Session 520

Your moniker is **SkyLingonberry**. Session 519 (SkyCloudberry) ran with Sam on 2026-10-29, the day before the 7th
Annual CPL Summit (Friday 2026-10-30). This is a full checkpoint, written at about 140,000 tokens of context left.

## What shipped or is in flight

- **#2559 (merged):** the funding FAQ in six groups, and Sierra reading it. Its one red shard was a test that counted the
  FAQ's new group headings as page sub-headings. Sierra was deployed (cpl-chat v102), and Sam's test question got
  the FAQ's answer with its link.
- **#2560 (open, CI re-running on the test fixes):** the CSM team's eight fixes and all eight of Sam's FAQs.
  - Statewide and district sums add what the rows show, gray included (`curFig`).
  - *Funds Qualified So Far* replaces *Curr* everywhere in prose; the CSV headers have no comma.
  - The public Sources line names the $1,000 rounding.
  - Short names: Cañada, Mt. San Antonio, Coalinga, Norco, Imperial Valley, Reedley.
  - DataMart's FTES link points at `/Students/`, and the search box has a *Clear* word.
  - The FAQ is 45 questions in eight groups (Reporting in NOVA, Apprenticeship CPL).
  - Sierra's FAQ rule says a college qualifies for funding, never earns it, and her matcher treats "offer" as generic.
- **#2561 (open):** Sierra answers with what loaded when the knowledge search times out (`SEARCH_FAILED_NOTE`), and the
  MAP Custom Report load moves to 04:57 UTC, 9:57 PM Pacific (Sam: *"Maybe 10P PDT"*).
- **#2562 (open):** the College Identity tab's *names resolve to no identity* link scrolls in place. It had left for the
  COBI dashboard, because COBI routes on the `#`.
- **CPLBrain#540 (merged):** Open Asks Sheet 140, ruled; its card 4 carries to Sheet 141.

## Open work, in order

1. **Land #2560, #2561, #2562** on a green `test` (squash). Each was red only on its own renames, and each fix is pushed.
   Then:
   - Apply `kb/receipts/cpl_funding_config_funds_qualified_so_far_2026-10-29_s519.sql` after a fresh live read of
     the three passages. It is guarded on each before-value; zero rows means Sam edited one, so re-read and redo.
   - Dispatch `cpl-chat-deploy.yml` once (`DEPLOY`, `cpl-chat`) for both Sierra changes.
   - Read the public funding page back: the headers, Statewide no longer $0, Cañada, the Clear word.
2. **Sam's calls, waiting:**
   - (a) **Sheet 141 card 4**, an address without github.io. The builder emits it under `2026-10-29-open-asks-141`;
     publish it at the next checkpoint that has another card, or when he asks.
   - (b) **A college short-name editor in the College Identity tab.** S519 advised it: a small table keyed by
     `college_id`, Rename for reviewers, the funding page reading it first with `display` as the fallback, and a
     governance-map entry. It waits on his go and on who may edit.
   - (c) Whether he paused the MAP Custom Report workflow for the Summit. He asked how; the steps are a one-click
     Disable on the workflow's Actions page.
3. **Sierra's slow reads:** `search_college_programs` (mean about 2 s, peak 7.8 s) and
   `credential_alignment_for_college` (about 2 s). A cut request keeps running in Postgres until the 8 s statement
   timeout, so consecutive questions stack load. EXPLAIN them and index or narrow them.
4. **Sam's ask for later: faster CI shards.** *"our shard tests always take a long time when they get to this point"*
   (the heavy funding suites; `cpl_funding_render` in his screenshot). Each boots the 18,000-line funding module in
   jsdom and repaints it many times. Options: balance the shards by measured time (`tests/lib/shard.js` keeps a
   table), split the slowest files, or share one boot across a file's blocks.
5. **The deploy smoke's model checks** have failed a different assertion on each of the last three deploys (10-27
   7q, 10-28 7v COCI, 10-29 7v CompTIA). Each time the deploy itself passed. Decide whether those checks gate or report.
6. Carryover: Sam's first real deck through the new remediation (`slide-script-draft`); Glendale's course units
   (harvest NEXT); the Library NEXT; handoff 509's small asks; the MAP-link sweep.

## Sam's decisions this run (all in `cpl_memory`, verified by him)

`sam-expend-deadline-dec-2028-and-eight-faqs-2026-10-29` (the deadline to expend funding is Dec 2028; his eight
FAQs), `sam-sheet-140-rulings-2026-10-29` (NOVA reporting is the 2025-2026 funding's; the new funding reports on the
Dashboard and migrates to NOVA; Unit sources stays internal; the address waits),
`sam-map-load-10pm-pacific-2026-10-29` (the load moves to the evening).

## Read first

`docs/cpl_funding_lessons.md` (*S519*), `docs/cpl_assistant_lessons.md` (*S519*),
`docs/kb-notes/methodology-a-cron-runs-when-github-gets-to-it.md`, `docs/reference/lanes/implementation-funding.md`.

## Lessons to honor

- **A display rename breaks every test that finds a row by its text.** Find a row by `data-id`, which holds the join
  key.
- **A CSV header may not carry a comma**; the suites split on it.
- **A local funding suite takes minutes, and four at once on four cores take longer.** Run only the suites a change
  touches, then let CI's shards decide.
- **`check_generated.sh` piped to `tail` hides its exit code.** Read the status itself, and rebuild the dependency
  map after any edit to `index.ts`.
- **Every read cut at 5 s together means the database, not the question.** Check what else was running.

## Let go

This session holds the subscriptions on #2560, #2561 and #2562, and the check-in `trig_01GGyfNDwsDLjaLU9jm6bBqy`
(20:11Z). S518's check-in `trig_01E7YKrgidHV1eipzKmPCck3` was for #2559, which has merged. Drop them all at sign-off
once the three PRs merge.
