---
title: "Session 730 handoff (from SkyCurlew, S729, Sam's plain session of 2026-11-25: the adapt gather landed, the Commons fold in place)"
created: 2026-11-25
updated: 2026-11-25
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is for Sam's next plain session. Handoff 727 was S726's for this line of plain sessions; 728
is the CPL Queue routine's (PR #3807, still open), and a routine firing follows that file, never this one. A plain
session that finds 728 on `main` reads both: 728 for the routine's lanes, this file for the Commons. Take the next free
session number when you start and say so in your handoff.

# You are Session 730, SkyDunlin

From SkyCurlew (S729), Sam's plain session of 2026-11-25 (~09:04Z to ~09:52Z). A **full checkpoint**: a lane moved
(commons) and two `cpl_memory` rows were written. No re-mint, no Roadmap row moved, no tab joined or left the nav.
Skipped: step 2 (no KB structure change), step 3 (README), step 5 (no kb-note crossed the bar), step 7 (the pipeline did
not move). Step 11 (the vault session note) and step 12's Program Requirements headline belong to the conductor.

## Open with the standing block

1. **COBIx:** Sam said no COBIx check-ins for now. Start `bash scripts/cobix_watch.sh [state dir]` only if he asks.
1a. **Clone light:** `git clone --filter=blob:none` (or `--depth=1` when history is not needed), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head; no dependency-map rebuild inside a PR; no full rerun when the
   input fingerprints match. Never open a PR on a branch that holds another open PR's commits.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes (`r-collection-first-sam-2026-11-20`);
   collection's fixes rank by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
2b. **Before a push, `bash scripts/check_generated.sh` must read all ok.**
3. **Merge order:** this checkpoint PR. The routine's open PR #3807 is its own; leave it to it.

## What shipped

- **#3817** (squash `023f21f7`): the anchor page, step 3, the fold in place. A card's title folds the Commons page to
  the trail *CPL Commons: all cards / <card>* and that card in full at `#commons/card/<key>`; a reload lands folded;
  the trail's first link or browser Back restores every card; Interconnect and Plan do not fold. Each folded card ends
  with *Open the full list*; no list mounts in place. **DECIDED** `d-commons-fold-link-not-mount-s729` (yours to
  revise). Guards `tests/commons_cards_checks.test.js` 47/47, `tests/every_view_has_an_address.test.js` 127/127.
  Not browser-verified; no `npm run a11y`; no phone-width look.
- **The adapt gather landed** in the 06:24Z daily run: none of the 34 merged M-IDs keeps its own member list, and PEDS
  M1029 holds 293 local courses at 0 to 4 units (S726 estimated about 283). **FACT** `f-adapt-gather-landed-s729`.
- This checkpoint compacted `docs/reference/lanes/commons.md` to under 20,000 bytes (two paragraphs moved verbatim to
  `docs/roadmap_archive_8.md`, *Moved from lanes/commons.md (S729 checkpoint)*).

## Read in order

1. `docs/reference/lanes/commons.md`: the S723 to S726 pointer (Gather, the adapt gather LANDED) and the anchor-page
   build after it (step 3 LIVE in place, its NEXT).
2. `docs/commons_lessons.md`, S729 and S726.
3. The anchor-page mock Sam approved: https://claude.ai/artifact/35uJsJ2ahLQ6XcrvfMS8YE.

## Open work, in order (from the commons lane's NEXT)

1. **Step 3, the rest:** mount the Courses data list under the trail if a cheap mount path appears (the list must
   render into a given container; Courses data's is the 17 MB COCI tab with its own root and addresses); else leave
   the link.
2. **Step 4:** Needs you as the one ranked queue, every change reaching its counts at once.
3. **Gather, the rest:** the nightly auto combining over saved filters (its confidence score first); the SLOs and
   objectives look-in; the add bars (each a new write surface, Rule 10 a3).
4. Subjects, Credit Recommendations, Exhibits on the same pattern; Sam's remaining doubt rulings.
5. **CI, the second half:** skip the generator lint steps on a docs-only PR; rebalance the shards.
6. **ESL:** 10 common courses over about 2,439 local courses; the monthly pass after 2026-11-29 is the work.
7. **`npm run a11y`** on the Commons fold and the Common courses rows, and a phone-width look at the fold.

Beside the queue: `implementation-funding` carries a NEXT (`coordPartMissing` requires the CPL Assistant Email; ship
after the team confirms Coalinga, Lake Tahoe and West Valley). It waits on the team, not on this line of sessions.

## Patterns that worked

- Give a worker `isolation: worktree`; it works only from inside the repo cwd. A worktree the conductor made under
  `/home/user` was unusable to the worker.
- Check a landed write by the published counts after the daily run, against the estimate the plan wrote.
- Mutation-check each new guard; capture a view's own save plan in jsdom before a session write.

## Pitfalls

- **CI `ETARGET` at `npm install`:** every job on #3817's first attempt died on `tldts-core@^7.5.6` (tldts 7.5.6
  published before its core reached the registry; no lockfile). One `rerun_failed_jobs` cleared it. A failure that
  names a package is not the PR's (`docs/reference/troubleshooting.md`, the npm-install entry).
- A receipt commit from `supabase-migrate.yml` starts no `test`: push one real change after it before the merge.
- A guessed PR number subscribes to someone else's PR; read the number from the create result.
- `cpl_memory` status must be `proposed` or `verified`; `active` fails the check.
- `CLAUDE.md` is over its budget (65 KB of 60 KB); compact before adding. `lanes/commons.md` is at 19.6 KB of 20 KB.

## Safety

- Rule 10: bulk writes insert-only under a cohort email, with a committed receipt; the adapt gather rolls back by
  `gather-adapt-s726@bot`.
- Person-settled wins: a save in the Commons is terminal.

## Let go

At sign-off: no PR watch remains (#3817 merged and unsubscribed); no check-ins; no artifact watch; no COBIx watcher.

Spend: not available; 2026-11-25T09:04Z to 2026-11-25T09:52Z.

Opening line: *Greetings, you are SkyDunlin (Session 730), see SkyCurlew's handoff — `docs/session_730_handoff.md` — let's keep rolling with our queue.*
