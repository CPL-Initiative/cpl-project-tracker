---
title: ADT acceptance & course-substitution rules (ASCCC C-ID guidance + STAR Act)
created: 2026-06-20
kb-status: published
tags: [reference, adt, tmc, c-id, compliance, co-review, title-5, star-act, sb1440, assist, substitution]
artifacts:
  - tmc_templates.js          # the 45 TMC templates (Required Core / List A/B/C + select-counts + units)
  - tmc/source_data/coci_program_export_2026-06-17.csv  # MAJOR UNITS + status per ADT
  - kb/reference/cid_descriptors.json  # C-ID descriptor titles (no units/hours — units live on the TMC slot)
related:
  - docs/kb-notes/tmc-co-review-scope.md
  - docs/kb-notes/reference-tmc-adt-data-model.md
sources:
  - "ASCCC C-ID Articulation Subgroup, *Effective Practices for Determining Course Substitution for ADTs* (May 2019) — the position paper"
  - "*Guidelines for Course Substitutions within an ADT, with Scenarios* (its Appendix B) — the 9 guidelines + scenarios A–R"
  - "STAR Act: SB 1440 (2010) + SB 440 (2013), Ed Code §§66745–66749.5; Title 5 §55063(d) (grade), §55050 (credit-by-exam), §55002 (COR); ASCCC res. 15.01 S11"
---

# ADT acceptance & course-substitution rules

Distilled from the two ASCCC C-ID documents Sam provided (2026-06-20). This is the
rule layer for the TMC tab's CO-review/compliance engine
([scope](tmc-co-review-scope.md), Phase 2). **Two review contexts share one
ruleset:** ① the **CO program-approval review** (does a college's proposed ADT
match the TMC + the STAR Act structure?) — Sam's priority; ② **course
substitution** (does a student's specific course count toward an ADT slot?). The
structural rules (§1) drive ①; the acceptance ladder (§3) drives both.

## 1. Structural ADT requirements (the CO program-approval checklist)

Every ADT (per the STAR Act) must satisfy — and a college may **not** add local
requirements beyond these:

| Requirement | Rule | Auto-checkable here? |
|---|---|---|
| Total units | **60 semester / 90 quarter** CSU-transferable units | ⚠ partial (units yes; "CSU-transferable" needs the C-ID/ASSIST signal) |
| Major units | **≥ 18 semester / 27 quarter** in the major | ✅ COCI MAJOR UNITS + per-course units |
| Major grade | all major courses **C or better** (P/CR if college defines as C+) | ❌ grades not in our data (student-level) |
| GE pattern | a full **CSU GE** *or* **IGETC** pattern | ◐ via the Cal-GETC/IGETC/CSU-GE companion (`tmc_ge_patterns.js`) |
| GPA | cumulative **2.0** (transferable courses only) | ❌ student-level |
| No local add-ons | **no extra "local requirements"** layered on the ADT | ✅ compare proposed list vs TMC structure |
| C-ID coverage | TMC-specified courses carry a **C-ID designation where a descriptor exists** (SB 440) | ✅ flag Required-Core/List-A slots whose chosen course lacks the C-ID |

## 2. TMC structure & per-discipline flexibility

A TMC = **Required Core** (specific C-IDs, all required) + **List A/B/C**
(*select N of M*; lists may include flexible options like *"any articulated
major-prep course," "any CSU-transferable course," "any CSU GE Area X course"*).

**Flexibility varies by discipline and must be encoded per TMC:**
- **Maximum** (Psychology): any earlier-list course may be used to satisfy a later list.
- **Zero** (Early Childhood Education): all courses fixed — **no** substitutions/local variation.
- **Most TMCs are in between.** The local ADT must stay *consistent with the TMC
  parameters* — that consistency check IS the program-approval review.

## 3. Course-acceptance ladder (the engine logic)

Apply top-down; the first match wins. **Non-C-ID ≠ non-compliant** — that's the
crux for the sparse-C-ID colleges (San Diego City 0%): their List B/C courses
are valid with *evidence*, not a C-ID.

1. **C-ID matches the slot → MANDATORY auto-accept.** If the course carries the
   slot's C-ID, the receiving college *must* accept it (not merely "may") — no
   faculty review. (Pos. paper p4; Scenarios Q/R.) **We already compute this.**
2. **No C-ID, but the slot is a flexible-list option + ASSIST evidence → accept.**
   "Any articulated major-prep / CSU-transferable" lists accept non-C-ID courses
   when ASSIST shows the required articulation. (G1/G3/G7; Scenarios E/D/F.)
   → surface as **✓ accept (ASSIST-evidence flagged)**.
3. **No C-ID approval, but a C-ID descriptor exists → faculty descriptor-comparison.**
   Compare the course COR to the descriptor (incl. prerequisites). (G6; Scenarios G/A/H.)
   → surface the **descriptor + COR link**; human decision.
4. **External exam (AP/IB/CLEP) or local credit-by-exam → policy-driven accept.**
   (G8/G9; Title 5 §55050; grade must be passing.) Out of auto-scope.
5. **Gates that apply regardless:**
   - **Major total ≥ 18 sem units** *after* any substitution (else require another course). (Scenarios M/N.)
   - **Grade ≥ C** for a *major* course (C- → GE/elective only, never IGETC). (Title 5 §55063(d); Scenario J.)
   - **Quarter→semester:** use the official **"+1 unit" convention** — a 4-qtr course ≈ a 3-sem C-ID course (not strict 2.66); two qtr courses mapped to one C-ID → both required.

## 4. Auto vs. assist vs. manual (what the tool does)

| Layer | The tool's role |
|---|---|
| **Auto** | C-ID exact match (mandatory-accept); per-course units + major total (≥18, ≤60); structural completeness vs the TMC (Required Core present, List select-counts met, no extra local req); ADT status (Active/Approved/…). |
| **Assist / link out** | ASSIST articulation (assist.org); C-ID descriptor ↔ COR comparison (surface the descriptor); the CSU "similar TMC" tool. |
| **Manual (no data)** | Contact **hours** (absent from COCI/PCF/descriptors); **grades**/GPA (student-level); COR content judgment. |

The engine is **triage, not verdict**: green where a rule is mechanically
satisfied; flag/assist where judgment or evidence is needed — replacing the
staffer's blind PDF-vs-PDF diff with a pre-sorted worklist.

## 5. Workflow hooks (feed the CO-review queue)
- **Frequent internal substitution → "add to the ADT" candidate.** When a college
  keeps substituting the same course, it should add it via a **program
  non-substantial change** proposal to the CO — itself a review-queue item.
- **C-ID-approved but not on the ADT → "submit to CO for inclusion."** Allowable as
  a substitution now, but should be folded into the ADT (Scenarios C/R). The tab
  can surface these as one-click "propose ADT update" actions.

## 6. Open questions this raises
- **Per-TMC flexibility metadata** isn't in `tmc_templates.js` yet (Required Core
  vs flexible-list, select-counts, "any articulated…" provisos). Capturing it is a
  prerequisite for §2/§3 — sourced from the official TMC PDFs (we have them).
- **"CSU-transferable" / "Golden Four" / GE-area** signals aren't in our data
  directly — partially inferable via C-ID + the GE companion, else ASSIST link-out.
- **Hours** remain unsolved (manual), consistent with the scope doc.
