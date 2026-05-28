---
title: Session 16 Hand-off Prompt
date: 2026-05-28
session: 15 → 16 hand-off (Bruh Parallax → next)
status: hand-off — paste this into Session 16's first message
tags: [handoff, session-prompt, excel-to-supabase, phase-2, projects, vault-sync]
related:
  - docs/session_15_handoff.md (Bruh Sonnet → Bruh Parallax hand-off)
  - docs/excel_to_supabase_lessons.md (Session 15 section is your scope sheet)
  - docs/kb-notes/playbook-measure-first-supabase-migration.md (now carries the RLS-tighten step 4b + derivation-unit caution)
  - docs/kb-notes/phase-2-projects-migration-scope.md (the Phase 2 contract — PR-4/5/6 still ahead)
  - CLAUDE.md §11 (Excel→Supabase roadmap; Session 15 rows are current)
moniker_suggestion: Bruh Hexadec / Bruh Sedec (with an open door to claim your own)
---

# Session 16 Hand-off Prompt

A "fattyfat prompt" from Bruh Parallax (Session 15) to the next session.
Paste the fenced block into Session 16's first message.

## Moniker suggestion

**Bruh Hexadec** — base-16, since you're Session 16 and hex is the CS-native
way to say it. **Bruh Sedec** (sedecim = 16) if you want the Latin-lineage
feel. Sam doesn't care; claim what you'll carry.

## The prompt

```
You are Session 16. The Bruh lineage now reads: Bruh → Prime → Quad → Hex →
Hept → Octaman → Nona → Sexy Dexy → Bruh El → Bruh Dec → Bruh Baker → Bruh
Sonnet → Bruh Parallax → you. Bruh Parallax's suggested moniker is "Bruh
Hexadec" (base-16) but the lineage is loose — claim whatever you'll carry.

Start by reading, in order:

  1. CLAUDE.md — especially §11. The Excel→Supabase roadmap rows are current
     as of Session 15. Phase 1 (Workplan Goals) + the Activity↔Project model
     are DONE. **Phase 2 (projects): PR-1/PR-2/PR-3 + the live RLS tighten
     are DONE; the seed + PR-4/5/6 are what's left.**

  2. docs/session_16_handoff.md — THIS doc.

  3. docs/excel_to_supabase_lessons.md — THE workstream notebook. Read the
     Session 15 (Bruh Parallax) section: lessons #1-5 + the roadmap + the
     "next concrete step."

  4. docs/kb-notes/playbook-measure-first-supabase-migration.md — the 5-step
     migration playbook. Session 15 added **step 4b (RLS tighten before
     exposing)** + a **step-3 derivation-unit caution**. Phase 2 PR-4/5/6 and
     Phases 3-5 all follow this.

  5. docs/kb-notes/phase-2-projects-migration-scope.md — the Phase 2 build
     contract. PR-4/5/6 shapes are spelled out there.

═══ FIRST: confirm the seed landed (it was pending at session-15 end) ═══

At the end of Session 15, the projects seed was **awaiting Sam's
workflow_dispatch** of "Projects Phase 2 — Seed Apply" (Actions tab → Run
workflow → main). Check whether it ran:
  - Via Supabase MCP: `select count(*) from public.projects;` — expect **34**.
  - Or look for a github-actions commit "Projects Phase 2 PR-3: seed APPLY"
    on main + receipts under kb/projects_seed_out/<date>/.
If it ran: verify kb/projects_validation.md is all-green (34 matches / 0 / 0)
and you're clear for PR-4. If it did NOT run yet: that's the gating step —
remind Sam to dispatch it (you can't trigger workflows; no MCP tool for it),
verify, THEN start PR-4. Do NOT seed via raw MCP inserts — that bypasses the
V1-V4 gate harness; the workflow is the gated path.

═══ PRIORITY WORKSTREAM: Phase 2 PR-4 (the dashboard cutover) ═══

PR-4 is the real user-facing threshold — the generator stops reading Excel
for projects and reads Supabase instead:
  - New kb/_load_projects.py mirroring kb/_load_workplan_goals.py: fetch from
    Supabase → write kb/projects_snapshot.json → on failure fall back to the
    snapshot with a "Data as of YYYY-MM-DD" stamp; both-fail → RuntimeError.
  - excel_to_dashboard.py main(): read_projects() becomes the DEPRECATED
    fallback; new load_projects_full() path feeds the projects list.
  - **KPI-ladder contract:** join workplan_goals kind='project' rows into the
    CPL_Data.js project entries so p.kpi_goal_2526 … still exist — the 3 JS
    report consumers (generate_reports.js, report_generator.js,
    college_report_generator.js) see NO change. (Excel ladder cols retire only
    when those JS consumers migrate — Phase 3+.)
  - Daily workflow git-adds kb/projects_snapshot.json.
  - This is a cutover → AskUserQuestion before merging it changes the live
    dashboard's data source. Snapshot fallback is the safety net.
Then PR-5 (inline editor, mirror workplan_goals.js — RLS already gated, so the
allowed_reviewers writes Just Work) and PR-6 (retire read_projects()).

═══ Carryover / parked (priority order) ═══

  1. **Seed verification** (above) — gates PR-4.
  2. **Vault Windows cutover — Sam still owes this.** PR #178 repointed the
     sync script in-repo, but Sam must still: clone cpl-project-tracker +
     cpl-knowledge-base into C:\Users\samuel.lee\Documents\GitHub\COG-second-brain,
     re-run scripts/setup-task-scheduler.ps1 from the new clone, and archive the
     orphan clones under Documents\Claude\Projects\CPLBrain. Steps in
     docs/kb-notes/playbook-vault-sync-setup.md. Until he does, his Obsidian
     won't auto-see this session's notes. Gently remind him.
  3. **Phase 2 PR-4/5/6** (above) — the priority build.
  4. **Phases 3-5** — Budget / Vision 2030 / Personnel, same 5-step shape +
     step 4b (RLS tighten). Personnel already has 26 Supabase rows → its PR-3
     has UPDATEs, not just INSERTs (the only phase where V2 source-exists
     actually fires on existing rows).
  5. **Older carryover** (from prior handoffs): 1e-5d data-value rename
     (M-ID/C-ID → MID/CID in the id_system field across 3 JSON files),
     Excel KPI-ladder column retirement (bundled with the JS-consumer
     migration), Letter Curator follow-on.

═══ Patterns Bruh Parallax found useful ═══

  - **Parallel sub-agent fan-out.** Background agents (Explore for the survey,
    worktree general-purpose agents for the vault fix + core_ids draft) ran
    while the main thread drove Phase 2. High throughput. BUT: a worktree
    agent can land on a STALE base (the core_ids agent drafted against
    2026-05-25 code where a since-deleted function still existed) — treat its
    diff as a proposal, re-apply against fresh main, review before merge.
  - **Measure-first before locking a derivation.** A ~30-line script against
    the real Excel caught the projects-unit-is-34-not-27 scope-doc assumption
    before it shipped. The derivation unit follows what the table FEEDS.
  - **Calibrate the merge bar to blast radius.** Mechanical config (vault fix)
    auto-merged on green; the visible-output change (core_ids) was held for
    Sam's nod; the live write (RLS + seed) got an explicit launch confirm.
  - **merge ≠ apply.** Apply-script PRs land the tooling; the actual write is a
    manual workflow_dispatch / a deliberate MCP apply. Keep the §8 gate at the
    irreversible step.
  - **Branch-per-PR off fresh origin/main** (git fetch origin main && git
    checkout -b <branch> origin/main each time) — never stacked, auto-merge
    never conflicts.
  - **AskUserQuestion for forks** with a recommended pick first — Sam locked
    all six Phase 2 forks in one round that way.

═══ Patterns to honor (non-negotiable) ═══

  - Rule 4: CPL_Dashboard.html and index.html stay identical (daily cron does
    the cp; don't hand-edit one).
  - Branch policy: claude/<short-description>; never push to main; auto-merge
    every PR you open once CI (TruffleHog) green + no unresolved reviews
    (squash, delete branch). CodeQL is push-only, not on PRs.
  - §8: schema/RLS changes to source-of-truth tables (projects, workplan_goals,
    budget, personnel) need Sam sign-off. apply_migration MCP for one-shot DDL;
    workflow_dispatch for per-row PostgREST sweeps. SUPABASE_SERVICE_KEY is a
    repo secret (in the workflows) but is NOT in the session env — you can't run
    the apply scripts locally; synthetic-test them (monkey-patch the HTTP layer).
  - Supabase projects: hvuwhnbuahrtptokpqfh ("Work Plan"). The OTHER project
    mdxutmbpoqjtdcwjscux ("cpl-budget-support") is the KB/legislative DB — do
    NOT touch it.
  - Don't read/cat the big coci_*.json / unified_courses_*.js files.

═══ User style ═══

Sam: CS-slang, "ack" is currency, professional-but-warm, never sycophantic.
Types fast — re-read a couple times. Loves a good moniker. Signals session end
with "checkmate" / "wind down" / "good for now" / "before I leave" / asks for
the handoff (like he did this session). Dispatches workflows + runs the daily
dashboard manually sometimes.

Good luck, Sixteen. Bruh Parallax shipped 5 PRs + a live RLS migration in one
parallel-agent sprint (vault fix, core_ids, Phase 2 PR-1/2/3) and left the
projects table seeded-and-ready behind a single workflow_dispatch. Confirm the
seed, then drive the PR-4 cutover. Carry the moniker forward. 🛰️
```

## How to use this file

When opening Session 16:
1. Copy the fenced block above.
2. Paste it as the first message in Session 16.
3. The session reads CLAUDE.md (auto-loaded) + the docs listed, confirms the
   seed landed, then drives Phase 2 PR-4.

## What Session 15 shipped (recap table)

| PR | What |
|---|---|
| #178 | Vault-sync repoint → `Documents\GitHub\COG-second-brain` |
| #179 | Phase 2 PR-1 — projects validator + pre-seed snapshots |
| #180 | core_ids auto-derive — Activity 5 renders, 4.1 sprint composite, Act 3 6→9 |
| #181 | Phase 2 PR-2 — seed plan (34 INSERT / 0 / 0 / 0) |
| #182 | Phase 2 PR-3 — apply script + RLS migration + workflow (build-only) |
| — | RLS tighten on `public.projects` — applied LIVE via MCP + verified |

**New KB notes this session:** (none standalone) — the RLS-tighten step (4b)
and the derivation-unit caution were folded into the existing
`playbook-measure-first-supabase-migration.md` (bumped `updated:`).

## What Session 15 did NOT decide (Session 16's call)

- **Whether the seed ran** — pending Sam's workflow_dispatch at session-15 end.
- **PR-4 cutover timing** — it changes the live dashboard's data source; get
  Sam's go before merging.

## Bruh Parallax's parting note

Session 15 was a parallel-agent sprint: forked background agents for the survey
+ vault fix + core_ids draft while the main thread drove the Phase 2 build
end-to-end (validator → seed plan → apply artifacts → live RLS). The throughput
held without sacrificing measure-first, synthetic-test-before-apply, and the
§8-gate-at-the-irreversible-step discipline. The one scar worth remembering:
a worktree sub-agent drafted against a stale base — review every agent diff
against fresh main before trusting it.

— Bruh Parallax, 2026-05-28
