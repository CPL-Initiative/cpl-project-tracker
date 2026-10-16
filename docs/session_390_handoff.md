---
title: "Session 390 handoff: Sheet 79's replies, Fresno City's load, the Acalog reader"
date: 2026-10-14
session: 389 (SkyPersimmon)
tags: [handoff, program-requirements, record-shape-5, reread, acalog, decision-sheet]
status: current
superseded: true
superseded_by: session_394_handoff.md
---

# You are Session 390

Your moniker is **SkySaguaro**. Sam's greeting to Session 389 (**SkyPersimmon**, `session_01GDLK36SXCjfLCsBwzGGQ8L`) named S388, which the
CPL Queue routine had already run. S389 took S389 from handoff 389, so check the newest handoff before you trust a greeting.
`list_sessions` first, and agree one writer with any session still working.

## What shipped (S389)

- **#2110 (merged): record shape 5.** Records keep `degree_total`, `ge_units` and `electives_fill_degree` as printed. With no major
  total, the scorer adds blocks, open electives and general education against the degree total (`against: "degree"`).
  Extraction function v7 and Sierra are deployed from main. The pilot extraction now runs on a push only when the commit
  message starts with `[extract]`, because a push of the extraction script spent about $1.6 unasked (run 38560251804).
- **#2111 (merged): the re-read path.** `program_requirement_records_college_reread()` replaces an unchecked row that no person
  has read, from an earlier run, and puts the before-values in the receipt. `force=incomplete` on a read; `step=reread`.
- **#2113 (merged):** COCI Lookup UI pass, clean in light and dark.
- **#2114 (merged):** Palo Verde's 19 re-read ($1.47) and replaced: 11 equal, 8 unequal.
- **#2115 (open, carries this checkpoint):**
  - Cabrillo's 55 re-read ($6.13) and replaced: 13 equal, 42 unequal.
  - Southwestern read ($13.77) and loaded (190 rows).
  - Dated reads gain Southwestern and Fresno City.
  - Display build `361c9f120c6f`, whose apply was dispatched on the branch.
- **#2112 (open): an Acalog reader.** El Camino captured 124 of 135 programs (94 at full coverage). San Joaquin Delta's capture
  was dispatched on the branch.

## Decisions Sam made this run

- Open Asks Sheet 78, 11:18Z: card 1 *Extract both*; card 2 *Record both figures*.
- In chat, ~12:55Z: *"go ahead with Palo Verde's 19 now too"* (`cpl_memory` `sam-pvc-19-reread-now-2026-10-14`).

## Priority, in order

1. **Read [Open Asks Sheet 79](https://claude.ai/artifact/V1vZDZuwRqphwkcPAYVnt8)** (current; `ArtifactData` list `replies`).
   - Card 1 *count*: score a degree total inside the computed span as equal. This is a scorer change plus a rescore of the filed
     records' arithmetic, which needs no model calls. Then post the changed checks through the re-read path and rebuild the display.
   - Card 2 *adt*: for an AA-T/AS-T, electives fill the 60 by statute.
   - Card 3 *extract*: El Camino on `claude/s389-acalog-reader`.
   - Each ruling clears its NEEDS SAM in the harvest lane in the same PR.
2. **Finish #2115.** Confirm the display apply filed its applied record on the branch, merge `main` in if it moved, check that
   `test` is green, and merge. Then write Southwestern's procedure record v1.
3. **Fresno City.** Run 38563582873 was still extracting on `claude/s386-fresno-city`. When it files, diff it, load it
   (`step=load`), build the display (it is already in the dated reads), apply it, write procedure record v1, and merge.
4. **#2112.** Read San Joaquin Delta's `capture_preview.json`. Add a real commit on top (the bot's filing leaves `test`
   unreported), then merge. Palo Verde's 2026-27 catalog after Sunday's census apply (2026-10-18 10:29 UTC): read all 52 with
   `extract=1` and `force` covering them, then `step=reread`.
5. **The UI pass:** `python3 scripts/ui_pass.py --next`.

## Docs to read

- `docs/program_requirements_harvest_lessons.md` (S389)
- `docs/reference/lanes/program-requirements-harvest.md`
- `kb/_program_requirements_score.py` (`degree_check`)

## Patterns that worked

- Diff each re-read record's `source_url`, coverage and arithmetic against main before posting it.
- One display build after several loads.
- A capture-only run with diagnostics in its report fixed the Acalog reader twice without a page-read plan.
- Run `scripts/check_generated.sh` before every push, not only the first.

## Subscriptions and check-ins

At sign-off S389 drops its subscriptions to #2112 and #2115 and cancels check-in `trig_01Mt6pf8zTw1mT5pqLAMUvZt`. The Sheet 79
artifact watch was arming in the background, and S389 holds no other watch. The CPL Queue routine fires next at 05:12 UTC.
