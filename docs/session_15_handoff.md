---
title: Session 15 Hand-off Prompt
date: 2026-05-28
session: 14 → 15 hand-off (Bruh Sonnet → next)
status: hand-off — paste this into Session 15's first message
tags: [handoff, session-prompt, excel-to-supabase, phase-2, vault-sync, activity-project-model]
related:
  - docs/session_14_handoff.md (Bruh Baker → Bruh Sonnet hand-off)
  - docs/excel_to_supabase_lessons.md (the workstream notebook — Session 14 section is your scope sheet)
  - docs/kb-notes/phase-2-projects-migration-scope.md (the Phase 2 contract — has the 6 forks Sam must lock)
  - docs/kb-notes/playbook-vault-sync-setup.md (the vault-sync setup — needs a re-point, see VAULT below)
  - CLAUDE.md §11 (M-ID Lifecycle + Excel→Supabase roadmap)
moniker_suggestion: Bruh Quindec / Bruh Fifteen / Sonnet's Volta (with open door to claim own)
---

# Session 15 Hand-off Prompt

A "fattyfat prompt" from Bruh Sonnet (Session 14) to the next session.
Paste the fenced block into Session 15's first message.

## Moniker suggestion

**Bruh Quindec** — fifteen, Latin-ish, keeps the Bruh- lineage going
without forcing the decimal. **Sonnet's Volta** is a cute riff (a sonnet's
volta is the line-9 turn — fitting if Session 15 pivots the workstream).
Sam doesn't care; claim what you'll carry.

## The prompt

```
You are Session 15. The Bruh lineage now reads: Bruh → Prime → Quad → Hex
→ Hept → Octaman → Nona → Sexy Dexy → Bruh El → Bruh Dec → Bruh Baker →
Bruh Sonnet → you. Bruh Sonnet's suggested moniker is "Bruh Quindec" but
the lineage is loose; claim whatever you'll be comfortable carrying.

Start by reading, in order:

  1. CLAUDE.md — especially §11. The Excel→Supabase roadmap rows are
     current as of Session 14. Phase 1 (Workplan Goals) is DONE; the
     Activity↔Project model (PR-A/B/C) is DONE; Phase 2 (projects table)
     is SCOPED and awaiting Sam's lock on six forks before PR-1 ships.

  2. docs/session_14_handoff.md — THIS doc. (You're reading it.)

  3. docs/excel_to_supabase_lessons.md — THE workstream notebook. Read
     the whole thing but especially the Session 14 (Bruh Sonnet)
     checkpoint section: lessons #20-#24 + the strategic roadmap + the
     "next concrete step" pointing at Phase 2 PR-1.

  4. docs/kb-notes/phase-2-projects-migration-scope.md — THE Phase 2
     contract. This is your build sheet. It has:
       - Why projects is the right Phase 2 entry point (empty Supabase
         table → smallest PR-3 blast radius; biggest downstream unlock)
       - Full Excel→Supabase column mapping (8 renames, 3 type changes,
         2 drops, 10 ladder cols handled out-of-band)
       - The KPI-ladder contract-preservation strategy (join
         workplan_goals kind='project' into the CPL_Data.js builder so
         the 3 JS report consumers see no contract change)
       - The 5-step PR plan (validator → dry-run → apply → generator
         switch + snapshot → editor → retire read_projects)
       - **SIX FORKS at the bottom that Sam must lock before PR-1.**

  4b. docs/kb-notes/methodology-xss-audit-on-curator-editable-fields.md
     — NEW this session. Every Phase 2-5 PR that adds an editor for a
     previously-Excel-sourced field needs this audit. When projects
     names/descriptions become curator-editable (PR-5), sweep the WHOLE
     renderer for unescaped sites, not just the obvious one. Use
     `from html import escape as html_escape` (the bare `html` name is
     shadowed by a local variable in excel_to_dashboard.py renderers).

  4c. docs/kb-notes/playbook-measure-first-supabase-migration.md — the
     5-step playbook Phase 1 validated. Phase 2 follows it exactly.

═══ TWO THINGS NEED SAM BEFORE YOU CUT PHASE 2 CODE ═══

═══ A. The six Phase 2 forks (blocks PR-1) ═══

Bring Sam the six forks from the bottom of the Phase 2 scope doc via
AskUserQuestion. Bruh Sonnet tried to ask forks 1-4 at session end but
Sam dismissed (end of day). The forks, with Bruh Sonnet's RECOMMENDED
picks:

  1. Date parser (start_date/end_date/update_date str→date): RECOMMEND
     lenient with fallback to NULL (try ISO, then M/D/YYYY, then
     D-Mon-YYYY; unparseable → NULL + validator warning, non-blocking).
  2. budget type: RECOMMEND keep as text, pass through ("$2.5M" etc.).
     Numeric refactor is a separate concern.
  3. status field: RECOMMEND free-form text, no CHECK constraint. PR-5
     editor gives a dropdown but accepts free-text.
  4. override/excel_row drop: RECOMMEND drop both. override is config-
     routing (read_config_overrides runs separately); excel_row is
     source-mapping. Neither is a project data field.
  5. JS contract — kpi_target_2026/2030: leave NULL in Phase 2; the
     ladder values come via the workplan_goals join (PR-4). A future
     PR can backfill aggregate targets if curators want them.
  6. RLS shape: mirror kb_curation/workplan_goals (is_allowed_reviewer()
     gates writes; public SELECT). NEEDS SAM SIGN-OFF per CLAUDE.md §8
     (schema/RLS change to a source-of-truth table).

Once locked, PR-1 (validator + snapshots) ships on a fresh branch
mirroring kb/_validate_workplan_goals.py. Expected initial diff: 27
missing + 0 mismatches + 0 orphans (projects table is empty today).

═══ B. The Obsidian vault-sync mess (do FIRST — it's why Sam couldn't
see this session's KB notes) ═══

Session 14 ended with a debugging session on Sam's Obsidian. ROOT CAUSE
FOUND but NOT YET FIXED. The migration from Claude Cowork → Claude Code
AND from CPLBrain (private) → cpl-knowledge-base (public) left FOUR
parallel locations that all think they're authoritative:

  - C:\Users\samuel.lee\Documents\Obsidian Vault
  - C:\Users\samuel.lee\Documents\GitHub\COG-second-brain          ← Sam's
    REAL Obsidian vault root (where Obsidian is actually pointed)
  - C:\Users\samuel.lee\Documents\Claude\Projects\CPLBrain\COG-second-brain
    ← where scripts/sync-vault-clones.ps1 PULLS (its hardcoded $vaultRoot)
  - C:\Users\samuel.lee\Documents\Claude\Projects\CPLBrain\COG-second-brain\cpl-knowledge-base

THE BUG: the sync script ($vaultRoot at scripts/sync-vault-clones.ps1
line ~28) pulls commits into Documents\Claude\Projects\CPLBrain\... but
Obsidian's vault is rooted at Documents\GitHub\COG-second-brain. So the
sync works (18 successful pulls logged 2026-05-28) but the files land
where Obsidian isn't looking. Sam confirmed: switching Obsidian to the
Claude\Projects path made today's notes appear.

THE FIX (Bruh Sonnet's recommended shape — confirm with Sam first):
  1. Decide the ONE canonical vault root. Likely
     Documents\GitHub\COG-second-brain (Sam's active Obsidian vault).
  2. Clone cpl-project-tracker + cpl-knowledge-base into that root if
     not already there.
  3. Update scripts/sync-vault-clones.ps1 $vaultRoot to match.
  4. Re-point the "CPL Vault Sync" Windows Task Scheduler entry at the
     updated script (scripts/setup-task-scheduler.ps1 can re-register).
  5. Delete/archive the orphan clones so there's ONE source of truth.
  This is a cross-machine config cleanup; Sam drives the Windows side,
  you PR the script changes. Lead with this — it's blocking Sam from
  seeing the vault auto-sync that the whole KB-notes lane depends on.

═══ What shipped Session 14 (Bruh Sonnet) ═══

  - PR #170 — Activity↔Project PR-A: schema migration (kind column +
    workplan_activity_associations N-to-N table + RLS + 27 backfilled
    1-to-1 associations). Applied via apply_migration MCP (one-shot DDL).
  - PR #171 — PR-B: first-class Activities section + "Contributes to:
    Activity N" project chips + Supabase-sourced group labels +
    data-kind-scoped editor.
  - PR #172 — PR-C: editor add-flow modal (Activity/Project radio +
    strict ID validation + N-to-N multi-select + ladder fields + batch
    POST + reload).
  - PR #173 — Activity-KPI cards label cleanup (build_activity_kpis
    sources labels from Supabase; Activity 5 added to fallback).
  - PR #174 — bug-hunt fixes (HTML-escape 6 renderer sites + Esc-listener
    leak + syncKindUI robustness).
  - PR #175 — Phase 2 projects-migration scoping doc.
  - PR #176 — Rule 8 checkpoint.

  All 7 PRs auto-merged on green CI (TruffleHog). Schema migration +
  backfill landed live in Supabase (V1-V4 gates green inline).

═══ Carryover / parked (in priority order) ═══

  1. **Vault-sync mess** (B above) — do first, it's blocking Sam's
     Obsidian.
  2. **Phase 2 PR-1** (A above) — lock the 6 forks, then ship.
  3. **build_activity_kpis core_ids auto-derivation** — pre-existing
     bug surfaced by PR #173. core_ids is hardcoded, missing 5.1, uses
     4.1a-d instead of 4.1.1-4.1.4 → Activity 5 KPI cards don't render
     + sprint composite sums wrong. Fix: auto-derive from projects list
     (the A+ pattern). Small-ish refactor. Could slot before or after
     Phase 2 PR-1.
  4. **Excel KPI ladder column retirement** — needs all 3 JS consumers
     (generate_reports.js, report_generator.js, college_report_generator.js)
     migrated first. Bundled into Phase 2+ when project metadata moves.
  5. **PR-D** (separate Workplan Goals tab) — parked unless curator
     demand. Sam's prior preference: one page, two sections.
  6. **Older carryover** (from Session 13): Letter Curator follow-on,
     1e-5d data-value rename (M-ID/C-ID → MID/CID in id_system field),
     Phase 3-5 (Budget/Vision 2030/Personnel migrations).

═══ Patterns Bruh Sonnet found useful ═══

  - Survey-before-scope (the lineage pattern, reinforced). Reading the
    actual Supabase schema + the existing renderer + the editor JS
    before proposing PR-A's plan caught the data-kind scoping need and
    the no-DB-FK decision early.
  - The dry-run / V1-V4-gate discipline generalizes. PR-A's schema
    migration used the same V1-V4 shape (cardinality / source-exists /
    integrity / validator-clean) even though it was DDL not a re-key.
  - AskUserQuestion for architectural forks. Three forks at PR-A start
    (ID scheme, ladder values, FK strategy), three at PR-B (layout,
    zero-ladder, chips), three at PR-C (button placement, validation
    strictness, edit-scope). Each had materially different blast radius;
    surfacing them as labeled options with a recommended pick made the
    decisions fast.
  - Background bug-hunt agent after a multi-PR workstream. 3.5 min,
    9 findings, 3 real (incl. an XSS regression). High yield; cheap.
  - Branch-per-PR off fresh origin/main. Every PR got its own branch
    cut from the latest main (not stacked), so auto-merge never had a
    conflict. `git fetch origin main && git checkout -b <branch>
    origin/main` each time.
  - When a cleanup uncovers a bigger structurally-similar bug, NAME it
    on the PR row, don't scope-creep the cleanup (the core_ids bug).

═══ Patterns to honor (non-negotiable) ═══

  - Rule 4: CPL_Dashboard.html and index.html must stay identical (the
    daily cron does the cp; don't hand-edit one).
  - Branch policy: claude/<short-description>; never push to main.
  - Auto-merge IS authorized for every PR you open once CI is green +
    no unresolved reviews (squash, delete branch). Architecturally-
    significant work still goes through PRs + in-script V1-V4 gates +
    workflow_dispatch manual triggers for apply steps — but the
    PR-merge button is not where the human gate lives.
  - Schema/RLS changes to workplan_goals / projects / other source-of-
    truth tables need explicit Sam sign-off per CLAUDE.md §8. Phase 2
    PR-3 (apply) + the RLS migration both need it.
  - apply_migration MCP for one-shot DDL that fits a transaction;
    workflow_dispatch for per-row PostgREST sweeps (like Phase 1 PR-3's
    54 operations). PR-A used apply_migration; Phase 2 PR-3 will use
    workflow_dispatch (27 INSERTs).
  - KB Supabase (mdxutmbpoqjtdcwjscux, cpl-knowledge-base repo) is
    shared with a live legislative campaign — schema changes need
    user sign-off there.
  - /checkpoint at context milestones. Author KB notes at kb-status:
    published directly (no review queue). The vault auto-sync brings
    them into Obsidian — ONCE THE VAULT-PATH MESS IS FIXED (see B).

═══ User style ═══

Sam enjoys CS-slang, "ack" is good currency, professional-but-warm,
never sycophantic. Types fast — re-read a couple times before
responding. Signals session end with "checkmate" / "wind down" / "good
for now" / "before I leave" / "SC before I leave". Don't write the
handoff until he signals. He runs the daily dashboard workflow manually
sometimes ("I manually ran the workflow") — that's the GitHub Actions
daily-dashboard.yml dispatch, regenerating CPL_Dashboard.html from the
latest Supabase + Excel.

Good luck, Fifteen. Bruh Sonnet shipped 7 PRs end-to-end (the whole
Activity↔Project model + cleanup + bug-hunt + Phase 2 scope + a
checkpoint) and debugged the vault-path mess down to root cause. Two
clean handoffs for you: fix the vault sync so Sam SEES the work, then
lock the six forks and start Phase 2. Carry the moniker forward.
```

## How to use this file

When opening Session 15:
1. Copy the fenced block above.
2. Paste it as the first message in Session 15.
3. The session reads CLAUDE.md (auto-loaded) + the docs listed, then
   leads with the vault-sync fix (B) and the Phase 2 fork-lock (A).

## What Session 14 shipped (recap table)

| PR | What |
|---|---|
| #170 | Activity↔Project PR-A — schema migration (kind + associations + RLS + backfill) |
| #171 | PR-B — first-class Activities section + project chips |
| #172 | PR-C — editor add-flow modal |
| #173 | Activity-KPI cards label cleanup |
| #174 | bug-hunt fixes (HTML-escape + Esc leak + syncKindUI) |
| #175 | Phase 2 projects-migration scoping doc |
| #176 | Rule 8 checkpoint |

**New KB notes** (Obsidian-target, durable):

- `methodology-xss-audit-on-curator-editable-fields` — audit the whole
  renderer when a trusted field becomes curator-editable (Session 14)
- `phase-2-projects-migration-scope` — the Phase 2 build contract +
  6 forks (Session 14)

## What Session 14 explicitly did NOT decide (Session 15's call)

- **The six Phase 2 forks** — Sam dismissed the fork-lock question at
  session end; Session 15 re-asks via AskUserQuestion.
- **The canonical Obsidian vault root** — Sam has 4 parallel locations
  post-migration; Session 15 + Sam pick the one true root and re-point
  the sync script + Task Scheduler.
- **core_ids auto-derivation timing** — before or after Phase 2 PR-1.

## Bruh Sonnet's parting note

Session 14 was a clean single-workstream sprint: the Activity↔Project
N-to-N model landed end-to-end (schema → render → edit → add-flow),
got cleanup + a security bug-hunt, and Phase 2 got fully scoped. The
session ended on a debugging detour into Sam's Obsidian that turned up
a genuine config drift — the vault-sync script pulls to one path,
Obsidian reads another. That's the first thing Session 15 should fix,
because the whole KB-notes lane (and Sam's ability to see the work in
his vault) depends on it.

Velocity stayed high without sacrificing the survey-before-scope,
dry-run-before-apply, V1-V4-gate discipline. Keep it.

— Bruh Sonnet, 2026-05-28
