---
title: TMC confidence score & near-auto-approval — what data we hold vs still need
date: 2026-07-01
kb-status: published
type: reference
tags: [tmc, adt, co-review, confidence-score, coci, c-id, mis, program-course-file, contact-hours, curriculum-institute]
artifacts:
  - tmc_college_courses.js            # COCI ∪ c-id.net per-college index (join ladder + graded provenance, #642)
  - tmc_templates.js                  # 45 ASCCC templates: slots, units, select-N, OR alts, flexible provisos
  - kb/reference/coci_course_list.xlsx        # 141,738 rows — title/number/units/description; NO hours
  - kb/reference/cid_articulations.json       # c-id.net authority, 28,070 rows — NO units, NO hours
  - kb/reference/cid_descriptors.json         # 495 descriptors WITH description text (for similarity scoring)
  - tmc/source_data/coci_program_export_2026-06-17.csv  # ADT status incl. ⏳ In-progress (the backlog proxy)
related:
  - docs/kb-notes/tmc-co-review-scope.md
  - docs/kb-notes/reference-adt-acceptance-rules.md
  - docs/kb-notes/reference-tmc-adt-data-model.md
---

# TMC confidence score & near-auto-approval — data requirements

**The goal (Sam, 2026-07-01).** The CO curriculum office manually checks each
ADT submission course-by-course against the TMC template — **course number,
title, contact hours, units, description** — then signs off or returns it. The
TMC Builder's two purposes: ① give colleges an interface that checks alignment
**on the fly and assigns a confidence score**; ② let CO staff **triage the
low-confidence entries**. Best case: a college **cannot submit an incomplete or
misaligned application** — submissions arrive nearly auto-approvable. Urgency:
**200+ submissions must clear before the Curriculum Institute in mid-July.**
COCI has a submission interface but the CO has no resources to build the
checking procedure there — this tool is the de-facto procedure layer.

## The key rule that reshapes the checklist

Per the ASCCC acceptance ladder
([reference-adt-acceptance-rules.md](reference-adt-acceptance-rules.md)):
**a C-ID match is a MANDATORY accept** — the statewide C-ID approval already
certified that the local course's title, units, and content align with the
descriptor. So for any slot where the college's course carries the slot's C-ID,
the five manual checks collapse into one lookup. The per-field comparison
(title/units/description/hours) is only needed on the **non-C-ID residual** —
which is exactly where the confidence score lives.

## Scorecard: the five CO checks vs the data we hold

| CO manual check | Source we hold | Status |
|---|---|---|
| Course name/number | COCI extract (141,699 courses, all 120 colleges) | ✅ have |
| Title | COCI `CourseTitle` | ✅ have |
| Units | COCI `UnitValue` + the template's per-slot required units | ✅ have |
| **C-ID alignment** | **c-id.net authority ∪ COCI `CIDNumber`** — since #642 every one of the 25,084 non-sequence approvals lands (graded: hard / ≈title-inferred / synthesized) | ✅ have — the auto-accept tier |
| Description | COCI `CatalogDescription` (in the raw extract) + the 495 C-ID **descriptor texts** | ◐ **data in hand, not yet wired into the tab** (engineering, not sourcing) |
| **Contact hours** | **nothing** — not in our COCI extract, not in c-id.net, not in the MIS PCF | ❌ **the one true data gap** |

## What is still needed (the direct answer)

1. **Contact hours — the only check with no source in hand.** Colleges DO enter
   hours into COCI at course approval, but no export we hold carries them, and
   the ASCCC acceptance rules themselves key on C-ID/units, not hours.
   Three options, in order:
   - **(a) Ask whether the COCI course report can be exported WITH the hours
     columns** (Sam has COCI access). If yes → the gap closes at the next
     extract refresh, zero new engineering beyond a column.
   - **(b) Capture hours on the submission form** — a required per-course field
     with the COR as evidence. "Can't submit incomplete" means the data we
     can't source becomes data the submission collects; CO verifies only on
     low-confidence entries.
   - **(c) Leave manual** (status quo per the scope doc) — acceptable because
     the ruleset doesn't gate on hours, but weakest for auto-approval.
2. **A FRESH COCI course extract + a refresh cadence.** Today's #642 audit
   proved ours is stale mid-CCN-transition: **1,986 officially-approved courses
   have no row in it** (e.g. intro-sociology statewide — legacy `SOC 1` rows
   retired, only 8 `SOCI C1000` rows landed). Any per-course confidence score
   is only as fresh as the extract. Suggest monthly pulls through the CCN
   transition, plus one immediately before the Institute.
3. **A fresh c-id.net approved-courses export, periodically.** Ours is
   2026-06-11; approvals churn (new approvals, expirations). Same cadence.
   Also worth grabbing: a **descriptor** refresh (ours shows 2017 expiration
   dates) and, if exportable, descriptor **minimum units** (nice-to-have — the
   template slots already carry required units).
4. **The pending-submissions list (the 200+).** If the CO can export the queue
   as (college, TMC, submitted-date), the tab can rank it by computed
   auto-match coverage so staff clear the near-auto-approvable ones first.
   **Fallback already in hand:** `tmc_college_adts.js` carries every
   ⏳ In-progress (college, TMC) pair from the COCI program export — a workable
   backlog proxy today.
5. **Bulk MIS Program Course File (PCF)** — unchanged from the scope doc.
   Sam is right: it has **no descriptions and no C-ID**; its role is *program
   membership linkage*, not alignment checking — ① bootstrap the real course
   rosters of already-approved ADTs (joins validated 2026-06-20: program join
   100%, course join 90–95%), ② audit trail. New in-tool submissions carry
   their own explicit mapping, so the PCF is not on the critical path for the
   confidence score. Still needs the Playwright pull from a machine that
   reaches `datamart.cccco.edu`.
6. **ASSIST articulation evidence** (tier-2 flexible slots — "any articulated
   major-prep course"): no dataset exists to hold; capture as an attachment /
   link on the submission form, flagged for CO eyes.
7. **Not needed:** grades/GPA (student-level — program approval never sees
   them); MIS for descriptions (it has none).

## The confidence tiers the data supports today

| Tier | Signal | Score | Disposition |
|---|---|---|---|
| 1 | Hard C-ID (COCI `CIDNumber` or exact-lane c-id.net) | 1.0 | **auto-accept** (mandatory per ASCCC) |
| 1b | Synthesized c-id.net approval (course absent from our extract — `per c-id.net` badge) | 0.9 | auto-accept, verify chip |
| 1c | Title-inferred C-ID (`≈ c-id.net title` tcid tier) | 0.8 | verify (CO glance) |
| 2 | Flexible slot + ASSIST evidence attached | 0.8 | accept, evidence-flagged |
| 3 | No C-ID: title Jaccard (≥0.72 exists today) × units-in-range × **description similarity (to wire)** | 0.3–0.7 | **the CO triage queue** |
| 0 | Empty slot / units far off / select-N unmet | — | **block submit** |

Structural gates at submit (all data in hand): Required Core complete, List
select-N counts met, major ≥ 18 sem units, ≤ 60 total, no unresolved ✗.

## Build order for mid-July

1. **Submission gates + per-slot tiers 1/1b/1c/2** — all data shipped as of
   #642; days, not weeks.
2. **CO triage queue** — In-progress (college, TMC) pairs ranked by computed
   coverage; the per-slot ✓/≈/✗ panel is the review screen.
3. **Description-similarity precompute** — build-time score per (course,
   slot-C-ID) against the descriptor text (ship the score, not 34 MB of text;
   lazy per-college text for the CO drill-in).
4. **Hours column** — the moment (1a) or (1b) above lands.
