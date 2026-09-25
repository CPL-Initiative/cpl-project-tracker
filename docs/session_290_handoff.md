---
title: Session 290 handoff — the TOP lookup corrected, exams sectored from their titles, the TOP/CIP question left to its own lane
date: 2026-09-25
session: 288 (SkyZ)
tags: [handoff, eacr, cip, top-code, program-course-graph, decision-sheets]
status: current
---

# You are Session 290

Your moniker is **SkyField**. S288 (SkyZ) continued SkyMatrix's EACR line from
[`session_288_handoff.md`](session_288_handoff.md). SkyLane's parallel line wrote
[`session_289_handoff.md`](session_289_handoff.md) for SkyRelay (funding lane, CI).
This file is the highest-numbered and carries both lines' pointers; read 289 for the
funding lane.

## ✅ WHAT SHIPPED (main)

- **[#1692](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1692) — `TOP_Code_Lookup.xlsx` column D corrected against
  the TOP manual.** Column D routes MAP's TOP id to a CIP family, nothing read it
  before #1681, and it disagreed with its own program title on 81 of 198 rows (History
  at 2203, which is Ethnic Studies; Fire Technology at 2130, no such code).
  `kb/_correct_top_lookup_code4.py`, receipt
  `kb/receipts/top_code_lookup_code4_2026-09-25_s288.json`, guard
  `tests/top_code_lookup_code4_test.py` (13 checks, in CI beside
  `tests/eacr_matrix_payload_test.py`, which had run nowhere). Live since the
  2026-09-25 13:16 UTC build and confirmed in Chromium: matrix rows with no sector
  890 → 379 (dropdown: 449 cards), 328 cards re-sectored.
- **Exams are sectored from their titles, and title rules fill every gap TOP leaves** (Sam's second
  ruling, below). `kb/reference/eacr_cip_title_rules.json` (37 ordered patterns plus an exact-title table),
  applied FIRST for Standardized Assessment cards and as the FALLBACK for the rest. Measured on the
  2026-09-25 payload: cards without a sector 449 → 3, and 84 exams move out of TOP's general-education codes
  (09 Communication, 24 Liberal Arts) into their subjects; a random 25 all read right. Guard:
  `tests/eacr_matrix_payload_test.py` §8c (73 checks; 54/73 on the old generator). Merged as
  [#1693](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1693); live since the 14:16 UTC build and confirmed in Chromium at 390 and 1440
  ("No CIP assigned yet (3)"; AP Chemistry under 40).
- **`check_hooks_live.py --fix` now applies the stop-hook patch.** The repo's SessionStart hook never loads in
  a three-repo session, so the "N unpushed commit(s)" false positive returned after #1693's squash-merge
  deleted the branch's remote. The opening line's `--fix` runs `scripts/patch_stop_hook.py` and prints a
  `STOP HOOK:` line when it patched anything (tested end to end on an unpatched copy; wiring pinned in
  `tests/install_prompt_guards_test.py`).
- **This checkpoint:** the EACR lane and lessons doc; KB note
  `methodology-a-program-cip-labels-the-program-not-its-courses`; Rule 7's CIP line and the TOP note carry
  Sam's first ruling; memory rows.

## SAM'S DECISIONS THIS RUN (2026-09-25)

1. Verbatim, unprompted, after #1692: *"TOP is not reliable since it is entered by the colleges with no
   effective checks. The new CIP system will be better. The course CIPs are only partially set now the the
   program CIPs are almost 100% reliable."* Captured in the vault
   (`03-professional/braindumps/braindump-2026-09-25-1315-program-cip-is-the-reliable-anchor.md`) and
   `cpl_memory`.
2. On the session's question of where to get course CIPs: *"CIP sector is best ... I don't want this to be
   a big deal. We only need the CIP sector on this tab for filter and quick categorization. I would be just
   as happy if you used your own analysis from your knowledge to create the sectors yourself. I don't want
   to get sucked into the top/CIP black hole, which is it's own project."* So the course-CIP ask was
   withdrawn (it never reached the published sheet) and the title rules shipped instead.

## ⛔ READ FIRST

- **The EACR's CIP sector is a filter and a quick grouping, and nothing more (Sam's ruling 2).** Do not
  open the TOP/CIP question from this tab: course CIPs, program membership and the crosswalk belong to the
  TOP to CIP lane. A misfiled credential is one line in `kb/reference/eacr_cip_title_rules.json`.
- **Do not route a course's CIP through the programs that list it.** Measured: a course takes the field of
  every program that requires it (Elementary Italian → Culinary); 8 better, 15 worse on a random 30. KB note
  above.
- **The open-asks sheet holds 14 cards and was not republished**; its store is keyed to the 21 cards Sam
  answered (To-Do `s283-fable-open-asks-renumbering`).

## THE NEXT CONCRETE STEP

1. **Sam looks at the grid** (unchanged from 288): the 52px rows, the title clamp, the 0.62rem figures,
   the panel.
2. **Carryover, unchanged:** the ASCCC roster when Pedro's report lands; the ESL merging decision sheet;
   the funding lane's items in handoff 289.

## ⚠️ Watch for

- **A join rate is not a correctness rate.** #1681 measured that 163 of 198 ids
  resolved; 46 of those resolved to the wrong program. Check a dormant column against
  its authority when a feature first reads it.
- **Check a random sample, not only the biggest disagreement groups.** The biggest
  groups were all career-technical and all favored the program route. The title rules
  passed the same test: a random 25 of the 84 moved exams all read right.
- `CLAUDE.md` is still over its budget (1.03×); this run's edits to Rule 7 and the stop-hook line
  kept their length.
- **If the stop hook says a branch level with `main` has unpushed commits**, it is the stale remote ref
  of a squash-merged branch: `git rev-list HEAD --not --remotes --count` reads 0. Never push to quiet it
  (a pushed branch identical to `main` cannot be deleted from a session); run `--fix` or drop the ref.

## Read in order

This file · [`lanes/eacr-exhibit-cr-adoption`](reference/lanes/eacr-exhibit-cr-adoption.md) ·
[`methodology-a-program-cip-labels-the-program-not-its-courses`](kb-notes/methodology-a-program-cip-labels-the-program-not-its-courses.md) ·
`docs/eacr_scope_lessons.md` (the 2026-09-25 section) · handoff 289 for the funding lane.

## Things that worked

- **Reproduce before you measure.** The harness recomputed all 3,070 published sectors
  from the payload with the generator's own functions (0 mismatches) before any
  after-number was trusted, and the build matched its prediction exactly (449 / 379).
- **A guard re-derived, never imported.** The column-D test reads the TOP manual
  itself, and fails 3/13 on the old workbook.

## Safety patterns to honor

Rule 4 · Rule 5 · Rule 7 (TOP last; program CIP labels programs) · Rule 10 (fresh
read, INSERT-only, receipt) · plain words, no glyphs · verify with a real browser ·
budget SQL in prompts · end the turn during a wait.

---

*Greetings, you are Sky**Field** (Session 290), see Sky**Z**'s handoff —
`docs/session_290_handoff.md` — let's keep rolling with our queue.
First, run `python3 scripts/check_hooks_live.py --fix` and paste its LIVE
line, no investigation.*
