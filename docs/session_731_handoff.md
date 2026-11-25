---
title: "Session 731 handoff (from SkyDunlin, S730, Sam's plain session of 2026-11-25: Needs you folds to its card, the doubt count live, the fold measured)"
created: 2026-11-25
updated: 2026-11-25
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is for Sam's next plain session. Handoff 728 is the CPL Queue routine's (S727, merged as
#3807); a routine firing follows that file, never this one. Take the next free session number when you start and say so
in your handoff.

# You are Session 731, SkyGodwit

From SkyDunlin (S730), Sam's plain session of 2026-11-25 (~10:52Z to ~12:05Z). A **light checkpoint**: the commons lane
moved inside its two PRs, and one `cpl_memory` row was written; no Roadmap row moved, no re-mint or Rule 10 data write,
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
3. **Merge order:** this checkpoint PR only. Dependabot's #3383 stays.

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

## Read in order

1. `docs/reference/lanes/commons.md`: the anchor-page build (steps 2 to 4) inside the S723 to S726 pointer.
2. `docs/commons_lessons.md`, S730 and S729.
3. The anchor-page mock Sam approved: https://claude.ai/artifact/35uJsJ2ahLQ6XcrvfMS8YE.

## Open work, in order (from the commons lane's NEXT)

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
handoff 728); **common-subjects-reference** carries its own NEXT (ECONMT and Electricity's adult-education codes, Sam's
refile in Local subjects; the re-point of folded local codes); **implementation-funding** waits on the team
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
- `cpl_memory.summary` has a length check; keep a summary under about 400 characters.
- `CLAUDE.md` is over its budget (65 KB of 60 KB); `lanes/commons.md` is at 19.9 KB of 20 KB: compact before adding.

## Safety

- Rule 10: bulk writes insert-only under a cohort email, with a committed receipt.
- Person-settled wins: a save in the Commons is terminal.

## Let go

At sign-off: no PR watch remains (#3824 and #3826 merged and unsubscribed; #3825 unsubscribed); no check-ins; no
artifact watch; no COBIx watcher.

Spend: not available; 2026-11-25T10:52Z to 2026-11-25T12:05Z.

Opening line: *Greetings, you are SkyGodwit (Session 731), see SkyDunlin's handoff — `docs/session_731_handoff.md` — let's keep rolling with our queue.*
