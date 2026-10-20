---
title: "Session 437 handoff: the Exhibit Progress view, the Fact Sheet's controls as words, Sheet 107 open"
date: 2026-10-20
session: 436 (SkyTanbark)
tags: [handoff, commons, credential-reference, ui-pass, fact-sheet, decision-sheet]
status: current
---

# You are Session 437

Your moniker is **SkySagebrush**. Session 436 (**SkyTanbark**, `session_01FjxwzrCRhrjzXuomNjAgNz`) was started by the
CPL Queue routine at 11:12Z on 2026-10-20. It took SkyToyon's handoff 436 and checkpointed at about 12:20Z. If the
routine started you, follow `docs/reference/scheduled_sessions.md` first.

## Sam's words this run

None. The routine started the run. Sheet 106's and Sheet 105's `replies` stores were empty at 11:20Z, so the re-key
window (handoff 436's first priority) did not open.

## What shipped

- **#2285: the Common Exhibit Reference's Progress view** (the Commons' step 3, lane `commons`). The tab gains a fourth
  view, Progress, first in its row; the tab still opens on Needs you. `exhibit_progress.js` holds the definitions and
  loads with `commons_progress.js` when the view opens. The headline pair and the auditor's tallies come from the
  Exhibit row of `kb/status/commons.json`, so the Commons row and the view agree by construction. Five milestones,
  eight cards, every count opening its lane; `#credential-reference/<lane>` routes from the address, and the Commons
  row's counts link there. Guard `tests/exhibit_progress.test.js` (30); a11y `cer-progress` and `cer-progress-dark` pass.
- **Open Asks Sheet 107** (https://claude.ai/artifact/DxwPak4waxKhMByt8oL6BU, vault branch
  `claude/determined-mayer-oudjj8`), **open**, four cards: Sheet 106's three at the same positions (the forestry
  stragglers, the twelve Foreign Languages re-keys, the eight checkable blank strays) and card 4, the Exhibit Progress
  view built on the recommendation (complete = a title with a review stamp; the tab opens on Needs you; reply to
  reverse). Sheet 106 (https://claude.ai/artifact/7jdv3UK2X5iegWRjkViyjG) is superseded; a reply there still counts.
- **This checkpoint: the Fact Sheet's UI pass.** Swept clean before and after. The Controls rule reached its last two
  holdouts, both in injected CSS: the statewide recs toggle and the curator editor's four buttons. Guard in
  `tests/factsheet_a11y.test.js` (2/2 new, 0/2 old). Privacy is next (`ui_pass.py --next`).

## Priority

1. **Read Sheet 107's `replies`** (and 106's; 105's for card 1). Cards 1 to 3 are handoff 436's re-key window,
   unchanged: NEEDS SAM 9 (`kb/_forestry_wine_remint.py --set stragglers`), 10 (`kb/_fl_stray_remint.py`; add the five
   new codes to `kb/foreign_language_subj4.json` too) and 11 (a pinned dry run in the forestry script's shape), each
   receipt its own ALIAS_MAPS entry in apply order. Card 4: *keep* closes the commons lane's NEEDS SAM;
   *open-progress* changes `openingLane()` in `credential_reference.js`; *person-only* changes the pair in
   `kb/_build_commons_status.py` and the view's HEADLINE together. A held apply is a hold: name it on the sheet.
2. **The CR Progress view** from the shared module, the same way (`exhibit_progress.js` is the template for a host
   with its own state), then Course, which lives with SkyView.
3. **The C-ID source for the quarterly routine:** find one a runner can reach, then set the `authority_tables` baseline.
4. Malone's exchange paste still waits on Sam.

## Patterns that worked

- A Progress view reads its pair from `kb/status/commons.json` rather than recomputing it: one definition, two readers.
- A draft PR runs no CI in this repo; mark it ready before you wait on `test`.
- `npm test` will not finish inside one sandbox call; run the changed tests and let CI's shards gate.

## Lessons to honor

- The discipline blanks are a curator's list (2026-09-08). Never fill one from a title; a vote alone is not enough.
- Grep a view's injected CSS strings for the Controls rule, not only its stylesheet.

## Not refreshed

- The Pipeline tab: no re-mint applied and no audit count moved.
- `kb/README.md`: no KB structure changed. `README.md`: the tab gained a view, which its section already covers.
- No KB note and no `cpl_memory` row: the learnings are lessons, and Sam made no ruling.
- `kb/status/program-requirements.json`: the harvest did not move this run.

## Let go

S436 drops its PR subscriptions once both PRs merge. It holds no artifact watch (remote sessions cannot watch) and no
check-in. Sheet 107 is open, and the next session reads its store. The CPL Queue routine fires next at 13:12Z.
