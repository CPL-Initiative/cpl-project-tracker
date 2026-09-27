---
title: Session 295 handoff — the CLAUDE.md verdicts carried out, and a fresh standing sheet
date: 2026-09-27
session: 295 (SkyHarbor)
tags: [handoff, doctrine, decision-sheets, esl-packaging, hooks]
status: current
---

# You are Session 296

Your moniker is **SkyBeacon**. SkyHarbor (S295) took the queue from
[`session_295_handoff.md`](session_295_handoff.md). The ESL writes are live, the CLAUDE.md audit and
all eight of Sam's verdicts on it have landed, and the standing open-asks sheet is fresh.

## First thing to check

The opening line runs `python3 scripts/check_hooks_live.py --fix`. Since #1712 its LIVE line ends
`· context meter: yes|NO`, and `--fix` installs the meter at the session root when it is missing. **It
should read `yes`**: that is the first live proof that Rule 9a's warning reaches a three-repo session. If it
reads NO after `--fix`, say so in one line and run `python3 kb/_context_budget.py` by hand at the usual
points.

## What shipped

1. **The ESL sheets are applied** through `esl-sheet-apply.yml` (147 + 2 rows, six cohorts read back), and
   **the monthly pass** is built (#1710, cadence CA-08, lint `esl_monthly_pass_due`; first pass: nothing).
2. **The CLAUDE.md prompt audit** (#1708): incident stories moved verbatim to
   `docs/reference/doctrine_provenance.md`, every rule in place. Main's lints fixed (#1709).
3. **The CLAUDE.md Cleanup sheet, all eight verdicts** (Sam, 2026-09-27, all as proposed):
   - tracker #1712: card 1 (the meter at the root through `--fix`), cards 2 and 3, card 8's checkpoint step;
   - tracker #1713: card 6, the emphasis sweep (the marks stay on five rules);
   - vault #185 (cards 4, 7, 8) and #186 (card 6's headings);
   - cpl-knowledge-base #23 (card 5): a draft for Sam's merge, as #17 was. Thread f438bc2d is closed.
4. **The standing open-asks sheet, reconciled** (#1714), published fresh at
   https://claude.ai/artifact/5sWY4QCCDfkAegZtZrW1oe (`SHEET_ID` `2026-09-27-open-asks`, empty store).
   Reading the 2026-09-22 store first showed seven of its ten cards already ruled (Sam's mark: card 18), and
   four of those were military questions he had answered on 2026-08-14. Details in the lessons doc.

## Sam's decisions, recorded

- **2026-09-27, the CLAUDE.md Cleanup sheet:** all eight as proposed (Complete 12:36 UTC, `through: null`,
  so none counts as a ruling for calibration). Carried out as above.
- **2026-09-22, the open-asks sheet, read today** (`cpl_memory` `open-asks-2026-09-22-rulings`): re-mint the
  31 ETHS physical-activity identities; sessions write cross-lists before curators get a surface; ACE unit
  variants are one recommendation naming its range (his note: *"1-3u … a rule for all merges and mints.
  Advise"*); the typographic class goes downstream; SkyView narrows its phone opening.
- **Held, not ruled:** two September defaults that contradict his August answers (the not-a-topic class,
  subject-area granularity). August stands until he answers cards 3 and 4.

## Waiting on Sam

Everything is on the fresh sheet (read `replies`, then `replies/done`, before acting): the narrated draft,
the merge of cpl-knowledge-base #23, the two military conflicts, the unit-range advice, the occupation-match
queue, the 381 mojibake titles, and GR register rows #2, #10 and #16.

## The queue, in Sam's order

1. **The fresh sheet's replies**, when he answers: carry each out, and record it in its lane (and the
   military scope's §10 for cards 3 and 4) **in the same PR that drops the marker**.
2. **The rulings waiting on sessions:** the ETHS re-mint of 31 identities under
   `docs/coursecontrolnumber_remint.md` (To-Do `s295-fable-eths-remint`), and SkyView's phone opening
   (measure at 390px through the `npm run a11y` harness first).
3. **The narrated video:** card 1 of the sheet.
4. **ESL:** the next monthly pass after 2026-10-28; then the Jev CCR misfit rung (cross-list items 4–6 and
   12 are proposals handed over, none ruled).
5. **SkyView.** 6. **The EACR grid review**, whenever he opens it.

## Read in order

1. This file, then the sheet's replies.
2. [`decision_sheets`](reference/decision_sheets.md): the high-water rule and today's addition.
3. [`doctrine_enforcement_lessons`](doctrine_enforcement_lessons.md) § 2026-09-27 (both sections).
4. The lane of whatever card you carry out.

## Patterns that worked

- **Read a sheet's store before you rebuild it.** The rebuild was the step that exposed seven rulings.
- **One PR per repository, the reversible sweep on its own**, then the next PR off the merged main.
- **Mutation-check a new test**: break the code the way the test claims to catch, watch it fail, restore.
- **Run every step of the lints job locally** (`kb/_docs_audit.py` changes run the full suites in CI).

## Safety patterns

- ESL writes go through `esl-sheet-apply.yml` only, one dispatch at a time. Never hand Sam SQL.
- A merge to `cpl-knowledge-base` is Sam's (#17's precedent); the session opens the PR as a draft.
- An untouched default on a card that never showed Sam his earlier answer does not supersede that answer
  (Rule 8); ask, with the earlier answer on the card.
- `--fix` may add the meter to a healthy root; guard and allow-list changes wait for the snapshot rebuild.

## Carryover

- The funding lane's three *"Unruled, his call"* items carry no NEEDS-SAM marker, so the sheet does not
  carry them: the annual-view earning percent (a cell can read 191%), when `CollegeID2` lands, and whether
  COBI keeps "<10" until the split. Mark them in the lane and give each a card.
- Prompt-audit flags not yet acted on: F13 (the `cpl_memory` briefing figures in CLAUDE.md need a
  re-measure) and F16 (the knowledge base's two CLAUDE.md copies have drifted apart).
- Add *maths* to `BRITISH_FORMS` in `kb/_docs_audit.py` (it would flag the word corpus-wide).
- Checkpoint artifacts not refreshed, with the reason: the Pipeline tab (no re-mint), `README.md` (no
  user-facing change), `kb/README.md` (no KB structure change).
