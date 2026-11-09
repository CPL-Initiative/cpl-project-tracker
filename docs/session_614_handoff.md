---
title: "Session 614 handoff: the funding render remembers its priorities"
date: 2026-11-08
session: 613 (SkyCometa, Sam's session opened from his phone, 2026-11-08 23:21Z to ~2026-11-09 00:40Z; the CPL Queue routine fires next at 2026-11-09 06:12Z)
tags: [handoff, implementation-funding, ci]
status: current
---

# You are Session 614

Your moniker is **SkyMilkomeda** (galaxy names).

This is a **light** checkpoint: no lane changed state, and the run wrote no re-mint, no data receipt and no memory row.
Skipped: `kb/README.md`, `README.md`, the KB notes, the pipeline tab, `cpl_memory` (nothing durable beyond the lessons
entry) and the four other `kb/status/` run logs (no reference moved). Sam opened the session with the greeting only; the
one merge rode the standing auto-merge rule.

## What shipped

1. **The funding render remembers its priorities (#2942; COBIx #2927 item 3).** A CPU profile put 69% of
   `cpl_funding_cap` inside `priorities()`, recomputed once per college per render. `render()` now runs inside
   `withMemo`, which holds `priorities(slot)` and `totalSize()` for that one render, empties at both of render's cache
   clears and in `persistActive()`, and hands every caller its own copies. Outside a render nothing is remembered.
   `cpl_funding_cap` 42s, then 15s; CI's six shards finished in about 4.5 minutes, against about 13 before. Guard
   `tests/cpl_funding_render_memo.test.js`; `cpl_funding_refresh_sources` 2a now reads `renderNow()`. Lessons
   `docs/cpl_funding_lessons.md`, *S613*.
2. **The durations table refreshed (#2944; COBIx #2927 item 1)**, after Sam's *"keep rolling with the queue"* (00:05Z):
   all 597 files measured and passing; the six shards balance to 560s each by the new times (495 to 643s before).
3. **Redwoods' 8 local degrees stand as filed.** Three page reads (42538790768, 42539434482, 42540109133) found that
   eLumen's CR-GE page carries its heading alone: the catalog prints no CR-GE units. Lane and lessons (*S613*) updated.

## Decisions Sam made this run

None. Sheet 174's store was read twice (23:24Z, 23:49Z): no reply.

## Read first

- **Sheet 174's store** (https://claude.ai/artifact/ETPrCdiUzf3iq7GUr4F9So, `replies`): confirm Kinesiology's 627?
  Never republish onto 173 or 174.
- `docs/reference/lanes/commons.md` (*The CCR, next*), `common-subjects-reference.md`.

## Open work, in order

0. **Sheet 174's answer.** On *confirm*: an apply that stamps the 627 Kinesiology cards' discipline source (both signals
   named) with a receipt, so the auditor scores them; the 8 to a curator as one batch (`plan.json` `worklist`; run the dry
   run with `--discipline Kinesiology`). On *sample*: a page of 20 cards with their descriptions. Then the next discipline.
1. **`cer-procedures`: read the 2026-11-09 ~14:30Z procedures report** (`kb/cer_procedures_out/latest.json`), the first
   since #2925: `classifier_run.answered` above 0 and `errors` empty. If it still errors, #2925's size guard prints what it sent.
2. **Student-grain plan, PR 4 and 5** (lane `disposition-grain-student-detail`): summaries with a backfill, then the delete
   in the load; each on Sam's word.
3. **COBIx #2927, what is left:** item 6 costs Actions minutes (Sam's call); 7 last. Items 1, 2 and 3 are done; 4
   mostly done; 5 left alone.
4. **The routine's queue (`program-requirements-harvest`):** SLOs on 2026-11-09 UTC
   (Cuesta's trial, #2910, then `--next --skip cuesta`); the catalog sweep's next college; the objectives reread.
5. **Lanes active this week:** `local-course-cr-alignment`, `map-users-student-contact`, `noncredit-cip-categories`
   (waits on Jenni's Q1), `common-subjects-reference` (the three HOSP anchors and 93 stray codes with the curator).
6. **Carried:** the TMC Builder's browser save; security step 5 (`org-phrase-scope-auth`); the `environment:` lines; COBIx's
   small items; the Worker `?secret=` drop once #2893 is confirmed; the Library's IACA and DSP Version 3 waits.
   Open PRs not this session's: #2910 (Cuesta SLO trial), #2894 (COBIx inbox, for Sam).

## Patterns that worked

- Profile the test before reading the code: the profile named `priorities()` and `totalSize()` in one pass.
- A cache that lives for one pure pass needs no invalidation map; the pass is its boundary.
- A static test that slices a function's source by a fixed width breaks on any growth: widen it, and point it at the
  function by name.

## Safety patterns

- Do not edit a file a background test run is still reading: a mutation check run beside the suite loads into
  whichever files boot during it. Run the mutation after the suite, or on a copy.
- `kb/status/program-requirements.json` is two-space JSON; rewrite it with `indent=2`, or every line shows as changed.

## Let go

At sign-off this session holds no PR subscription and no check-in (#2942, #2943, #2944 and the Redwoods read PR merged; every check-in fired or canceled).

> *Greetings, you are SkyMilkomeda (Session 614), see SkyCometa's handoff — `docs/session_614_handoff.md` — let's keep rolling with our queue.*
