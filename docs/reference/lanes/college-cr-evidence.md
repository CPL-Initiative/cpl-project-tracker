---
title: "College CR evidence ('we approved it, but we have no CR') — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# College CR evidence ("we approved it, but we have no CR")

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** A college names courses it will award for a CPL type but holds no credit recommendation — and MAP needs one before an articulation can exist.

## Status

✅ **BUILT + REUSABLE, FIRST RUN DELIVERED (LATTC, 139 military-CPL courses)** — `kb/_match_courses_to_ace_recs.py`, worklist `kb/college_cr_evidence/`, PR #1365. Jessica: *"This is a common problem we have with colleges."* ⭐ **TWO SIGNALS, NEVER BLENDED**: the recommendation EXISTS (ACE publishes it, CA students hold it — a proposal) vs PEER PRECEDENT (a named college attached it to a named course — a fact). **87 / 46 / 6.** ⚠️ **THE PEER CORPUS IS THIN WHERE TRADE COLLEGES TEACH** — only **2.7%** of ACE rows in `map_college_cr_unit` name a local course (5,442 of 200,364); after dropping `CPL-N Elective` placeholders, **15 colleges** supply trade precedent, and there were **zero** carpentry/plumbing/water/architecture peers. But the ACE vocabulary is rich there (blueprint reading **31 exhibits / 69 colleges**), so the 46 are a **ready-to-adopt shelf**. ✅ **JESSICA'S UNIT RULE (2026-08-27):** hours more than **1 unit** from the course are **NOT LISTED**; exactly one apart stays at a lower score. Measured basis: of **3,419** peer articulations carrying both numbers, **81.1% match hours to units exactly**. ⚠️ **The cut applies ONLY where COCI gave units** — the 8 courses without them are unfiltered, because an absent measurement must not read as a failed one. ⭐ **A CR MAY SERVE SEVERAL COURSES AND A COURSE SEVERAL CRs** (Jessica) — an earlier build inferred a prohibition from the fact that peers *rarely* do it; that is a frequency, not a rule (`cpl_memory` `a-cr-can-serve-several-courses-and-a-course-several-crs`). ⚠️ **RANKING BY BREADTH STARVES SMALL COURSES** — the widely-held recommendations are the 3-hour ones, so a top-N-by-confidence list hid **22 exact-hour matches** on one 2-unit course and the only fitting option on **12 courses, 5 at ≤2 units**. Each card now carries top-5 **plus** up to 5 whose hours EQUAL its units. ⭐ **A UNITS JOIN IS ALSO A COURSE-IDENTITY CHECK** — **5 of LATTC's course numbers name a different course in COCI** (`BLDGCTQ105` = *CPR/AED/First Aid*, not *Basic Blueprints*); flagged, never silently carried. ⭐ **111 of 139 courses have a CR LATTC's own veterans already hold.** ⚠️ **Welding is NOT typically a lecture+lab pair** — of 1,198 welding courses at 79 colleges, 55 (4.6%) are lab-titled at 17 colleges, and of 19 `L`-suffixed numbers exactly ONE has a lecture counterpart. **NEXT:** ① LATTC faculty work the 87 peer-backed rows; ② ask LATTC about the 5 divergent numbers; ③ the 46-row ready-to-adopt shelf; ④ run the matcher for the next college that asks. Story: [`docs/college_cr_evidence_lessons.md`](docs/college_cr_evidence_lessons.md).
