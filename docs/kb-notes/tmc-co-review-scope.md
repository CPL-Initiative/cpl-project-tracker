---
title: TMC tab → CO-staff ADT review/processing tool (PCF-bootstrapped)
date: 2026-06-20
kb-status: published
type: scope
tags: [tmc, adt, co-review, coci, comis, program-course-file, c-id, compliance, supabase, datamart]
artifacts:
  - tmc_builder.js                               # the tab (builder + CO-review queue + auth — Sessions 59–66)
  - tmc/supabase_tmc_submissions.sql             # submission/review store (status: draft|submitted — to extend)
  - tmc_templates.js                             # 45 ASCCC TMC templates (some parsed with 0 C-ID slots — repair)
  - tmc/_build_college_adts.py                   # Session 61/66 ADT-status overlay (Active/Approved/… from COCI program export)
  - tmc/source_data/coci_program_export_2026-06-17.csv  # ADT identity + status; CONTROL NUMBER = the program join key
  - kb/reference/coci_course_list.xlsx           # C-ID (CIDNumber) + units, joined by CCC000… course control number
  # planned:
  - tmc/_export_program_course_files.*           # Playwright bulk extractor (Data Mart College_MCF.aspx, all 115)
  - tmc/_build_college_adt_courses.py            # PCF → tmc_college_adt_courses.js (per-ADT real course roster)
related:
  - docs/tmc_builder_lessons.md
  - docs/kb-notes/reference-tmc-adt-data-model.md
---

# TMC tab → CO-staff ADT review/processing tool

## The problem (Sam, 2026-06-20)

Processing new ADT (Associate Degree for Transfer) applications at the CCCCO
Curriculum office is **painfully manual**: a staffer opens the college's
submitted TMC PDF *and* the ASCCC TMC template and compares **course by course**
— do title / number / **units / hours** match, or note the differences — plus
other handbook checks. They approve or deny, notify the college, and the result
lands in COMIS/MIS; the **completed application is never stored in a queryable
repository.** So the only thing that flows downstream is the *status* (via the
COCI Programs extract — which is what the TMC tab reads today, Session 61/66).

**Priority (Sam):** ① give CO staff a streamlined way to **process TMC requests**
from colleges; ② since we're there anyway, a one-stop place for colleges to
**see current and submit new** TMCs. The CO-processing tool is the heart.

## The key insight — the two priorities reinforce each other

When a college maps its local courses to the TMC's C-ID slots **and submits
through the tool**, that submission *is* the structured C-ID→local-course
mapping. So the CO staffer's review runs on an explicit mapping, and the
C-ID-coverage gap (below) mostly evaporates for **new** submissions — the college
does the mapping, we verify it. The PCF **bootstraps the current state** (what's
already approved) so nobody starts from a blank slate; submissions are the
future feed. **Much of the skeleton already exists** (Sessions 59–66): the
builder, `tmc_submissions`, the "New requests" CO-review queue, magic-link
reviewer auth, curator notes. Missing = (1) **automated compliance checking** in
that queue, (2) **current-state bootstrap** from the PCF, (3) **template repair**.

## Validated data architecture (Phase 0 — DONE 2026-06-20)

Three sources join cleanly. Validated on 4 colleges (Allan Hancock, Riverside,
San Diego City, Santa Monica):

```
COCI program export (have it)        PCF — "Program Course File"            COCI course list (have it)
  CONTROL NUMBER, college,             Data Mart > Courses > College           CourseControlNumber (CCC0…),
  ADT title, STATUS  ───join 1───►     Master Course/Program File:             CIDNumber, UnitValue
  (Active/Approved/… per S66)          Program Control Number → ◄──join 2───   (the C-ID + units reference)
                                        [member Course Control Numbers]
                                                     │ join 3 (C-ID == TMC slot C-ID)
                                                     ▼
                                        tmc_templates.js  (the 45 ASCCC TMC C-ID slots)
```

- **Join 1 (program):** COCI `CONTROL NUMBER` == PCF **`Program Control Number`**
  — **100%** (31/31, 45/45, 29/29, 28/28). `Program Proposal Id` matched none, so
  the key is unambiguous. *(Note: the PCF carries no C-ID and no units — it is
  pure linkage. The footer "Report Run Date" row must be skipped.)*
- **Join 2 (course):** PCF **`Course Control Number`** (`CCC000…`) == COCI course
  list `CourseControlNumber` → **90–95%**. Supplies C-ID + units.
- **Join 3 (slot):** course C-ID == TMC template slot C-ID → fills the template.

**The limiter — C-ID coverage on ADT member courses is structurally uneven:**

| College | ADTs | Program join | Course join | **C-ID coverage** |
|---|---|---|---|---|
| Allan Hancock | 31 | 31/31 | 90% | 51% |
| Santa Monica | 28 | 28/28 | 91% | 29% |
| Riverside | 45 | 45/45 | 94% | 8% |
| San Diego City | 29 | 29/29 | 95% | **0%** |

~1/4 of colleges barely populate the COCI `CIDNumber` field (C-IDs are managed in
the C-ID system, not MIS). **We can't fix this from our side.** So C-ID auto-slot
degrades to **title/number "suggested, verify"** for sparse colleges — still a
real time-saver for a staffer who verifies anyway. Separately, a few of our 45
draft templates (Business, Biology, Mathematics) parsed with **0 C-ID slots** — a
template-repair task the real rosters help with.

**The robust core:** the PCF gives the **real course roster of every approved ADT
at every college regardless of C-ID** — that half is bulletproof.

## Phased plan (CO-processing first)

- **Phase 0 — validate joins. ✅ DONE** (this doc).
- **Phase 1 — bootstrap "current state" from the PCF.** Bulk-extract all 115
  colleges' Program Course Files → `tmc/_build_college_adt_courses.py` →
  `tmc_college_adt_courses.js` (per `(college, ADT)` → real member courses, joined
  to C-ID/units where available). Surface in the tab: a college's approved ADT
  shows its **actual courses on file**, not just a status badge → drop "Draft" for
  approved ADTs; status-driven "what's actually approved" view. Serves **both**
  the college "see current" view and the CO baseline. *(Needs the bulk PCF.)*
- **Phase 2 — the CO review/compliance tool (the priority).** In the review queue,
  run automated checks on a submission (or an existing ADT): per-slot **units
  match** (±), **title/number** similarity, **total units** vs the program's MAJOR
  UNITS, ≤60 transferable, + the **handbook criteria**. Render ✓ / Δ / ✗ per slot
  + a "ready to approve / N issues" summary; staffer adds notes, **approves /
  denies / returns** → status + notify. Extend `tmc_submissions.status` beyond
  `draft|submitted` (→ `approved|denied|returned`). *(Needs handbook criteria +
  repaired templates.)*
- **Phase 3 — college submission polish (secondary).** Pre-fill the builder from
  the college's current ADT (PCF), clean "submit new TMC" flow, status display.
- **Cross-cutting:** repair the 0-C-ID-slot templates (real rosters + official
  PDFs); surface per-college C-ID coverage honestly; the hours gap (manual flag).

## Prerequisites / unblocks
1. **Bulk PCF (all 115).** Data Mart `College_MCF.aspx` is a **DevExpress**
   stateful form (college code in `ASPxComboBoxC_VI`, e.g. San Diego City = `071`;
   File Type `C` = Program Course File; CSV export). The per-college recipe is
   **select → View Report → Export**. Raw `requests` looping is brittle (ViewState
   + DevExpress callbacks); a **Playwright script** that drives a real browser and
   self-discovers the dropdown options is the robust path — runs on a host that
   reaches `datamart.cccco.edu` (the agent sandbox can't), ~10–15 min, drops 115
   CSVs. *Ready to write.*
2. **Handbook compliance criteria** — the *checklist* the staffer applies
   (course-level title/number/units/hours rules + program-level total-units / GE /
   double-counting), not the whole process. Scopes exactly what Phase 2 checks.
3. **Status model** for CO review (approve/deny/return) — small schema extension.

## Open decisions
- Exact compliance checks (from the handbook).
- **Hours** are in *no* data we have (PCF, COCI course list, descriptors) — manual
  flag unless the handbook points to a source.
- **Denied** ADTs are invisible in the COCI extract (8 statuses, none "Denied") —
  does the tool *become* the system-of-record the CO currently lacks?
- Where the bulk PCF lives: a committed **static artifact** like
  `tmc_college_adts.js` (NOT a daily-cron artifact; refresh on re-extract).

## Honest limits
- C-ID auto-slot degrades for the sparse ~1/4 of colleges (structural); new
  in-tool submissions carry an explicit mapping, so it matters less going forward.
- Contact **hours** absent everywhere.
- The PCF is a periodic snapshot — re-extract to refresh (like the ADT overlay).
