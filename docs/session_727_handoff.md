---
title: "Session 727 handoff (from SkyAvocet, S726, Sam's plain session of 2026-11-25: Gather's saved filters, the adapt gather, Rows and card titles)"
created: 2026-11-25
updated: 2026-11-25
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_738_handoff.md
---

**Routing.** This handoff is for Sam's next plain session. The CPL Queue routine ran as S727 (SkyTropicbird) the same
night and writes `docs/session_728_handoff.md` (PR #3807); a routine firing follows that file, never this one. A plain
session that finds 728 on `main` reads both: 728 for the routine's lanes, this file for the Commons. Take the next
free session number when you start and say so in your handoff.

# You are SkyAvocet's successor (Sam's next plain session)

From SkyAvocet (S726), Sam's plain session of 2026-11-25 (~02:02Z to ~08:40Z). A **full checkpoint**: this run wrote a
Rule 10 data receipt (the adapt gather) and a migration (`gather_filters`). No re-mint, no Roadmap row moved, no tab
joined or left the nav. Skipped: step 2 (no KB structure change), step 3 (README), step 5 (no kb-note crossed the bar),
step 7 (the pipeline did not move: no re-mint, no auditor counts).

## Open with the standing block

1. **COBIx:** Sam said no COBIx check-ins for now. Start `bash scripts/cobix_watch.sh [state dir]` only if he asks.
1a. **Clone light:** `git clone --filter=blob:none` (or `--depth=1` when history is not needed), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head; no dependency-map rebuild inside a PR; no full rerun when the
   input fingerprints match. Never open a PR on a branch that holds another open PR's commits.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes (`r-collection-first-sam-2026-11-20`);
   collection's fixes rank by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
2b. **Before a push, `bash scripts/check_generated.sh` must read all ok.**
3. **Merge order:** this checkpoint PR. The routine's open PRs (#3807, #3810, #3811) are its own; leave them to it.

## What shipped (merged)

- **#3802** Gather's saved filters: `gather_filters` (DR-36; `gather_filter_save()`, `gather_filter_retire()`;
  migration `kb/migrations/2026-11-25_gather_filters.sql`, applied by run 45531305225, grants read back). A
  signed-in reviewer saves a query under a name; the team opens it at `#coci-lookup/gather?f=<slug>`; a reviewer
  changes or retires only their own. **DECIDED** `d-gather-saved-filters-s726`.
- **#3805** Rows on the Courses List (the anchor page, step 2): Common courses or Local courses,
  `#coci-lookup/courses/common`; a common row opens the bar of Local courses, Common subject and History.
  **DECIDED** `d-courses-rows-common-s726`.
- **#3806** The adapt gather, applied at Sam's go (*"Go ahead and move forward without the test"*, then *"Retry it"*):
  34 merges and 133 moves into PEDS M1029, 167 insert-only `merge_into` rows under `gather-adapt-s726@bot`; plan,
  write-time read and rollback in `kb/gather_out/2026-11-25_adapt/`. The next daily run publishes it.
- **#3813** The anchor page, step 3, first slice: each Commons card with a list of its own opens it from its title.

## Sam's words this run

- *"I haven't run the adapt since I'm on my phone now and it wouldn't be easy. Go ahead and move forward without the
  test"*, then *"Retry it"* after a privacy guard stopped the first try (it matched the bot cohort address).

## Read in order

1. `docs/reference/lanes/commons.md`: the Gather sentence (saved filters, the adapt gather APPLIED, ESL measured) and
   the anchor-page NEXT after it (steps 2 and 3 marked LIVE).
2. `docs/commons_lessons.md`, S726 and S725.
3. The anchor-page mock Sam approved: https://claude.ai/artifact/35uJsJ2ahLQ6XcrvfMS8YE.

## Open work, in order (from the lane's NEXT)

1. **Check the adapt gather landed:** after the next daily run, PEDS M1029 holds about 283 local courses at 0 to 4
   units, and the 23 chained identities resolve into it. If a count is off, the rollback is one delete by the cohort.
2. **Step 3, the next slice:** the mock's fold in place: the cards fold into a trail (CPL Commons: all cards / the
   card) above the card's list on the same page.
3. **Step 4:** Needs you as the one ranked queue; every change reaching its counts at once.
4. **Gather, the rest:** the nightly auto combining over saved filters (its confidence score first); the SLOs and
   objectives look-in; the add bars (each a new write surface, Rule 10 a3).
5. Then Subjects, Credit Recommendations, Exhibits on the same pattern; Sam's remaining doubt rulings.
6. **CI, the second half** (S722's item): skip the generator lint steps on a docs-only PR; rebalance the shards.
7. **ESL:** measured, 10 common courses over about 2,439 local courses; the monthly pass after 2026-11-29 stays the work.

## Patterns that worked

- Capture a view's own save plan in jsdom on real data (intercept the POSTs) and write that plan, so a session write
  equals what the page would have saved.
- Read the live table for every key just before a bulk write; insert-only under a cohort email; commit the receipt.
- Mutation-check each new guard.

## Pitfalls

- A receipt commit from `supabase-migrate.yml` starts no `test`: push one real change after it before the merge.
- A guessed PR number subscribes to someone else's PR; read the number from the create result.
- `npm run a11y` did not finish in this container (it stopped after COBI light, all 42 tabs passing); the Common
  courses rows and the card-title links are not measured yet.
- `CLAUDE.md` and `lanes/commons.md` are over their byte budgets (65 KB and 22 KB); compact before adding.

## Let go

At sign-off: no PR watch remains (#3802, #3805, #3806, #3813 merged and unsubscribed; #3807 unsubscribed); every
backup check-in was deleted; no artifact watch; no COBIx watcher.

Spend: not available; 2026-11-25T02:02Z to 2026-11-25T08:40Z.

Opening line: *Greetings, you are SkyCurlew (Session 729), see SkyAvocet's handoff — `docs/session_727_handoff.md` — let's keep rolling with our queue.*
