---
title: "Partner crosswalks — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Partner crosswalks

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** "Which of the occupations we train for can our students already get college credit for, and where?" — plus the college-facing half: "and what can THIS college carry?"

## Status

✅ **TWO INSTRUMENTS LIVE.** ① **Statewide engine** (SkyWalker, #995) — `kb/_build_partner_crosswalk.py` + the shared `kb/occupation_credential_map.json` (139 occupations / 406 rulings / 35 curated no-CPL findings) + region presets + 32-check test. SJCOE run 1: 51 statewide / 53 local-only / 35 no-CPL. ② **College-scoped crosswalk** (Sky169, #1243) — `kb/_build_college_offering_crosswalk.py` + `kb/delta_offering_map.json`, for the SJCOE ↔ San Joaquin Delta meeting. ⭐ **A COLLEGE-SCOPED ASK IS A DIFFERENT INSTRUMENT, NOT A FLAG.** The statewide engine deliberately does not privilege the in-county college — right for a referral, wrong for a meeting where the whole question is what ONE college can do; and the two disagree about what a good answer IS (engine: *"some college offers this"*, a fact; college tool: *"this college teaches it AND the exhibit exists AND nobody joined them up"*, a task). Third time this call has come up — see also Futuro/HTH (#1134), where **one course × one program type** had no vocabulary to reconcile and a simpler generator was right. **Match the instrument to the question's shape, not to the word "crosswalk".** ⭐ **KEEP "does the college teach it" and "does an exhibit exist" in SEPARATE COLUMNS** — crossed, they ARE the deliverable: Delta **42 adopt-now** (teaches it, exhibit exists, MAP already flags it potential — no curriculum and no exhibit to build) · 6 build-first-in-state · **0 of 139 articulated today** (its lone career CPL is POST Basic Academy; the other 68 are AP/CLEP). Collapsing them into one score destroys the only distinction the meeting needs. ⭐ **Delta holds curriculum for the statewide gap run 1 found** — a utility/hydroelectric apprenticeship (`A IND 77A–77N`, `A ELE 75A–75F`) covering 6 occupations with **no CPL anywhere in California**. ⚠️ **Lineworker is NOT among them** (substation/plant electrical ≠ line work). ⚠️ **A capability can be INVISIBLE to a program search** — Delta's 10-course plumbing apprenticeship (`A CON 87A–90D`) sits under no plumbing-named COCI program and the prefix reads as *construction*; MAP lists Delta on neither side of the statewide C-36 exhibit. **Search the COURSE catalog, not just the program inventory.** ⚠️ **Narrative copy is a FINDING, so it lives with the rulings** (`_narrative` in the offering map), never in the generator — hardcoding it would make the reusable-engine docstring a lie; `check_absence_claims()` now hard-fails any row claiming CPL exists nowhere while its own exhibit list is non-empty (**caught 6 rows**: 2 utility, 4 masonry). **Next:** ① Ashley meets Delta — record which of the 42 they accept/reject/correct (corrections are the highest-value input to the offering map); ② the statewide engine's **2nd occupation list is STILL outstanding**, so "coverage compounds" remains a design intention, undemonstrated. **Parked:** the COBI tab (Sam authorized the *regional-capacity* view, not the judgment-based matching) and an **O\*NET SOC → certification spine**, which is what would let a match be defended rather than asserted. **Gap backlog:** the 35 no-CPL occupations. Story: [`docs/delta_college_crosswalk_lessons.md`](docs/delta_college_crosswalk_lessons.md) · [`docs/partner_crosswalk_lessons.md`](docs/partner_crosswalk_lessons.md).
