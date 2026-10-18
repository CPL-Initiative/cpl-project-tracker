---
title: "Session 405 handoff: own-HTML catalogs on the sitemap road, College of San Mateo loaded, MAP Data Quality's UI pass"
date: 2026-10-17
session: 404 (SkyBuckeye)
tags: [handoff, program-requirements, catalog-sweep, own-html, display-build, ui-pass, scheduled-sessions]
status: current
superseded: true
superseded_by: session_411_handoff.md
---

# You are Session 405

Your moniker is **SkyCholla**. Session 404 (**SkyBuckeye**) was the 10:12Z CPL Queue firing on 2026-10-17
(`session_018pAg3EbiJdExxS35PpcT93`). If the routine started you, follow `docs/reference/scheduled_sessions.md`
first. With no `list_sessions` tool, read the open PRs and their comments before you write anything.

## What shipped (S404)

- **Handoff 404 item 1 closed:** display build `726bde512dfa` was applied from `main` (run 39021463958, 10:20Z).
- **#2193, merged: the MAP Data Quality UI pass.** The tab's private light and dark palettes (38 raw hex) gave way to
  First Light's tokens under nine role names. Nine labels moved off `--text-faint`. Controls are now underlined words,
  and the status filters carry `aria-pressed`. Emoji and status glyphs are gone. New seeded a11y targets `mdq-list` and
  `mdq-form`, light and dark, fail on the old file and pass on the new one. Ledger recorded; next due: **MAP Export**.
- **#2194: own-HTML catalogs take the sitemap road.** `capture()` refused `custom_html` at its platform gate; the
  generic sitemap and child-page path built for CourseLeaf now reads such a catalog. **College of San Mateo**: capture
  39024297472 found 60 of the 64 programs that list courses. Extraction 39025870196 cost $4.98 and passed 51 of 60.
  Load 39027691727 inserted 55 unchecked, with a rollback receipt. Display build `928577b30f0f`.
- **Why not Los Rios:** its four hosts have answered the reader 404 since 2026-10-08, and the record says the reader
  never works around a refusal. That switch is an order-of-queue choice, not a call for Sam (lessons S404).

## Decisions Sam made this run

None. The routine started this firing and Sam did not write. Sheet 88's `replies` store held nothing at 10:15Z.

## In flight at sign-off (check each first)

1. **#2194:** merge it once `test` passes on its head (if S404 did not). Then dispatch
   `program-requirements-college.yml` from `main` with `step=display` (build `928577b30f0f`, about 50 minutes), and
   confirm the applied record on `main`.
2. **Skyline** (branch `claude/s404-skyline`). Capture 39024299478 (78 minutes) found 54 of the 58 programs that list
   courses (35 sitemap, 19 link search), but its sitemap lists 48,034 pages (3,927 on program paths) and the read
   stopped at `MAX_PAGES` (900); 25 picks sit at coverage 0.5-0.8 and four programs share one page. Extraction was
   dispatched at 11:43Z (`step=read extract=1`, about $5). When it files, read `summary.json`; load it (`step=load`)
   if the checks hold near San Mateo's, then a wave PR with its own display build. **Reader fix to try first next
   time:** keep a sitemap's pages under the registry address's own path (`/current/`), so past catalog years stop
   filling the cap (lessons S404).
3. **Sheet 88** ([link](https://claude.ai/artifact/WkqwWZTrLCXffyzrNihLfG), current, two cards). Read the `replies`
   store first. Card 1 covers the five registry rows; card 2 is the 49-row undo paste (handoff 404 item 2).

## Priority, in order

1. Sam's reaction to My College's Sierra (S400's screenshots); still unanswered.
2. The three items above.
3. **More own-HTML colleges on the generic path:** Cañada (same district; its registry row names
   `canadacollege.edu/catalogschedule/`, which may need a correction card), then Coalinga, Cuesta, College of the Desert,
   Ohlone, LA Trade Tech and Grossmont (its row names a cover image: a correction card). A capture-only run first,
   one branch per college. De Anza reads `blocked`; the four Los Rios hosts stay unread.
4. San Mateo's three not found (Addiction Studies, International Business A.S. and certificate): a page read of how
   those pages print their courses.
5. Procedure records for LA City's and Pierce's reconcile runs, East LA's v1 merged, and San Mateo v1.
6. Santiago Canyon's Catalog Archives, Diablo Valley, SmartCatalog (Crafton Hills, Taft), Coursedog (Hartnell,
   Merced), CCSF's PDF by section.
7. The UI pass on **MAP Export**; `map_cleanup_views.js` (painted above MAP Data Quality) keeps its own palette and is
   unseeded: a pass of its own.

## Patterns and safety

- **Try the generic path before writing a reader.** A capture-only run (`extract=0`) is free and its report says
  whether the host needs code.
- **A seeded a11y target is evidence only once it fails on the old file.**
- One branch per college. Dispatch every read with `college=`. Poll with `git ls-remote`; list runs sparingly, since
  each run listing carries the whole squash message.
- The Supabase guard holds an UPDATE: it goes on the sheet as a paste card.

## Not refreshed this checkpoint

- The Pipeline tab (step 7): no phase moved. `kb/README.md`, `README.md`: nothing they describe changed.
- No new decision sheet: no new ask for Sam.

## Subscriptions and check-ins

S404 held no PR subscription, no check-in and no artifact watch. Nothing to drop.
