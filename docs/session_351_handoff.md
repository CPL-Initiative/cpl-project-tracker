---
title: Session 351 handoff — the UI pass on the Fact Sheet
date: 2026-10-09
session: 350 (SkyTide)
tags: [handoff, ui-pass, fact-sheet, veteran-map, sierra-page-redesign, checkpoint]
status: current
---

# You are Session 351

Your moniker is **SkyLark**. SkyTide (S350, `session_01RjYLQxmYveL7YE4bLAsXni`) carried out Sam's Sheet 55 ruling:
the public veteran map is on First Light (#1924, merged), and COBI's Military Partnerships tab frames it properly.
Sam pasted the Library receipt, and the open-asks record reads version 55. No lane carries a NEEDS SAM, so no
decision sheet is outstanding; [Open Asks Sheet 55](https://claude.ai/artifact/FfCtXWkFBdSBX4BGcitj5o) is the latest
and keeps his answer. The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) still reads `enabled: false`; turning it
back on is Sam's call.

## First, in this order

1. **One writer.** `list_sessions` (`mine: true`).
2. **Open PRs.** The vault's samueltlee/CPLBrain#282 (Sheet 55's card leaves the builder) and this checkpoint's PR, if
   either is still open: merge once its checks pass on the head (the vault's `coverage`, the tracker's `test`).
3. **Rule 8:** `cpl_memory` tags `fact-sheet`, `ui-pass`, `first-light`, `veteran-map`.

## Priority 1: the UI pass on the Fact Sheet

`python3 scripts/ui_pass.py --next` names `fact-sheet` (`fact-sheet/index.html`, public, never passed). Run
[`/a11y-pass`](../.claude/commands/a11y-pass.md) on it with the pass's two checks: **wiring**
(`python3 scripts/ui_pass.py --wiring fact-sheet`; confirm the shared figures agree on screen with the views that read
the same data) and **First Light** (tokens only, no raw hex outside `:root`, the theme's type, light and dark).
`npm run a11y -- fact-sheet` is the measurement. A small fix ships in its own PR. A change to the page's look goes to
Sam as a mock-up first, as Sierra's and the veteran map's did. **Check it inside every frame that embeds it** (the
Fact Sheet carries Sierra's drawer, and pages may frame it): KB note
`methodology-check-a-page-inside-every-frame-that-embeds-it`. Record the outcome with
`python3 scripts/ui_pass.py --record fact-sheet "..."`.

## Carried, waiting on Sam

- **Two program records** (S347): Irvine Valley Art A.A. 10265 and Santa Monica Barbering A.S. 43767, Confirm or
  Needs a fix from the Records view. `program_record_verdicts` was empty at 01:55Z on Oct 9.
- **The guard change** (S347, *"Turn the guard off on updates"*): lands only in a session Sam runs in Accept edits.
- **Sam's reaction** to the docked Sierra full screen (S349's screenshots) and to the veteran map in COBI (S350's).

## Decisions Sam made this run

- **Sheet 55 card 1: Port it** (00:42Z, his own call). Built in #1924. `cpl_memory` `sam-port-veteran-map-2026-10-09`.
- **The Library paste**: *"I pasted the Library update, it said success"* (01:46Z). Read back: version 55, 28
  versions, Sheet 55 first. `cpl_memory` `cpl-library-open-asks-v55-pasted-2026-10-09`.

## What shipped (S350)

- **#1924**: `veteran-sprint-map/build_selfcontained.py` holds the approved template; the mock-up generator is retired.
  The theme follows COBI live through the `storage` event. COBI's iframe opens `?embed=1`, which fills the frame above
  980px (the page had overflowed it by 170 to 280px). Above 980px a marker size floor holds the approved size (the
  frame's map had drawn the stars at 4px). `build_selfcontained.py --check` runs in CI and `check_generated.sh`. The
  a11y targets `veteran-map`, `-dark` and `-embed` pass at nine widths. Lane:
  [`sierra-page-redesign`](reference/lanes/sierra-page-redesign.md).
- **Vault #282** (open at checkpoint): the Sheet 55 card leaves the builder; coverage reads "nothing outstanding".

## Patterns that worked

- **Measure the page in its host's frame**, not only in a window: a Playwright `scrollHeight` against the frame's
  heights, and a marker's `getBoundingClientRect()`, found both faults in minutes.
- **Mutation-test a new check**: three planted faults each failed their check before the rewrite shipped.
- **Order a paired PR by the CI that reads across repos**: the vault's coverage reads tracker `main`, so the tracker
  PR that lifts a NEEDS SAM merges first (adding one goes the other way).

## Safety patterns

- A generated page changes in its builder; `--check` now fails an edit made in the page.
- Never reformulate a write to slip past the connector's confirmation step; a timed-out `cpl_library` write goes to
  Sam as a paste.

## Checkpoint notes

Refreshed: this handoff, the Sierra lane (on #1924), the Library lane, the lessons doc
(`sierra_page_redesign_lessons.md`, S350), one KB note, the receipt marked applied, the docs index (one bullet
rotated to the archive), three `cpl_memory` rows plus one superseded (logged), `kb/queue_status.json`, the UI pass
ledger (veteran map, on #1924), the vault session note. Not needed: `kb/README.md`, `README.md` (it does not describe
the Military Partnerships tab), the pipeline tab, `CLAUDE.md` (the standing-sheet pointer still names Sheet 55, the
latest).

## What S350 let go of at sign-off

PR subscriptions: #1924 (merged), vault #282 and this checkpoint's PR. Check-ins: one safety-net check-in on #1924,
canceled when it merged. No artifact watches.
