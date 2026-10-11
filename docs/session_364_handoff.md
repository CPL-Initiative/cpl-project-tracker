---
title: Session 364 handoff — Long Beach City's full read lands; load, display, PR; Sheet 63
date: 2026-10-11
session: 363 (SkyCedar)
tags: [handoff, program-requirements, harvest, phase-2, long-beach-city, decision-sheet]
status: current
---

# You are Session 364

Your moniker is **SkyJuniper**. SkyCedar (S363, `session_01JnVSyV6sQrgR97iE7eW17h`) checkpointed at about 16:10Z on
2026-10-11 while Long Beach City's full read ran. If S363 is still working when you start, it is the one writer until it
signs off: `list_sessions`, and check what it holds (a `send_later` for about 17:55Z on the full read, an artifact
watch on Sheet 63).

## First, in this order

0. **One writer.** `list_sessions`; agree with S363 if it is still working.
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `long-beach-city`. S363 rows:
   `sam-full-lbcc-read-if-trial-2-passes-2026-10-11`, `sam-load-display-lbcc-after-full-read-2026-10-11` (both Sam's
   words, verified), `roep-lbcc-tab-bar-inside-nav-2026-10-11`, `roep-page-probe-exists-college-page-read-2026-10-11`.
2. **Read Sheet 63's replies before anything else:** https://claude.ai/artifact/5ZCSHeoskLABduzGYcf4Bp (current; one
   card; `ArtifactData` `list` on `replies` and `replies/done`). Sheet 62 is answered and carried out.

## In flight

1. **Long Beach City's full read** (run 38152016534, `claude/s363-lbcc`, head `a94dc08`, dispatched 15:37Z, about
   2 h 15 m and $22; the trial's 12 records are kept). When it files:
   - Check `kb/program_requirements_college/long_beach_city/summary.json` and `sources.json`: `source.text_from` should
     read `innerText+tabs` on most programs. Count records with no blocks and records that place none (a program with
     no page of its own can still win a page through the hidden index, as Engineering A.S. did; `places_none` keeps
     those out of the load and the display).
   - **Sam's go stands** (*"load and display Long Beach when the full read lands"*): dispatch
     `program-requirements-college.yml` `step=load college="Long Beach City College"` on `claude/s363-lbcc`; read the
     receipt it commits; then `python3 kb/_build_roep_display.py` (the dated reads already name Long Beach City:
     33 course codes, fingerprint 5c7d3a90393e710daa4f686a2f56c917), commit, push, dispatch `step=display`, verify by
     the combined md5 against the receipt, `python3 kb/_build_dependency_map.py`, `bash scripts/check_generated.sh`,
     open the PR from `claude/s363-lbcc`, merge on `test`.
   - The applied record is a workflow commit, which starts no CI: push a real change before waiting on `test`.
2. **Sheet 63, card 1:** where a half unit starts for noncredit hours. Built as hours / 16 to the half unit (24 h = 1.5,
   56 h = 3.5); S362's note recorded Sam's first half unit at 63 h. 266 of 607 converted hour figures show a half unit;
   140 would change under "9 hours past the band". On his answer: record it in the harvest lane (drop its NEEDS SAM),
   remove the card from `CPLBrain/decision-sheets/_build_open_asks_decision_sheet.py` in the same change, and rebuild
   the display if the rule changes.
3. **The UI pass** names `cobi:budget` (Budget, never audited). S363 meant to run it after this checkpoint; if
   `kb/ui_pass_ledger.json` still shows it unrecorded, it is yours: `/a11y-pass` on that view, a fix PR, then
   `python3 scripts/ui_pass.py --record cobi:budget "..."`.

## Sam's decisions this session

- ~14:37Z: *"go ahead with the full Long Beach read if trial 2 passes"*; trial 2 passed and the full read started.
- ~14:40Z: *"merge #1986 when test passes"*; merged.
- ~14:45Z: *"load and display Long Beach when the full read lands"*.
- ~15:50Z: *"checkpoint while the read runs"*.

## What shipped (S363)

#1986 (the reader counts a tab bar's own tabs inside a nav; a hidden panel naming no course is left out), Long Beach
City in the dated reads (on `claude/s363-lbcc`, in the coming PR), Open Asks Sheet 63, this checkpoint. KB note
`methodology-test-a-reader-fix-on-the-page-it-failed-on`; `methodology-a-page-can-hide-text-that-names-every-course`
gained the nav section. The diagnostic branch `claude/s363-lbcc-probe` holds four pages' HTML and is not for merge.

## Safety patterns

- A reader fix is checked on the real page before a paid read: the repo's page reader is `kb/_college_page_read.py`
  with a plan in `kb/college_reads/` (no model calls). Saved HTML loads without the site's CSS; hide what the live page
  hides before you judge visibility.
- A push touching `kb/_program_requirements_pilot.py` runs the pilot capture (read-only, page loads only). Read every
  workflow's `push.paths` before pushing a reader change.
- Push, then dispatch, then confirm the run's `head_sha`.
- `cpl_memory.summary` has a length check: put context in `detail`.

## Not refreshed / skipped this checkpoint

The Pipeline tab (the M-ID pipeline did not move), kb/README and README (no structure or surface change), §11's row
(Phase 2's state did not change; the standing-sheet pointer moved to Sheet 63). The UI pass is described above.

## Sign-off line for Sam

Greetings, you are SkyJuniper (Session 364), see SkyCedar's handoff — `docs/session_364_handoff.md` — let's keep rolling with our queue.
