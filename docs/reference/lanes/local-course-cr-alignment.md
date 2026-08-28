---
title: "Local course ↔ CR alignment — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Local course ↔ CR alignment

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** "Which of MY courses should I articulate against this credit recommendation, and how did other colleges do it?" — so faculty don't guess.

## Status

✅ **LIVE — cpl-chat v43** (#1153/#1154/#1155/#1158/#1161). **Three surfaces:** `chatbox_peer_articulations` (9,413 rows · 1,516 credentials · 82 colleges — the FACT), `chatbox_college_courses` (141,696 · 120 colleges), and `credential_alignment_for_college()` returning both in one round trip, discriminated by `row_kind`. ⭐ **THE LADDER — C-ID, then title, then best-aligned (Sam's ruling).** Only the **best available rung renders** — a fallback, never a blend, because rung 1 says the equivalence is ESTABLISHED by a statewide standard and rung 3 says "closest thing you have"; blending lets a guess outrank a fact. 16,067 of 141,696 courses carry a C-ID across 112 colleges. ⭐ **TWO SIGNALS, NEITHER SUFFICIENT, NEVER MERGED** — Santa Ana mapped `WELD 240 Structural Welding SMAW` / `WELD 244 D1.1 Code Clinic` to **FCAW** recs and **neither title contains "FCAW"**, so title similarity can never propose them; peer precedent is the only signal that finds the broader-course pattern. Candidates print above the peer heading, labeled; **no score reaches the model**. ⚠️ **A C-ID match whose NAMES diverge is FLAGGED, never suppressed** (`cid_title_divergent`) — POST carries `AJ 110` on two lines, and suppressing it would auto-resolve the repeat Sam ruled must never be auto-resolved. ⚠️ **A plausible false positive costs more than a miss here** — the first cut ranked `ART 100 Introduction To World Art` third for an FCAW rec, so `cx_align_tokens()` drops structural words and the scorer requires **≥1 CONTENT token** (`advanced`/`beginning`/`basic` deliberately NOT stopped). ⚠️ **Bound BOTH sides of the union and resolve the grouping key** — `per_rec` once capped candidates only (3,807 peers vs 9 candidates) and peers were keyed on their own wording (43 groups where POST's set is TEN, ~34 of them phantom), which together buried five C-ID matches and rendered them as *"check catalog"*. **A phantom empty group is indistinguishable from a real one.** Now 10 groups / 94 rows / 6 of 6. **`peer_total` ships as a COLUMN** ("showing 9 of 261") — a capped list must never read as a census. ⚠️ **Do NOT re-add a "closest match anyway" fallback** — built and withdrawn; it proposed `AUTO 160 Introduction to Automotive Electrical` for a *policing* rec, and it is structural, not tunable: a rec with no candidate is one where nothing shares a subject word. Real empties point at the **peer courses**. ⚠️ Candidates come from the **whole catalog** — scoping by TOP would gate on TOP (Rule 7). ⚠️ **`attribution`**: 8,809 `per_course`, 604 `group_wide` — name group-wide peers as a GROUP, never pair a college to a course. Recs come from the peer table UNION the published sets, so the **ready-to-adopt shelf aligns too**. **NEXT: Sam + team testing via Sierra Training; triage the feedback into instructions.** Story: `docs/local_course_alignment_lessons.md`; SQL of record: `kb/supabase_alignment_routes.sql`.
