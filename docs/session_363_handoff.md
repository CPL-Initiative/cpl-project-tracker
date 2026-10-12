---
title: Session 363 handoff — Long Beach City read again from its own pages; noncredit equivalent units; Sheet 62 carried out
date: 2026-10-11
session: 362 (SkyAlder)
tags: [handoff, program-requirements, harvest, phase-2, long-beach-city, noncredit, equivalent-units, sheet-62]
status: current
superseded: true
superseded_by: session_368_handoff.md
---

# You are Session 363

Your moniker is **SkyCedar**. SkyAlder (S362, `session_01PpmwWQ91L2cz5NqHguPGR3`) checkpointed at the context warning
(about 13:50Z, 2026-10-11) and signed off; it holds no check-in, no PR watch and no artifact watch.

## First, in this order

0. **One writer.** `list_sessions`. S362 holds nothing.
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `long-beach-city`, `noncredit`. S362 rows:
   `sam-full-lbcc-read-after-trial-2026-10-11`, `sam-sheet-62-remove-wrong-page-rows-2026-10-11`,
   `sam-noncredit-hours-equivalent-units-2026-10-11`, `sam-nc-equivalent-units-lecture-rate-2026-10-11`,
   `sam-no-sierra-equivalent-units-2026-10-11`, `roep-hidden-course-index-lbcc-2026-10-11`,
   `roep-receipt-row-text-not-json-2026-10-11`.
2. **No sheet is open.** Sheet 62 (https://claude.ai/artifact/3YPoCV7vJHiMe5SdPV8vzj) is answered ("remove them") and
   carried out (#1983, vault #299).

## In flight

1. **Long Beach City, read again (Sam: "go ahead with the full Long Beach read after the trial").** The first read
   (run 38105864413, $22.66, branch `claude/s361-lbcc`) is **not loaded and never will be**: the pages hide an A-Z course
   index naming every course and keep Program Requirements in a hidden tab, so the reader handed the model the index
   (367 of 379 records empty). #1980 fixed the reader: the visible text when it names half the courses, else the
   visible text plus each hidden tab panel read cell by cell (`innerText+tabs`), `textContent` last.
   - **The trial** (12 programs, `limit=12`, extraction on) was dispatched about 12:26Z on `claude/s362-lbcc`
     (cut from #1980's head) and lands about 14:40Z. Read `kb/program_requirements_college/long_beach_city/` on that
     branch: `sources.json` `text_from` should read `innerText` or `innerText+tabs`, the records should carry blocks,
     and no record's notes should mention a course index.
   - **If the trial is good:** merge `origin/main` into `claude/s362-lbcc` first (it lacks #1983's `places_none` load
     guard and #1984), then dispatch `program-requirements-college.yml` `step=read extract=1 limit=0` from it (about
     2 h 15 m, about $22; the trial's records are kept). Then `step=load`, add Long Beach City to the builder's dated
     reads (`kb/program_requirements_pilot/map_cr_by_course.json`, `registry_read.json`), one display build and
     `step=display` (Sam's standing go), regenerate the dependency map after the applied record, PR, merge on `test`.
   - **If the trial is not good:** do not spend the full read; diagnose from the records' notes and `sources.json`
     (the run's artifact is unreachable from the sandbox: the proxy refuses the blob host).
2. **#1984** (noncredit equivalent units): merged by S362 if `test` passed before sign-off; if still open, merge it on
   `test`. Its display build `2a73f45c9c84` is already applied (1,210 rows; 94 carry `equivalent_units`).

## Sam's decisions this session

- ~12:35Z: *"go ahead with the full Long Beach read after the trial"*.
- ~12:55Z: *"remove them"* (Sheet 62 card 1): the 18 wrong-page rows removed with a receipt (#1983).
- ~13:05Z: noncredit hours as equivalent units, *"note they are equivalent, not awarded units"*; ~13:20Z: *"We don't
  need Sierra with equivalent units. I'm a little afraid they'll be misconstrued as real units rather than estimated
  equivalents"*; ~13:35Z: *"Let's use lecture rate just for simplicity's sake... handy when comparing mirrored courses
  ... and for funding based on equivalent FTES... note they are for estimating purposes only"*. His bands: lecture
  16-18 h = 1.0, 32-36 = 2.0, 48-54 = 3.0. Built as hours / 16 rounded down to the half unit; his note put the first
  half unit at 63 h (9 above 54), the rule puts it at 56: told him, no reply yet.

## What shipped (S362)

#1980 (the reader: visible text, hidden tabs cell by cell, `places_none` scoring), #1981 (RCCD's three Humanities,
Philosophy & Arts programs, display build `f1de75baa344`), #1982 (Sheet 62's marker), #1983 (the 18 removed, the
load and display guard, build `57100ecf39c0`), #1984 (equivalent units, build `2a73f45c9c84`), vault #298 and #299.
KB note: `methodology-a-page-can-hide-text-that-names-every-course`.

## Safety patterns

- A delete receipt reads each row as `to_jsonb(r)::text`, never as JSON: the connector re-serializes numbers
  (`0.0` came back `0`), and the md5 guard then fails. A result over the token limit lands in a local file: parse it there.
- `apply_migration` ran the guarded delete this time (S360's timed out); try it once, then hand Sam the paste.
- A dispatch must not race its own push: push, then dispatch (S362 checked the run's `head_sha` before trusting it).
- A workflow's own commit (an applied record) starts no CI: the PR's head then has no `test`; push a real change.

## Not refreshed / skipped this checkpoint

The UI pass (context; the next session takes one view), kb/README and README (no structure change; the two pages'
new line is in the lane), the Pipeline tab (the M-ID pipeline did not move), §11 (Phase 2's state did not change).
CPL Pathways' per-college display file split waits until Long Beach City's display build lands.

## Sign-off line for Sam

Greetings, you are SkyCedar (Session 363), see SkyAlder's handoff — `docs/session_363_handoff.md` — let's keep rolling with our queue.
