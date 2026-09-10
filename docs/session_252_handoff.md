---
title: Session 252 handoff — the four blind checks, and CPL mode's universe
date: 2026-09-10
session: 252 (SkyLabel)
tags: [handoff, skyview, ccr, cpl-mode, guards, generators]
status: current
---

# You are Session 252

Your moniker is **SkyLabel**. The name is the job: the statewide exhibits need a
treatment and at 84 points a LABEL is affordable where 1,987 points are not — and
this run's lesson was about what a check can and cannot SEE.

SkyLedger (S251) ran 2026-09-10 after the cron was repaired. Read in this order:
[`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md) ·
[`docs/engineering_practices_lessons.md`](engineering_practices_lessons.md) (the 2026-09-10 section) ·
[`docs/ccr_atlas_lessons.md`](ccr_atlas_lessons.md) (the 2026-09-10 section).

## What shipped

- **#1541** — three rules with no enforcement, all surfaced by the cron coming back.
- **#1543** — the CPL-mode measurement pass; the lane's inputs were stale.
- **#1544** (open at checkpoint, CI running on `ac663441`) — **CPL mode's universe
  is BUILT**: `kb/_build_ccr_cpl_universe.py` → `prototype/ccr_cpl_universe.json`,
  1,987 exhibit identities folding 3,813 local exhibits in 97 islands, 1,603 with
  a ring, 84 statewide (all articulated), 543 in the pile. 25-check guard, wired
  into the daily cron. **Merge it first if it is still open.**

## The one thing to carry forward

⭐ **Four checks read green this run because the tool could not see what it was
checking** — a guard on a generated artifact blind to its generator's INPUT; a
guard measuring a transformation's YIELD after that transformation moved
upstream; a whole suite green because the cron was dead; and a dependency map
rebuilt from `git ls-files` while the new files were still untracked. **Stage
before you rebuild anything whose inputs come from git**, guard the generator's
input and not only its output, and read a red check right after a generator
repair as a backlog coming due rather than the repair misbehaving.
⚠️ **Run ALL 41 python guards from `js-tests.yml` locally before pushing**, not
the subset you judge relevant — that is what caught the last one without a second
red CI cycle.

## NEEDS SAM (carried)

1. ⭐ **What the statewide exhibits are FOR.** His ask on 2026-09-10 cut off at
   *"shown visibly on the sky so folks can easily see…"*. The data side is done —
   every one of the 84 carries `sw` — but the treatment depends on the rest of
   that sentence. **At 84 points a permanent LABEL is affordable where 1,987
   cannot be labeled**, which satisfies "color is never the only signal" with a
   word rather than a mark. Ask him before drawing.
2. The live `sierra_guidance` CHECK constraint still lacks `skyview-ask`.
3. The opening width on a phone (188° across on 390px clips discipline labels).
4. **C-ID/CCN descriptor text** — MAP holds the designation, not the text (541
   identities); whether ASCCC publishes it loadably is still open.

## Queue

- **The CPL-mode VIEW.** The payload is drawable; nothing draws it. That is the
  next build, and item 1 above gates the statewide treatment only, not the rest.
- **Restore `Counselor_Verified`** — Pedro's fix is VERIFIED LIVE (run
  34493245398: all six lifecycle booleans back at 100% fill, constant within a
  student). ⚠️ Sam narrowed this to **counselor verified ONLY, not student**. The
  funding builder's sweep already matches the spelling, so it is one column in
  `fetch_custom_report.py` plus the `WITHDRAWN` dict in `kb/_probe_lifecycle_checks.py`.
  **Not done at checkpoint** — it was held so it would not widen #1544.
- **To-Do feed triage** — at 21 against a ~12 guideline; needs doing WITH Sam.
- 51 guessed column offsets remain in `excel_to_dashboard.py`.

## Housekeeping

⚠️ **`CLAUDE.md` is at 59,995 B against a 60,000 budget.** Nothing was added this
run. The next structural addition needs a deliberate pare-down first.
⚠️ **Two lane files are still over the 12,000 `oversized_doc` limit** —
`skyview-ccr-interface.md` (12,943, down from 15,186) and `cobi-dark-mode.md`
(13,809, down from 14,422). Both were compacted this checkpoint by retiring
superseded text, including one live contradiction about whether Implementation
Funding was inside the S248 numbers. They are the two active lanes; what remains
is load-bearing. `docs/ccr_atlas_lessons.md` was 13 bytes under its 120,000 limit
and is now 97,008 — its six 2026-09-06 blocks moved verbatim to
`docs/ccr_atlas_lessons_archive.md`.

## Safety patterns honored

Rule 8 query FIRST — it found three verified rows that were landmines for the CPL
builder (the crosswalk's stale issuer, the disjoint exhibit universes, the
one-universe coverage rule). Rule 1 (fix the generator, not the HTML) · Rule 4
(both HTMLs byte-identical) · Rule 7 (TOP never gates a discipline — measured at
4 of 543 and still not used) · code-only artifact policy for the regenerated
course universe.

---

*Greetings, you are SkyLabel (Session 252), see SkyLedger's handoff —
`docs/session_252_handoff.md` — let's keep rolling with our queue.*
