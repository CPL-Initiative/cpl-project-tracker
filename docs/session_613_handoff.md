---
title: "Session 613 handoff: the anchor re-key applied, funding tests twice as fast, the CCR seed re-check reads course descriptions"
date: 2026-11-08
session: 612 (SkySunflower, Sam's hand-opened session, 2026-11-08 21:13Z to ~23:00Z; the CPL Queue routine fires next at 2026-11-09 06:12Z)
tags: [handoff, commons, common-subjects-reference, ci, implementation-funding, cpl-memory]
status: current
---

# You are Session 613

Your moniker is **SkyCometa** (galaxy names).

This is a **full** checkpoint: the run applied a re-mint (the anchor re-key) and wrote four memory rows. Sam opened the
session with the greeting only; every merge rode the standing auto-merge rule. One sheet card is open (below).

## What shipped

1. **The anchor re-key (#2938; Sheet 171 card 4, "As proposed").** `kb/_anchor_rekey_apply.py` moved 20 curated anchor
   keys in `kb/common_courses.json` (stamp `_anchor_rekey_from`) and 21 `kb/course_crosswalk.json` pointers. 15 kept their
   number; 5 took the lowest never-used number: AUTD M10FX/FY/FZ to DIES M10II/IJ/IK, PLGL M10IA/IB to PARA M10KX/KY. The
   three HOSP keys stay with the curator. Receipt `kb/anchor_rekey_out/2026-11-08/`, last in `kb/alias_chain.py`. No
   Supabase row moved (fresh read: none on any old or new key). The era stamp is `kb/common_courses_era.json`, since
   `excel_to_dashboard.py` walks the anchor whole. `daily-dashboard.yml` was dispatched after the merge.
2. **Proceeded on the recommendation, reply to reverse:** AUTD M10FX and FY were dry-run "re-keys", but a later fold had
   put HVAC singletons on those ids and the 2026-11-05 recode moved them to DIES M10FX/FY. They took Sam's collision rule.
   The dry run now calls a re-key onto a live id a collision (test added).
3. **Funding tests twice as fast (#2939; COBIx #2927 item 2).** `base()` read jsdom's slow `window` getter about a million
   times a render; `var WIN = window` at load halves boot and render (5.7s to 2.9s; the slowest shard 10m26s to 8m41s).
   COBIx's premise (reloading the 1.25 MB file) did not hold: that load costs 13ms. Guard
   `tests/cpl_funding_base_cached_window.test.js`. Items 4 and 5 left alone (4 mostly done; 5 saves ~30s on a fragile gate).
4. **The CCR seed re-check (#2940; Commons ruling 4).** `kb/_ccr_seed_recheck_dryrun.py` + `kb/_ccr_desc_signal.py`
   (read-only) on the auditor's 14,523 capped seed disciplines. Course descriptions, as Sam asked, with TOP beside them:
   held out 88% right at a clear margin; of 12,504 uncurated cards 1,964 confirmed by both, 1,823 for a curator.
   Kinesiology 627 and 8. Sheets 173 and 174 (CPLBrain#723).

## Decisions Sam made this run

- **Sheet 173 card 1, a note and no verdict (22:21Z):** *"Can't we use course description and slos and objectives to
  confirm rather than top or alongside top"*. Answered in its thread; built into the dry run; Sheet 174 replaces it
  (cpl_memory `sam-sheet-173-descriptions-2026-11-08`).

## Read first

- **Sheet 174's store** (https://claude.ai/artifact/ETPrCdiUzf3iq7GUr4F9So, `replies`): confirm Kinesiology's 627?
  Never republish onto 173 or 174.
- `docs/reference/lanes/commons.md` (*The CCR, next*), `common-subjects-reference.md`, `docs/commons_lessons.md` (S612).

## Open work, in order

0. **Sheet 174's answer.** On *confirm*: an apply that stamps the 627 Kinesiology cards' discipline source (both signals
   named) with a receipt, so the auditor scores them; the 8 to a curator as one batch (`plan.json` `worklist`; run the dry
   run with `--discipline Kinesiology`). On *sample*: a page of 20 cards with their descriptions. Then the next discipline.
1. **`cer-procedures`: read the 2026-11-09 ~14:30Z procedures report** (`kb/cer_procedures_out/latest.json`), the first
   since #2925: `classifier_run.answered` above 0 and `errors` empty. If it still errors, #2925's size guard prints what it sent.
2. **Student-grain plan, PR 4 and 5** (lane `disposition-grain-student-detail`): summaries with a backfill, then the delete
   in the load; each on Sam's word.
3. **COBIx #2927:** the remaining funding cost is `priorities()` recomputed per college in one render (memoize per
   render, invalidated on every edit; the 123 funding suites guard it). Item 6 costs Actions minutes (Sam's call); 7 last.
4. **The routine's queue (`program-requirements-harvest`):** Redwoods' 8 local degrees (`grad4`); SLOs on 2026-11-09 UTC
   (Cuesta's trial, #2910, then `--next --skip cuesta`); the catalog sweep's next college; the objectives reread.
5. **Lanes active this week:** `local-course-cr-alignment`, `map-users-student-contact`, `noncredit-cip-categories`
   (waits on Jenni's Q1), `common-subjects-reference` (the three HOSP anchors and 93 stray codes with the curator).
6. **Carried:** the TMC Builder's browser save; security step 5 (`org-phrase-scope-auth`); the `environment:` lines; COBIx's
   small items; the Worker `?secret=` drop once #2893 is confirmed; the Library's IACA and DSP Version 3 waits.
   Open PRs not this session's: #2910 (Cuesta SLO trial), #2894 (COBIx inbox, for Sam).

## Patterns that worked

- Gate an apply on "no new key is a live record", independent of the dry run's own classes: it caught what the dry run missed.
- Profile before taking a finding's cause: the funding fix was one line once the profile named the getter.
- A second signal must be independent of the first: list what each candidate was derived from before measuring it.

## Safety patterns

- A flat id-to-record file cannot carry a top-level stamp; check every consumer's loop first.
- The vault's `coverage` check reads the tracker's `main`: merge the tracker PR, then re-run it.
- After a merge, the local branch's remote ref is stale: `git fetch --prune` before the next push.

## Let go

At sign-off this session holds no PR subscription and no check-in (all four PRs merged; both check-ins canceled).
The Sheet 173 and 174 artifact watches were arming at publish; the next session reads 174's store directly.

> *Greetings, you are SkyCometa (Session 613), see SkySunflower's handoff — `docs/session_613_handoff.md` — let's keep rolling with our queue.*
