---
title: "Session 723 handoff (from SkyCormorant, S722, Sam's plain session of 2026-11-24: Titles to check, the 0-100 bar, sidebars that never cover the view)"
created: 2026-11-24
updated: 2026-11-24
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_726_handoff.md
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows the routine's own newest
handoff (`docs/session_722_handoff.md` when SkySkua's checkpoint lands, else 721), never this file. **Numbering.** Handoff
720 named this session SkyCormorant (S720), but the routine's SkyEider took 720 and SkySkua 721 while it ran, so this
session is S722 and writes 723. If 723 is taken when you start, take the next free number and say so in your handoff.

# You are SkyBooby (Session 723)

From SkyCormorant (S722), Sam's plain session of 2026-11-24 (11:49Z to ~14:50Z). A **full checkpoint**: the commons and
common-subjects-reference lanes moved and Sam made four rulings. Skipped: step 2 (no KB structure or audit artifact
changed), step 3 (no tab joined or left), step 7 (no re-mint; the pipeline did not move), step 9 (not a step).

## Open with the standing block

1. **COBIx:** as in 715 to 720, Sam said no COBIx check-ins for now. Start `bash scripts/cobix_watch.sh [state dir]`
   only if he asks.
1a. **Clone light:** `git clone --filter=blob:none` (or `--depth=1` when history is not needed), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head; no dependency-map rebuild inside a PR; no full rerun when the
   input fingerprints match. Never open a PR on a branch that holds another open PR's commits.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes; a fix goes ahead of the next wave only
   when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`); collection's fixes rank by the M-ID
   cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
2b. **Before a push, `bash scripts/check_generated.sh` must read all ok.**
3. **Merge order:** this checkpoint PR. SkySkua's (S721) routine PRs (#3760, #3762 to #3767) are the routine's; leave them.

## What shipped (all merged)

- **#3768** a Courses count reads `kb/status/statewide_code_courses/<first character>.json` (26 files, largest 1.26 MB,
  all 141,738 courses; written by `kb/_statewide_subject_codes.py`, published on Pages), never the 17 MB state list.
- **#3770** a pair of sidebars covered the view at 1280px. **Withdrawn by #3771:** it broke Sam's sidebar rule.
- **#3771** Titles to check (`#commons/subjects/disagree`): a title COBI rates 80+ stands as a *Derived title* with its
  bar; the list keeps the rest (about 100 of 301); Accept on each row and beside each candidate title (the same
  `kb_curation` save Edit writes); every candidate with a 0-100 bar, the chip last, no "Recommended" or explanation on
  the row; the recommender ranks a web search on the college's own site (`WEB_SHARE`, set not measured), so Clovis MECH
  reads Mechatronics/Industrial Automation; a sidebar resize stops where 360px of the view is left and a pair narrows its
  second sidebar; a Commons quick link lands on its check's highlighted action link; the Commons names COBI, never Sky.
  CLAUDE.md gained three rules (the 0-100 bar, the resize clause, "Sky" never rendered).

- **#3774** `lints` runs in four shards (Sam: *"do we need to do lints check on the whole code base every time?"*, then
  *"good, hopefully we can optimize this for future sessions"*). On its own run the shards took 5.4 to 8.6 min and the whole
  CI run about 9 min, against about 22 before. Every lint step names its shard (`if: matrix.shard == N`); a new step must
  name one, or `tests/lints_shards_test.py` fails.

## Sam's words this run (verbatim, 2026-11-24)

- His five asks on the no-title view (~13:20Z): Accept on the row; the chip at the end, a confidence bar for
  "Recommended", every candidate with its own Accept, *"If you did a web search and found a match ... your confidence
  bar should get higher...but it didn't and you recommended Law"*; *"sidebar should not cover the lower main window when
  resized. this is a rule for sidbars"*; a top-of-card link *"should drop you on a lower link and highlight the link"*;
  the list *"is overwhelming and not feasible. advise."*
- *"lets start to regularize our use of confidence indicators. I think a simple bar from 0-100 is the most recognizable
  and quickly understood indicator--better that high, medium, low or others..."*
- *"Yes save any title 90 or above. Really it should save all titles and just flag for possible action those that are
  below 80"*; *"rather than sky's title, how about derived title or expected title"*.
- *"no one outside of the map team knows we call you sky:)"*, *"right"*, *"you could substitute COBI where you might need
  to refer to sky"*.

**RULED:** `r-confidence-is-a-0-100-bar-sam-2026-11-24`, `r-sidebar-resize-leaves-the-view-sam-2026-11-24`,
`r-sky-titles-stand-flag-below-80-sam-2026-11-24`, `r-sky-never-rendered-sam-2026-11-24`. **DECIDED (his to revise):**
`d-web-search-weight-set-not-measured-s722`, `d-accept-writes-the-edit-save-s722`, `d-pair-narrows-never-covers-s722`,
`d-no-number-no-stand-s722`, `d-derived-title-word-s722`.

## Read in order

1. `docs/reference/lanes/commons.md`, the *Subjects, by confidence* paragraph and its NEXT.
2. `docs/commons_lessons.md`, S722.
3. `docs/kb-notes/methodology-a-source-that-only-checks-the-winner-never-wins.md`.
4. `docs/reference/lanes/common-subjects-reference.md`, `f-mq-sections-reread-reaches-the-vocabulary-s722`.

## Open work (from the lanes' NEXT)

0. **CI, the second half (Sam's ask):** on a docs-only PR (the gate's `skip` decision), skip the lint steps that rebuild a
   generator, so a checkpoint PR finishes in about 2 min. Every step still runs on `main`. Classify the 303 steps with care
   (the docs lints must keep running); rebalance the shards by a fresh run's step times, since each shard pays about 1.5
   min of setup and shard 2 ran longest.
1. **Derived titles into the titles build** as their own column in `kb/status/local_subject_titles.json` (never
   `printed_name`: the recommender votes from it), so the committed totals agree with the page (they still count 301).
2. **Measure `WEB_SHARE`** once titled codes have filed searches.
3. **The 0-100 bar on every other confidence display** (CLAUDE.md rule), each view at its UI pass; "Sky" out of
   rendered text in the other tabs the same way.
4. **The MQ sections re-read** as its own planned pass (the CSR lane's finding).
5. Southwestern PE/* to ES/* and DANC on Sam's word or a printed source; MICROTK to IT (LATTC); DSPS to ACCS (Mt. SAC).
6. The code history's next readers; probe round 2 and the filers; the mint takes Confident calls; the 787 Unsure codes;
   FLNG and Athletics into KINE; Sam's twelve AED titles, then one re-mint.
7. **Waiting, by slug:** `cer-procedures`, `my-college-action-page`, `program-requirements-harvest`. S722 moved none.

## Patterns that worked

- Answer Sam's ask in the same turn with the numbers behind it (301 rows, 15% of pairs, 113 already High), then build.
- Before a layout change, grep CLAUDE.md's presentation rules for the word it touches.
- Mutation-check every new guard against `main`'s file.

## Pitfalls

- A permission-check denial (the local server and Playwright) is never routed around; say what was not verified.
- A guard on rendered text drops `script` and `style` first.
- `0.575 * 100` rounds to 57 in JavaScript without `+ 1e-9`.

## Let go

At sign-off: no PR watch remains. #3768, #3770, #3771, #3773 (the checkpoint) and #3774 merged (watches ended). No COBIx watcher, no
artifact watches, no check-ins.

Spend: not available; 2026-11-24T11:49Z to 2026-11-24T15:55Z.

Opening line: *Greetings, you are SkyBooby (Session 723), see SkyCormorant's handoff — `docs/session_723_handoff.md` — let's keep rolling with our queue.*
