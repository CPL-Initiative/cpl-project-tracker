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
| `kb/reference/coci_program_course_file.csv.gz` | program→course | ✅ **FULL EXPORT, committed 2026-07-16 (gzipped, 8.4 MB)** | The MEMBERSHIP join for ALL colleges — **401,163 rows · 23,996 programs · 121 colleges**. Compact headers (`ProgramControlNumber`, `CourseControlNumber`, `CrsId`, numeric `CollegeCode`). The assembler reads it directly. |
| `kb/reference/cb_course_basic_fall2025.csv` | course | ✅ committed 2026-07-16 | The MIS **Master Course File** (CB_* Course Basic elements), 109,898 courses · 118 colleges · Fall 2025. Richer than `coci_course_list.xlsx`; the assembler uses it for the `CollegeCode → name` map. |

### ✅ The join is LANDED and PROVEN (2026-07-16)
`python3 kb/_build_program_course_graph.py` now runs on the full export in ~20s →
**20,044 Active/Approved programs, 96% of courses resolved**. The loader handles
BOTH schemas (compact full-export + spaced single-college) and resolves the numeric
`CollegeCode` via the CB file. **Leading zeros preserved** (all strings — Sam's
note; e.g. control `07200`). Proven end-to-end on **Miramar Public Safety
Management BS** (control `44515`) → its real **22-course / 68-unit** list: the
PSMA 401–490 core **plus** `ENGL 402`, `PADM 420` (Ethics in Public Service),
`SOCO 410` — cross-subject upper-div courses the TOP-proxy could never have found.

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

## The plan — remaining work (step 1 DONE; do the rest in order)
1. ~~Get the full Program Course File~~ ✅ **DONE** — committed gzipped; assembler
   runs at 96%. Regenerate any time: `python3 kb/_build_program_course_graph.py`
   (writes `kb/program_course_graph.json`, ~67 MB — NOT committed; regenerable).
2. **Program title / award** (currently `title: null`). The join has
   `ProgramControlNumber` but no program title; `coci_program_export` has titles
   but its college NAMES differ from the CB long names
   (`SAN DIEGO MIRAMAR COLLEGE REG CNTR` vs the export's forms). Reconcile with a
   fail-loud college-name crosswalk (see `methodology-coded-key-over-freehand-text-join`)
   keyed on `(college, ProgramControlNumber)` — OR pull the Data Mart **"Program
   File"** option (program-grain: title/award/status by control), which sidesteps
   the name reconciliation entirely. **Recommend the Program File.**
3. **Enrich the course side** from `cb_course_basic_fall2025.csv`: add
   **`CB_UPPDER_DIVISION_STATUS`** (marks the BS core), `CB_TRANSFER_STATUS`,
   `CB_SAM_CODE` to each course node (join on control number). Prefer CB units
   where present; keep `coci_course_list` (has C-ID) as the fallback.
4. **Slim derivative for the browser.** The full graph is ~67 MB — too big to
   ship to the page. Emit a **filtered artifact** (e.g. just the ~45 baccalaureate
   programs from `cpl_baccalaureates_data.js` + their courses, or a lazy
   per-program index) for `cpl_pathways.js` to load.
5. **Wire into `cpl_pathways.js`**: the **official BS course list** (always shown;
   mark upper-div via `CB_UPPDER_DIVISION_STATUS`; ⊕ adoptable-CPL where a peer
   articulates the same course; "Request a review / faculty: articulate" prompt
   where none) + the **AS/certificate chips** ("Fire Technology AS — CPL for N
   certs", hover = exhibits). **Retire the CCR engine's TOP4 membership proxy** in
   favor of this real join.
6. Tests + real-Chromium verify; PR; done.

**A weekly refresh** eventually needs the DevExpress fallback scraper finished (or
the COMIS AIP / a standing CO export) — but the data is current as of 2026-07-16,
so this is not blocking.

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
