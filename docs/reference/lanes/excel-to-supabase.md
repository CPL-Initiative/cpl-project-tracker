---
title: "Excel→Supabase Phase 2-4 — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Excel→Supabase Phase 2-4

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Retire the master `.xlsx`; Supabase is the system of record.

## Status

🔨 **Nearly done — the writer is gone.** Phases 1–2 + the config/KPI-ladder/budget/D-row work all shipped (Sessions 15–25, PRs #189–#223); the master `.xlsx` is **no longer written on any run**. **Remaining: P3** Update Log history — a product fork Sam **parked** 2026-06-01 (38 projects / 120 stale entries, latest 2026-04-08; options = read-only snapshot / retire keeping `latest_update` / a Supabase `project_update_log`) — and **P5**, dropping the `.xlsx`, blocked only by `read_projects` (KPI-ladder + outage fallback), `read_budget_plan` (+ budget `factors`/`year_labels`) and `read_update_log`/`archive_updates_to_log` (the one remaining writer, gated on P3). Independent: budget `total`/`avg` formulas + a personnel editor (fix the 26→13 dedupe row-identity first). Keep a Supabase→xlsx backup. Full shipped-phase history: [`docs/roadmap_archive.md`](docs/roadmap_archive.md); method: `docs/kb-notes/methodology-verify-consumer-before-migrating.md`.
