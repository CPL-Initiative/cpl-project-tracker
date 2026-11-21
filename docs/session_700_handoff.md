---
title: "Session 700 handoff (from SkyAuklet, S698, Sam's plain session of 2026-11-21: COBIx's page follow-ups and the hourly dependency map)"
created: 2026-11-21
updated: 2026-11-21
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows
`docs/session_699_handoff.md`, never this file.

# You are SkyGuillemot (Session 700)

From SkyAuklet (S698), Sam's plain session of 2026-11-21, 18:31Z to about 20:35Z, on Fable 5.2. A **light
checkpoint**: three lanes took a line inside their own PRs, no Roadmap row moved, and no re-mint or data receipt was
written. Skipped: steps 2 and 3 (no KB or README surface), 4 (no retired text needed a home), 5 (no new KB note), 7
(the pipeline did not move), 9 (its own queue item) and 12 (`kb/status/program-requirements.json` is the routine's
run log from S697, and this session touched no harvest file; the four other run logs were not touched either).

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read it, and comment 7064588752 (Sam's two rulings of 2026-11-21).
1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background, and read its output
   yourself every few turns: it wakes no one and stops at the two-hour background limit. Act on each new
   `<!-- cobix -->` comment. This session did not run it; it read COBIx's notes on #3643 and #3646 directly.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone, for every session and worker.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from
   `main` right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints
   match. COBIx reviews do not gate a merge (`r-cobix-review-never-gates-merge-sam-2026-11-21`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the
   next wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves
   the M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order:** #3652 and #3654 are merged. This checkpoint's PR merges at sign-off. Dependabot's #3383 waits.

## The start

`list_sessions` was held: no other session was live (the page session and S695 had finished). Open PRs at 18:33Z:
dependabot's #3383 only. Three repos attached, plus `cpl-program-records`. Hooks: `LIVE (root)`.

## What shipped (squash-merged, `test` green on each head, each thread read)

- **#3652 `290f5177`:** COBIx's follow-ups on #3643 and #3646.
  - Exhibits: the whole tab says *combine* (about 40 strings; keys and identifiers unchanged); each chip a person can
    reach carries `role="note"`; a details read that failed is tried again when a person opens a title, and a redraw
    alone never retries; *Possible duplicate* pairs two names of one agency only when the rest of the two titles
    shares a word (`d-possible-duplicate-shares-a-word-s698`).
  - Commons: the College Data Collection card counts *colleges and campuses* and names the districts under
    *...(more)*; the stuck count reads *Stuck on a person or a fix*; a hand-over row that names its term takes only
    that term off Term Reports Needed (`d-term-reports-named-term-s698`); a catalog address opens as a link only when
    it is a web address.
- **#3654 `e470bd7e`:** `dependency-map.yml` runs at minute 43 of each hour and on dispatch, never on a push
  (`d-dependency-map-hourly-s698`; COBIx's slimming plan on #3476). Sam's rule of 2026-11-18 stands: one job on `main`
  rebuilds the map and a PR never does. The map can trail a merge by up to an hour; a dispatch rebuilds it at once.

## Decisions Sam made

None in this session. His rules of 2026-11-21 for page work stand (`r-plain-noun-labels-no-coder-words-sam-2026-11-21`).

## Decisions the session made (each his to revise)

`d-possible-duplicate-shares-a-word-s698`, `d-term-reports-named-term-s698`, `d-dependency-map-hourly-s698`. Memory
rows: `kb/migrations/2026-11-21_s698_cpl_memory_rows.sql` (5 rows, all `proposed`; rollback beside it), applied with
one `execute_sql` call at about 20:25Z and read back (5 rows).

## Open work, from the lanes' NEXT lines

1. **`commons`:** `commons_handover_summary()` carrying the term our reader names, so the page's term match has data
   (a function change: Rule 10 b2 and a rollback); a per-college credential count for the College Data Collection
   card's third line; the readable-course count; the *Stuck: waiting on a fix* view under Sam's ruling 1
   (`r-a-block-is-a-block-sam-2026-11-21`); the three Collect cards from Sam's locked mock.
2. **`cer-procedures`:** the pair apply (its NEXT 1), then #3524 and #3522. Left from the page work:
   `issuer_resolution.js` still says "Set by the fold on" (shared with Credential Reference and its Python twin
   `kb/fold_issuer.py`), and the Exhibits Queue view keeps its name; `KNOWN_ALIASES` holds one agency.
3. **`repo-size`:** the spreadsheet export and the videos out of the tree; the other timed workflows' commits capped
   at once a day; the session trim with COBIx; `START_HERE.md` and the `CLAUDE.md` cut after COBIx's rulings digest;
   removing `receipt-slim.yml` once nothing is left for it. Part 5 waits on Sam's go.
4. **`common-subjects-reference` and the pile (handoff 696, items 3 to 8):** the 168 other tutoring titles (76 that
   name a subject go to Assign under `LSKL M9004` after a dry run and a second read); the held codes saved from
   `#commons/subjects/held`; *Propose a new M-ID* in the panel; Jev as the recommender's second stage; SLOs and
   objectives in the score; the state course list rebuilt from a current COCI export.
5. **`library`:** deploy #3600, then part 4, then part 3.
6. **`program-requirements-harvest`** is the routine's (handoff 699): San Diego College of Continuing Education's
   outline index first.

## Not answered by Sam (told in chat, no sheet card filed)

- **TBA figures on the College Data Collection card:** the Credentials line and the course-outline ETA. No committed
  file holds a per-college credential count or a dated outline pace.
- **The Plan card** takes its phases from `library/college-collections-plan/` (v2, Nov 11), which does not split
  curated and connected work by phase.

## Pitfalls from this run

- **`npm run a11y` lost its browser twice** (once beside `npm test`, once alone after about 25 minutes); every later
  target read "did not finish". A wrapper config that requires `a11y.config.js`, sets `root` to the repo and keeps
  only the wanted targets, passed with `--config`, ran the 16 Exhibits targets in minutes
  (`p-a11y-sweep-browser-dies-s698`).
- **The Exhibits Progress target times out on `main`** (`seedExhibitsProgress` waits 60 seconds for
  `.exh-pg-groups section .exh-pg-bar`), in light and dark. Not fixed. Credential Catalog (public), dark, also
  reported a 3.05:1 contrast on two word buttons; neither PR touched it.
- **A merged branch is deleted on GitHub.** `git push --force-with-lease` then fails on stale info, and
  `git fetch --prune origin` pulls every branch and runs for minutes. Delete the stale tracking ref
  (`git update-ref -d refs/remotes/origin/<branch>`) and push.
- **`cpl_memory.summary` holds at most 400 characters.** A longer one fails the whole insert.
- **A label with a comma before its count** broke a test that reads the first number in a link. Keep the figure the
  first digits in a count link.

## Let go

Dropped: the PR subscriptions on #3652 and #3654 (both merged). No check-in is scheduled and no artifact is watched.
The checkpoint PR's watch is dropped when it merges.

Spend: not available; 2026-11-21T18:31Z to 2026-11-21T20:35Z.

The work was page fixes and one workflow change, by one session with two `pr-gate` reads.

Opening line: *Greetings, you are SkyGuillemot (Session 700), see SkyAuklet's handoff — `docs/session_700_handoff.md` — let's keep rolling with our queue.*
