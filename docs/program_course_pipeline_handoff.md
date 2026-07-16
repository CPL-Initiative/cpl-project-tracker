---
title: "Program-Course pipeline — continuation handoff (for a fresh session)"
date: 2026-07-16
tags: [handoff, program-course, coci, datamart, cpl-pathways, top-dethroning]
related:
  - "[[cpl_pathways_lessons]]"
  - "[[methodology-top-is-a-last-in-line-signal]]"
artifacts:
  - kb/_build_program_course_graph.py
  - kb/_fetch_program_course_files.py
  - kb/reference/cb_course_basic_fall2025.csv
  - tests/fixtures/program_course_sample.csv
---

# Program-Course pipeline — continuation handoff

You're picking up the **program→course pipeline** that gives the CPL-Pathways BS
cards their *official course lists* and retires the TOP-proxy membership guess
(see `methodology-top-is-a-last-in-line-signal`). Everything below is on `main`.

## The goal
For each credential (BS/AS/certificate), show its **real required courses** —
not guessed from TOP. Then the pathway card can show the **official BS course
list** (always shown, CPL-or-prompt) + **qualifying AS/certificate CPL chips**,
and the CCR engine stops keying membership on TOP4.

## The three files (the join)
`program_course_graph.json` = **program metadata ⋈ program→course membership ⋈
course attributes**:

| Piece | Grain | Have it? | Notes |
|---|---|---|---|
| `tmc/source_data/coci_program_export_2026-06-17.csv` | program | ✅ in repo | program → title / award / TOP / CIP / status. Stale-ish (fresher = the Data Mart **"Program File"**). |
| **Program Course File** (Data Mart) | program→course | ⚠️ **only a 1-college sample** | `tests/fixtures/program_course_sample.csv` (Alameda). The MEMBERSHIP link: `Program Control Number → Course Control Number`. **THIS is the missing piece — need it for ALL colleges.** |
| `kb/reference/cb_course_basic_fall2025.csv` | course | ✅ **NEW, committed 2026-07-16** | The MIS **Master Course File** (CB_* Course Basic elements), 109,898 courses · 118 colleges · Fall 2025. Richer than `coci_course_list.xlsx`. |

### ⚠️ The file Sam grabbed on 2026-07-16 was the **Master COURSE File**, not the join
`cb_course_basic_fall2025.csv` is course-level with **no program identifier**
(`CB_CRCC_ID` == course id). It does NOT provide membership. The **Program Course
File** (a *different* Data Mart dropdown option — "College Master Course/Program
File" → File Type = **Program Course File**) is the join we still need for all
colleges. Options to get it: (a) Sam exports "Program Course File" full; (b) the
COMIS AIP; (c) finish the DevExpress fallback scraper (recipe below).

### Why the CB master file is still a big win (use it!)
It carries fields `coci_course_list.xlsx` lacks — most importantly for pathways:
- **`CB_UPPDER_DIVISION_STATUS`** (`A` = upper-division; 1,956 rows) — *directly*
  identifies the **BS upper-division core** (the courses with no CPL) vs
  lower-division. This is exactly what the BS-card "official courses" view needs.
- `CB_TRANSFER_STATUS` (A=CSU+UC / B=CSU / C=neither), `CB_SAM_CODE` (CTE A–E),
  `CB_CREDIT_STATUS`, `CB_GENERAL_EDUCATION_STATUS`, `CB_SUPPORT_COURSE_STATUS`,
  `CB_BASIC_SKILLS_STATUS`, units max/min, funding/noncredit category.
- Join key = **`CB_CONTROL_NUMBER`** (`CCC0000…`), same as `coci_course_list`'s
  `CourseControlNumber` and the Program Course File's `Course Control Number`.

## What's already built (all tested, on main)
- **`kb/_build_program_course_graph.py`** — the assembler (pure `assemble()`),
  proven on the Alameda sample (Art A.A. → 11 courses/31u, Aviation Airframe
  A.S. → 11/44u). Test `tests/program_course_graph_test.py` (11/11). NO-OPs until
  `kb/reference/coci_program_course_file.csv` exists.
- **`kb/_fetch_program_course_files.py`** + `.github/workflows/program-course-fetch.yml`
  — the Playwright FALLBACK scraper. **Finding: the Data Mart is a DevExpress ASPx
  app** — no native `<select>`, dropdowns are `ASPxComboBox` widgets; buttons
  `#ASPxRoundPanel1_RunReportASPxButton_I` (View Report) / `#buttonSaveAs_I`
  (Export). To finish: drive combos via `ASPxClientControl.GetControlCollection()`
  → `SetSelectedIndex` → View Report → CSV → Export. Diagnostics dump is wired.

## The plan (do in order)
1. **Get the full Program Course File** (all colleges) → drop at
   `kb/reference/coci_program_course_file.csv`.
2. **Enrich the course side**: point `_build_program_course_graph.py`'s
   `load_course_meta()` at `cb_course_basic_fall2025.csv` (or merge it with
   `coci_course_list.xlsx`) so each course carries **upper-division status** +
   transfer + SAM. Add those to the emitted course nodes.
3. `python3 kb/_build_program_course_graph.py` → `kb/program_course_graph.json`;
   verify counts + join rate (the Active/Approved filter should push it well past
   the sample's 77%).
4. **Wire into `cpl_pathways.js`**: the **official BS course list** (always shown;
   mark the upper-division core via `CB_UPPDER_DIVISION_STATUS`; ⊕ adoptable-CPL
   where a peer articulates the same course; "Request a review / faculty:
   articulate" prompt where none) + the **AS/certificate chips** (per qualifying
   feeder program: "Fire Technology AS — CPL for N certs", hover = exhibits).
   Retire the CCR engine's TOP4 membership proxy in favor of the real join.
5. Tests + real-Chromium verify; PR; done.

## Design context (from this session)
- **The AS/BS reframe (Sam):** entry to a BS requires a qualifying associate
  degree, so feeder CPL counts toward THAT AS, not the BS. BS cards show BS
  courses + a "CPL available for the qualifying AS" callout; AS/AA/cert programs
  become their own pathway entries. Interim shipped (#803/#804: counts not the
  inflated unit sum + the callout). The full build is steps 1–4 above.
- Full story: `docs/cpl_pathways_lessons.md` (2026-07-16 StarBoard section) +
  `docs/cpl_pathways_handoff.md` next-step #0.

## Session ledger (2026-07-16, StarBoard)
TOP dethroned (#799/#800), Miramar card reframed (#803/#804), program-course
pipeline built + proven (#805/#806), master course file committed here. Seven PRs
merged. Side-lane discipline honored: `cpl_todos.json` + the numbered
`session_<N>_handoff.md` left to the CCR mainline.
