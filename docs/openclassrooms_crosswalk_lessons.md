---
title: OpenClassrooms Digital Marketer → CCC CPL crosswalk — lessons
date: 2026-09-29
tags: [lessons, partners, crosswalk, openclassrooms, digital-marketing, apprenticeship, cpl]
artifacts:
  - kb/_build_openclassrooms_crosswalk.py
  - kb/_write_openclassrooms_workbook.py
  - kb/_write_openclassrooms_html.py
  - kb/openclassrooms_map_ace_recs.json
  - kb/openclassrooms_out/crosswalk.json
  - kb/openclassrooms_out/20260929_OpenClassrooms_Digital_Marketer_CPL_Crosswalk.xlsx
  - kb/openclassrooms_out/openclassrooms_digital_marketer_crosswalk.html
related:
  - "[[docs/futuro_hth_crosswalk_lessons]]"
  - "[[docs/partner_crosswalk_lessons]]"
---

# OpenClassrooms Digital Marketer → CCC CPL crosswalk — lessons

## 2026-09-29 — Ashley's third partner crosswalk

### What prompted it

**Ashley opened the session** (Sam was working in parallel; she asked that nothing
collide with his work, so everything here is new files on a session branch). She
supplied the OpenClassrooms **Appendix A work process schedule** (O*NET 13-1161.01,
RAPIDS 2077CB, 27 competencies A–AA, 400 RTI hours) and the **program syllabus**
(seven online projects), and asked for every CPL opportunity statewide — MAP first,
then COCI and catalogs, "including courses that have never been added to MAP" — as a
ten-column Excel sheet in her order. Mid-request: *"please provide me with a HTML
visual."* The published page is artifact `9jYHLK3WsycJTKRDtXoxmF`.

### Shape

One training × every college, which is the Futuro/HTH shape, not the occupation engine.
A separate small generator again (`_build_openclassrooms_crosswalk.py`) with the same
two-signal gate: title lens AND a business / media / IT TOP family, or a
digital-marketing phrase in the catalog description AND that family. TOP corroborates
and never decides.

### The finding that reframes the deliverable

**Bakersfield College already carries the curriculum.** APPR B73A–G, *Digital Marketer
Apprenticeship 1–7* (20 credit units, all in the MIS Fall 2025 inventory). Each
description restates one OpenClassrooms project brief, in sequence (paid ad campaign,
SaaS app redesign, market research, social media strategy, SEO + editorial calendar,
landing pages + email nurture). No MAP exhibit exists for it. Recorded as a ruling in
the `DIRECT` table in the generator, not inferred. **Next step is a question to
Bakersfield, not a faculty review elsewhere:** is this series OpenClassrooms' related
instruction? If so it is the model articulation for every other college.

### What MAP holds

- **Zero statewide (CCC Collaborative) credit recommendations** in digital marketing,
  social media, SEO or advertising.
- **35 local articulation rows** at 17 colleges, all for *other* credentials (CLEP,
  AMA Content Marketing / Marketing Management, CFT Marketing, credit by exam). They
  prove the course accepts CPL; none is for OpenClassrooms.
- **12 ACE (military) credit recommendations** in the same subjects (Social Media
  Marketing, Digital Media Analytics, Advertising Media, Marketing Research…). They
  sit in `map_college_cr_unit` with an **empty `college_course`**, meaning no college
  has attached a course. Reported as reusable wording, not as articulations.

### Lessons

1. **`chatbox_exhibits` is a subset; `statewide_data.js` is the whole exhibit set.**
   The AMA certifications were absent from the Supabase chatbox table and present in
   `statewide_data.js`. Start from the JS.
2. **A merged exhibit record crosses colleges' course codes.** The CLEP Principles of
   Marketing record carries Santa Monica's `BUS 20` (Principles of Marketing); a
   naive adopter × course-code join put Business Mathematics (RCCD's `BUS 20`) on the
   sheet. The fix: the adopter's COCI course title must share a word with the credit
   recommendation.
3. **`subject_discipline_map.json` is global, and subject codes are not.** It maps
   `APPR` to Auto Body Technology; at Bakersfield APPR is apprenticeship. The
   generator keeps a mapped discipline only when it is plausible for a
   marketing / media / IT course; otherwise it shows the TOP code marked *verify*.
4. **Description-found courses need a lower ceiling.** A web-design course that
   mentions SEO is not a marketing course. Found-by-description tops out at
   Moderate outside a marketing TOP family.
5. **LibreOffice recalc of a 700-row, text-heavy workbook is slow here** (>90 s).
   Run it in the background with a long timeout.

### Counts (2026-09-29)

638 aligned COCI courses at 112 colleges: 7 direct match (Bakersfield), 98 strong, 425
moderate, 108 partial. 251 active/approved marketing-family programs, of which the
digital-marketing-focused ones lead the Programs tab.

### Next

- Ashley / MAP team: ask Bakersfield about APPR B73A–G and OpenClassrooms.
- Faculty review of the Strong tier, region by region, reading course outlines of record
  (COCI descriptions are the college-entered summary only).
- If OpenClassrooms partners with more than a few colleges, a statewide (CCC
  Collaborative) exhibit is the efficient form; none exists in this subject yet.

### Checkpoint (2026-09-29, scoped at Ashley's request)

Sam was running a live session, and Ashley asked that nothing collide with it. So this
checkpoint wrote only new records: this lessons doc, three `cpl_memory` rows (status
`proposed`, author `session-2026-09-29-ashley@bot`, INSERT-only; roll back by
deleting that author's rows), and a CPLBrain session note. **Deliberately not
touched:** the next `docs/session_<N+1>_handoff.md`, `kb/cpl_todos.json`,
`docs/reference/lanes/partner-crosswalks.md` and `CLAUDE.md` §11. Sam's session owns
those this evening. The next checkpoint on the partner-crosswalks lane should add one
line to the lane file pointing here.
