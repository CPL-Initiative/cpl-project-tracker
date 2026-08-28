---
title: "Org & phrase scope / auth model — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Org & phrase scope / auth model

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Which sites exist, which phrase opens which, and whether shared phrases survive at all.

## Status

🔨 **MEASURED + RECOMMENDED, NOT BUILT** (Sky160, Sky168, Sky169). ⭐ **RECOMMENDATION: magic link + ONE `role` column on `allowed_reviewers` — explicitly NOT groups.** Sam re-opened his own 2026-08-14 ruling (*"I want to keep things stupid simple"*, `cpl_memory` `sam-roles-not-groups-keep-the-phrase`, verified). Measured: magic-link ALREADY covers more of COBI than phrases — **132 policies** call `is_allowed_reviewer()` vs **83** calling `team_pass_ok()`, and **31 modules** read a reviewer session vs **22** sending `x-team-pass`. So the question is only whether the phrase half survives. One role per person (admin/team/gr/fin); **the 132 reviewer policies do not change**; transition accepts EITHER a session OR a phrase so nothing goes dark; retire `ci` first (it protects nothing), then `gr`, `fin`, `team`. ⭐ **The scaling proof is our own KB note** `exclusive-surface-scopes-a-shared-credential`: a shared credential can only scope to a surface exclusive to ONE group, and exactly **2 of 34** COBI tabs qualify — so every phrase is structurally a **superset**. ⚠️ **Phrase STRENGTH is not the weakness** (measured by shape: all four are 12–13 chars, mixed case, digits + symbols); the weaknesses are **no identity on writes, no per-person revocation, silent spread**. ✅ **Reviewer roster 5 → 10 (2026-08-19)** — Ashley, Jessica, Malone, Kristen (rccd.edu) + **Pedro Campos (ITPI CEO), the first EXTERNAL-domain reviewer**, added on Sam's explicit confirmation. This closed the gap where team members named in this file were working through shared phrases because nobody had added them. ⚠️ **Reviewer is ALL-OR-NOTHING and that now has teeth** — beyond any phrase it reaches `map_student_credit` (**537,908 rows, STUDENT GRAIN**), `map_student_credit_prev` (220,588), `kb_curation` (32,441), the `gr_*` register, and **`team_access` itself — so a reviewer can read and rotate every team phrase**. A partner who needs `kb_curation` also gets student-grain data; that is the concrete case for the role column. Revocation is one DELETE per row. ✅ **GR phrase scoped** (`team_pass_check()` excludes `gr`, #1239) — residual: a GR-only holder needs the `team` phrase. **Finance stays parked** (genuinely shares 6 of 42 tables). **NEXT: Sam's go on the role column.** Measurement: [`docs/phrase_scope_analysis.md`](docs/phrase_scope_analysis.md); story [`docs/auth_and_repo_posture_lessons.md`](docs/auth_and_repo_posture_lessons.md).
