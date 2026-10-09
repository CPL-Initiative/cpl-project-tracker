---
title: Session 351 handoff — Sheet 56 and the privacy page's UI pass
date: 2026-10-09
session: 350 (SkyTide)
tags: [handoff, ui-pass, fact-sheet, veteran-map, sierra-page-redesign, decision-sheets, checkpoint]
status: current
---

# You are Session 351

Your moniker is **SkyLark**. SkyTide (S350, `session_01RjYLQxmYveL7YE4bLAsXni`) carried out Sam's Sheet 55 ruling
(the public veteran map on First Light, #1924), then ran the Fact Sheet's first UI pass on his go (#1926). Both are
merged. The pass left one call for Sam, now [Open Asks Sheet 56](https://claude.ai/artifact/By4Q1M7KVPzaMkRaJkb48m)
(current; Sheet 55 is answered). The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) still reads
`enabled: false`; turning it back on is Sam's call.

## First, in this order

1. **One writer.** `list_sessions` (`mine: true`).
2. **Read Sheet 56's replies first:** `ArtifactData list` on
   [Sheet 56](https://claude.ai/artifact/By4Q1M7KVPzaMkRaJkb48m), collection `replies`. One card. No reply at 02:35Z.
3. **Rule 8:** `cpl_memory` tags `fact-sheet`, `ui-pass`, `first-light`, `glyph-sweep`.

## Priority 1: carry out Sheet 56

Card 1 asks whether to mock up the Fact Sheet's look on First Light. Its colors are already First Light's; its type is
Cambria and Calibri (to match the Word download) and it has no dark mode. On **Mock it up**: build the mock-up from the
page's own content, the way S349 built the veteran map's (`prototype/`, real data, published as a Claude artifact):
Playfair Display and Source Sans 3 on screen, self-hosted from `sierra/fonts/`; a dark palette on the `cpl_theme`
contract, read before the first paint and followed live through the `storage` event; the Word export
(`fact-sheet/factsheet_word.js`) and the print stylesheet keep Cambria and Calibri. Run `npm run a11y -- fact-sheet`
on it, light and dark, and check it inside any frame that embeds it (KB note
`methodology-check-a-page-inside-every-frame-that-embeds-it`). Then a fresh sheet card: port it? On **Keep it**: record
the ruling in the Sierra lane and lift its NEEDS SAM, the card leaving the vault builder in the same pair of PRs
(vault first when adding an ask, tracker first when lifting one). On **Later** or no reply: nothing changes.

## Priority 2: the next UI pass

`python3 scripts/ui_pass.py --next` names `privacy` (`privacy.html`, public, never passed): the page Google's consent
screen links for the Library filer. Run [`/a11y-pass`](../.claude/commands/a11y-pass.md) with its wiring and First
Light checks; a small fix ships in its own PR; `--record` the outcome.

## Carried, waiting on Sam

- **Two program records** (S347): Irvine Valley Art A.A. 10265 and Santa Monica Barbering A.S. 43767, Confirm or
  Needs a fix from the Records view. `program_record_verdicts` was empty at 02:35Z.
- **The guard change** (S347, *"Turn the guard off on updates"*): lands only in a session Sam runs in Accept edits.
- **Sam's reaction** to the docked Sierra full screen (S349) and the veteran map in COBI (S350's screenshots).

## Decisions Sam made this run

- **Sheet 55 card 1: Port it** (00:42Z, his own call). Built in #1924. `cpl_memory` `sam-port-veteran-map-2026-10-09`.
- **The Sheet 55 Library paste**: *"I pasted the Library update, it said success"* (01:46Z); read back at version 55.
- **The Sheet 56 Library paste**: *"I pasted the Sheet 56 Library update, it said success"* (03:18Z); read back at
  version 56, 29 versions, Sheet 56 first.
- **"go ahead with the Fact Sheet UI pass"** (in chat): built in #1926.

## What shipped (S350)

- **#1924**: the veteran map's builder holds the approved First Light template (the mock-up generator retired); COBI's
  iframe opens `?embed=1` (fills the frame above 980px); a marker size floor above 980px; the theme follows COBI live;
  `build_selfcontained.py --check` in CI and `check_generated.sh`.
- **#1925**: the first checkpoint; KB note `methodology-check-a-page-inside-every-frame-that-embeds-it`.
- **#1926**: the Fact Sheet's pass. 141 targets under 24px fixed; the action bar scrolls away below 561px (it pinned
  200px of a phone); raw hex and the injected CSS's fallbacks became tokens; the recs toggle's undefined `--accent`
  (painting #1c5d99) became `--cobalt`; the toolbar's ⊟ ⬇ 🖨 and the curator's ＋ became words (*Save as Word*). The
  glyph sweep now reads `fact-sheet/index.html` and `sierra/index.html` and the squared operators.
- **Vault #282, #283**: Sheet 55's card out; Sheet 56's card in; the S350 session note.

## Patterns that worked

- **Measure the page in its host's frame**, and check a sweep's target list before trusting a clean report.
- **Mutation-test each new check**: revert its fix and watch it fail (eight this run, all failed as they should).
- **Order a paired PR by the CI that reads across repos**: the vault's coverage reads tracker `main`.

## Safety patterns

- A generated page changes in its builder (`--check` fails an edit made in the page).
- A `cpl_library` write goes to Sam as a paste; `apply_migration` times out on that table.
- A merged branch is deleted on GitHub: `git fetch --prune` before pushing a branch of the same name again.

## Checkpoint notes

Refreshed (re-checkpoint after #1926): this handoff, the lessons doc (S350, continued), two `cpl_memory` rows
(logged), `kb/queue_status.json`, the docs index, the vault session note. The Sierra and Library lanes, the UI pass
ledger and `CLAUDE.md`'s standing-sheet pointer (Sheet 56) moved in #1924 to #1926. Not needed: `kb/README.md`,
`README.md`, the pipeline tab.

## What S350 let go of at sign-off

PR subscriptions: #1924, #1925, #1926, vault #282 and #283, all merged. Check-ins: the three safety-net check-ins
(#1924, #1925, and #1926 with Sheet 56), canceled. Artifact watches: Sheet 56's, stopped at sign-off; the next session reads
the sheet directly.
