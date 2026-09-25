---
title: Session 290 handoff — the TOP lookup corrected, the program-CIP route measured and not shipped, the course CIP asked for
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
- **This checkpoint:** the EACR lane and lessons doc; KB note
  `methodology-a-program-cip-labels-the-program-not-its-courses`; Rule 7's CIP line
  and the TOP note carry Sam's ruling; card 15 on the open-asks sheet; memory rows.

## SAM'S DECISIONS THIS RUN (2026-09-25)

Verbatim, unprompted, after #1692: *"TOP is not reliable since it is entered by the
colleges with no effective checks. The new CIP system will be better. The course CIPs
are only partially set now the the program CIPs are almost 100% reliable."* Captured
in the vault (`03-professional/braindumps/braindump-2026-09-25-1315-program-cip-is-the-reliable-anchor.md`)
and `cpl_memory`. The session withdrew its ask for MAP's TOP table on the strength of
it.

## ⛔ READ FIRST

- **Do not route a course's CIP through the programs that list it.** Built and
  measured before shipping: it sectors 2,244 of 3,000 rows and wins on career-technical
  credentials, but a random 30 of the 682 rows it would move read 8 better, 15 worse,
  7 the same (Elementary Italian → Culinary, Calculus → Physical Sciences). The method
  is in `docs/eacr_scope_lessons.md` (2026-09-25); the scripts lived in the scratchpad.
- **The course CIP is the route, and we hold no source for it.** The only CIP columns
  in Supabase are on `coci_college_programs`; the COCI course list and Program Course
  File have none. Card 15 asks Sam. Its premise `p_no_course_cip` retires the card
  once `excel_to_dashboard.py` reads a `course_cip`.
- **The open-asks sheet was rebuilt, not republished** (15 cards). Its store is keyed
  to the 21 cards Sam answered; republishing needs a fresh `SHEET_ID` and artifact
  (To-Do `s283-fable-open-asks-renumbering`).

## THE NEXT CONCRETE STEP

1. **Sam's answer on card 15.** When a COCI course export with a CIP field lands:
   join it on the course control number (MAP course → COCI course: college by MIS code
   through `kb/college_identity/<date>/crosswalk.json`, course number without leading
   zeros; both recipes are in the lessons section), read the course CIP first and the
   TOP route last, add `cip_source` to the card, and measure a random sample of moved
   rows before shipping.
2. **Sam looks at the grid** (unchanged from 288): the 52px rows, the title clamp, the
   0.62rem figures, the panel.
3. **Carryover, unchanged:** the ASCCC roster when Pedro's report lands; the ESL
   merging decision sheet; the funding lane's items in handoff 289.

## ⚠️ Watch for

- **A join rate is not a correctness rate.** #1681 measured that 163 of 198 ids
  resolved; 46 of those resolved to the wrong program. Check a dormant column against
  its authority when a feature first reads it.
- **Check a random sample, not only the biggest disagreement groups.** The biggest
  groups were all career-technical and all favored the program route.
- `kb/program_course_graph.json` is gitignored (70 MB) and built in
  `daily-dashboard.yml` step 4a1b, after `excel_to_dashboard.py`; a generator that
  needs it must move the build ahead of the generator.
- `CLAUDE.md` is still over its budget (1.03×); the Rule 7 edit added about 65 bytes.

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
