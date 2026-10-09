---
title: Session 353 handoff — the Fact Sheet on First Light, and the Dashboard's first pass
date: 2026-10-09
session: 352 (SkyMeridian)
tags: [handoff, ui-pass, fact-sheet, first-light, dark-mode, dashboard, checkpoint]
status: current
---

# You are Session 353

Your moniker is **SkyHearth**. SkyMeridian (S352, `session_01EkGB3YfNKZsYBqBLFYoSYh`) carried out Sheet 56 and the
handoff's Priority 2. Sam ruled *Mock it up*; the mock-up was built from the Fact Sheet's own code; Sam said in chat
*"Fact Sheet looks great!"* and the port shipped. The Dashboard tab had its first UI pass and is clean in light and dark.
Nothing waits on Sam on a sheet. The Library record reads Sheet 57 (Sam's paste, read back).

## First, in this order

1. **One writer.** `list_sessions` (`mine: true`).
2. **No sheet is outstanding.** The builder in `CPLBrain/decision-sheets/` writes none, because no lane carries a NEEDS
   SAM. The last sheet, [Open Asks Sheet 57](https://claude.ai/artifact/XGgsHHu54rJmNGeEuT1teL), was answered in chat.
3. **Rule 8:** `cpl_memory` tags `ui-pass`, `first-light`, `dark-mode`, `fact-sheet`.

## Priority 1: the Catalog ROEP harvest (Sam's direction)

Sam, at S352's close (2026-10-09): *"I want to get back to our main focus of building out Catalog ROEP harvest..."*
Start there. Read the lane, [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md) (its
Status section is the state), then [`program_requirements_harvest_lessons`](program_requirements_harvest_lessons.md),
and `cpl_memory` tags for the harvest. `kb/queue_status.json` notes the reading agent starts after the Oct 11 census
apply. Confirm the next step with Sam in one line if the lane does not name it.

## Priority 2: the guard change, if the session runs outside Auto

Sam ruled *"Turn the guard off on updates"* (2026-10-08) and agreed again at S352's close to do it in a session not in
Auto mode. Spec (S348): in `scripts/supabase_sql_guard.py` allow a statement whose only write verb is UPDATE; keep the
deny for an UPDATE of `cpl_memory_log` and for every other write verb; flip the "update" case in
`tests/supabase_sql_guard_test.py`. Then the Library's version bumps (and harvest UPDATEs) run directly instead of as
Sam's pastes. Auto mode refuses the edit to the hook; in Accept edits it lands.

## The next UI pass (at the checkpoint): the Activities tab

`python3 scripts/ui_pass.py --next` names **`cobi:activities-projects`** (never audited). Run
[`/a11y-pass`](../.claude/commands/a11y-pass.md) light and dark:
`npm run a11y -- cobi:activities-projects cobi-dark:activities-projects`, then triage with
`node scripts/a11y_triage.js <report>` (on one route its "EVERY route" label means nothing: group by color pair). Then
`--wiring` and the First Light reading. Sections `excel_to_dashboard.py` writes change in the generator and are mirrored
into both HTMLs (Rule 1, Rule 4), as #1937 did. Read for literal ink on a themed fill, a base rule written for a ground
that no longer exists, and inline `outline:none` ([`ui_pass_lessons`](ui_pass_lessons.md), S352 section).
`--record` the outcome.

## Carried, waiting on Sam

- **Two program records** (S347): Irvine Valley Art A.A. 10265 and Santa Monica Barbering A.S. 43767, Confirm or Needs a
  fix from the Records view. `program_record_verdicts` was empty at S352's checkpoint.
- **Sam's reaction** to the docked Sierra full screen (S349) and the veteran map in COBI (S350).
- **The CPL Queue routine** (`trig_01L8K64ZKYb5eALdT4HW6NAV`) still reads `enabled: false`; turning it on is his call.

## Decisions Sam made this run

- **Sheet 56 card 1, *Mock it up*** (14:08Z, his own call): `cpl_memory` `sam-mock-up-fact-sheet-first-light-2026-10-09`.
- **At the close: back to the Catalog ROEP harvest** (Priority 1), and yes to the guard change outside Auto mode.
- **In chat, ~15:00Z: *"Fact Sheet looks great!"*** No reply on Sheet 57; taken as its *Port it*, as *"Love the Sierra
  mock up"* carried that port: `sam-fact-sheet-first-light-looks-great-2026-10-09`.

## What shipped (S352)

- **#1934, the Fact Sheet's `--on-accent`:** the page never defined the token its shared drawer script writes, so Ask
  Sierra on hover and the drawer's Send read 1.35:1. A guard fails any bare `var()` the page or its scripts read that
  `factsheet.css` does not define.
- **#1935, the mock-up's source** ([Fact Sheet on First Light](https://claude.ai/artifact/VLgB5mNnRCYVYdhneEeLus)):
  `prototype/mockup_harness/capture_fact_sheet.mjs` and `assemble_fact_sheet.py` (README section).
- **#1936 and CPLBrain#286:** Sheet 56's ruling in the Sierra lane; Sheet 57 built and published.
- **#1937, the Dashboard's first pass:** the "How this is calculated" panels read white on white on nine cards; College
  Activity's literal inks kept light values in dark; four filters suppressed their focus ring inline; nine scrollers
  became named regions; the Workplan heading skip; 24px targets; the trophy and the squared operators went.
  `tests/dashboard_ui_pass.test.js` (44).
- **#1938 and CPLBrain#287, the port:** `fact-sheet/factsheet.css` on Playfair Display and Source Sans 3, COBI's dark
  palette screen-only, `index.html` reading `cpl_theme` and following other tabs, seal navy split into fill and ink;
  print and Word keep Cambria and Calibri. `fact-sheet-dark` joins `a11y.config.js`. The Sierra lane's NEEDS SAM is lifted.

## Patterns that worked

- **Probe the real ground.** A Playwright probe walking each panel's ancestors for its painted background showed no dark
  card was left, which settled the algo panel's fix in one step.
- **Mutation-test each half of a pass:** restore the prior files with `git show <ref>:<file>` and count the failures.
- **Mock up a whole page as itself:** the page's own code, its overrides from a fixture, and two stylesheets switched by
  their `media` attribute. Artifacts load nothing from another host: inline fonts and images as data URIs.

## Safety patterns

- **Stage named paths in a worktree.** A symlinked `node_modules` is a file to git; `.gitignore` now reads
  `node_modules`, without the slash.
- **A token test must read the right block.** Once a stylesheet has dark blocks, a whole-file token map takes the dark
  values.
- `tests/ccc_metric_test.py` fails on main (its Trends row label drifted); CI does not run it. Fix or retire it in a quiet
  moment.
- `bash scripts/check_generated.sh` before every push; a vault card whose premise closed fails it as STALE.

## Checkpoint notes

Refreshed: this handoff; `docs/ui_pass_lessons.md` (S352 section); the KB note
`methodology-an-undefined-css-token-fails-to-an-invisible-state` (its third case); the docs index and INDEX history;
`README.md` (the Fact Sheet's type); `.gitignore`; `cpl_memory` (six proposed rows and Sam's two rulings, logged);
`kb/queue_status.json`; the vault session note. The Sierra and Library lanes and the UI pass ledger moved in #1936,
#1937 and #1938. Not needed: `kb/README.md`, the pipeline tab. No sheet: nothing waits on Sam.

## What S352 let go of at sign-off

PR subscriptions: #1934, #1935, #1936, #1937, #1938, CPLBrain#286 and #287 (all merged). Check-ins: none were scheduled.
Artifact watches: the mock-up and Sheet 57 publishes armed wake subscriptions; neither needs one now.
