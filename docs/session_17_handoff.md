---
title: Session 17 Hand-off Prompt
date: 2026-05-29
session: 16 → 17 hand-off (Bruh Word → next)
status: hand-off — paste the fenced block into Session 17's first message
tags: [handoff, session-prompt, excel-to-supabase, phase-3, budget, vault]
related:
  - docs/session_16_handoff.md (Bruh Parallax → Bruh Word hand-off)
  - docs/excel_to_supabase_lessons.md (the Session 16 section is your scope sheet)
  - docs/kb-notes/playbook-measure-first-supabase-migration.md (the 5-step template)
  - docs/kb-notes/methodology-parity-test-cutover-proof.md (NEW — the cutover proof)
  - CLAUDE.md §11 (Excel→Supabase roadmap; Phase 2 rows are now DONE)
moniker_suggestion: Bruh Q (17th letter) / Bruh Heptadec — open door to claim your own
---

# Session 17 Hand-off Prompt

A "fattyfat prompt" from Bruh Word (Session 16) to the next session.
Paste the fenced block into Session 17's first message.

## Moniker suggestion

**Bruh Q** — the 17th letter, snappy and characterful (Bond's Q / Star Trek's Q).
**Bruh Heptadec** if you want the number-name lineage feel (Bruh Word was the
16-bit *word*; 17 doesn't map to a clean CS unit, so Q is the cleaner nod). Sam
loves a good moniker and an open door — claim whatever you'll carry.

## The prompt

```
You are Session 17. The Bruh lineage: Bruh → Prime → Quad → Hex → Hept →
Octaman → Nona → Sexy Dexy → Bruh El → Bruh Dec → Bruh Baker → Bruh Sonnet →
Bruh Parallax → Bruh Word → you. Bruh Word suggests "Bruh Q" (17th letter) but
the lineage is loose — claim what you'll carry.

Start by reading, in order:
  1. CLAUDE.md — especially §11. The Excel→Supabase roadmap is current.
     **Phase 1 (Workplan Goals) + Activity↔Project model + Phase 2 (Projects)
     are all DONE.** Phase 3-5 (Budget / Vision 2030 / Personnel) are next.
  2. docs/session_17_handoff.md — THIS doc.
  3. docs/excel_to_supabase_lessons.md — THE workstream notebook. Read the
     Session 16 (Bruh Word) section: 5 lessons + roadmap + next concrete step.
  4. docs/kb-notes/playbook-measure-first-supabase-migration.md — the 5-step
     migration template (snapshot → validate → dry-run → workflow_dispatch
     apply → cutover) + step 4b (RLS tighten before exposing).
  5. docs/kb-notes/methodology-parity-test-cutover-proof.md — NEW this session.
     The byte-identical parity test that proves a data-source cutover is
     behavior-preserving. Use it for every Phase 3-5 cutover (PR-4 step).

═══ FIRST: confirm Phase 2 is live + clean ═══

PR-4 (cutover) + PR-5 (editor) merged at Session-16 end, but the editor's
`proj-*` CSS + the Supabase-sourced cards only go live on the **next daily
regen** (cron 10:17 UTC) or a manual `workflow_dispatch` of "Daily CPL
Dashboard". So FIRST: confirm the daily run succeeded —
  - check for a fresh "Daily dashboard update — <date>" commit on main,
  - eyeball the live dashboard (https://cpl-initiative.github.io/cpl-project-tracker/):
    project cards show a subtle "Project data as of YYYY-MM-DD" line, the 7 new
    rows (Team / CPL Goal / Timeline / KPI / Milestones) render, and a signed-in
    allowed-reviewer (map@rccd.edu) gets the click-to-edit hover affordance.
  - `kb/projects_snapshot.json` should refresh each run (workflow git-adds it).
If the first live regen is off (the parity + smoke tests passed in-session, but
the live cron is the real test), that's your first fix. If Sam wants it live
now, he dispatches the daily workflow (you can't trigger workflows).

═══ PRIORITY WORKSTREAM: Phase 3 — Budget ═══

Migrate the Budget tab Excel→Supabase, same five-step shape as Phase 1/2:
  - PR-1: kb/_validate_budget.py (mirror kb/_validate_projects.py). MEASURE
    FIRST — derive the real Excel→Supabase column map + diff against the live
    `budget_expenditures` table. Check whether it already has rows (Personnel
    has 26 → UPDATEs; Budget may be empty → clean INSERTs). The derivation UNIT
    follows what the Budget tab FEEDS (don't assume it's the same as projects).
  - PR-2: dry-run seed plan. PR-3: apply script + workflow_dispatch + the RLS
    tighten (mirror kb/supabase_projects_rls_tighten.sql; apply via MCP
    apply_migration, get Sam's go — it's a source-of-truth table per §8).
  - PR-4: generator cutover (kb/_load_budget.py + snapshot fallback + "Data as
    of" stamp) — back it with a PARITY TEST (the new methodology note).
  - PR-5: inline editor (mirror workplan_goals.js / projects_editor.js; RLS
    already gated after PR-3's tighten). XSS-audit any newly-curator-editable
    field (the hostile-input smoke test IS the review).
Lock any forks (date/number types, enums) with AskUserQuestion BEFORE PR-1 ships.

═══ Carryover / parked (priority order) ═══

  1. **Verify Phase 2 live** (above) — gates confidence in the cutover.
  2. **Phase 3 Budget** (above) — the priority build.
  3. **Phases 4-5** — Vision 2030 / Personnel, same shape. Personnel already
     has 26 Supabase rows → its PR-3 has UPDATEs (only phase where V2
     source-exists fires on existing rows).
  4. **Obsidian community plugins** — Sam enabled community plugins (uses none
     yet) + wants recommendations later. Captured in
     docs/kb-notes/playbook-vault-sync-setup.md (candidates: Dataview,
     Templater, Obsidian Git, Kanban). Ask about his workflow, then recommend
     a minimal set. Low priority; pick up when he raises it.
  5. **Older carryover:** the "Open in Excel" buttons + Excel KPI-ladder cols +
     D.* helpers all retire together when the 3 JS report consumers
     (generate_reports.js, report_generator.js, college_report_generator.js)
     migrate off CPL_Data.js — a Phase 3+ bundle. Also: 1e-5d data-value rename
     (M-ID/C-ID → MID/CID in the id_system field); Letter Curator follow-on.

═══ Patterns Bruh Word found useful ═══

  - **Parity test = cutover proof.** Don't reason that a data-source swap is
    equivalent — diff the new path against the old field-by-field, bucket diffs
    into hard-fail / expected / cosmetic, ship on zero hard-fails. It caught 3
    scope-doc gaps reasoning had missed. (New kb-note.)
  - **Delegate the big build to a worktree sub-agent, but the review is the
    work — and a hostile-input smoke test IS the review.** PR-5's 485-line
    editor was sub-agent-built; the review's `<script>`/`"`/`<img onerror>` test
    caught a data-folder XSS sink the agent missed. Treat the agent diff as a
    proposal; earn the merge with the test.
  - **Measure-first before locking a derivation.** A ~30-line script against the
    real Excel/Supabase beats a scope-doc assumption every time.
  - **Calibrate the merge gate to blast radius.** Live-data-source cutover →
    AskUserQuestion before merge. Public-appearance change → ask the one
    substantive fork, then merge. Mechanical config → auto-merge on green.
  - **Branch-per-PR off fresh origin/main** (git fetch origin main && git
    checkout -b <branch> origin/main). Never stacked; auto-merge never conflicts.
  - **AskUserQuestion for forks, recommended option first.** Sam decides fast.

═══ Patterns to honor (non-negotiable) ═══

  - Rule 4: CPL_Dashboard.html and index.html stay byte-identical (the daily
    cron does the cp; if you hand-edit one, edit both). Editor CSS belongs in
    EXHIBIT_ANALYSIS_CSS (Python) so the regen injects it into both.
  - Rule 1: anything in a generator-replaced region (project cards, KPI cards,
    grid) must change in the Python renderer, NOT the HTML — it's overwritten
    on the next regen. Static assets (projects_editor.js etc.) are files +
    script tags.
  - Branch policy: claude/<short-description>; never push to main; auto-merge
    every PR you open once CI (TruffleHog) green + no unresolved reviews
    (squash, delete branch). CodeQL is push-only, not on PRs.
  - §8: schema/RLS on source-of-truth tables (projects, workplan_goals, budget,
    personnel) need Sam sign-off. apply_migration MCP for one-shot DDL;
    workflow_dispatch for per-row PostgREST sweeps. SUPABASE_SERVICE_KEY is a
    repo secret (in workflows) but NOT in the session env — you can't run the
    apply scripts locally; synthetic-test them (monkey-patch the HTTP layer) or
    parity-test via the committed snapshot.
  - Supabase project: hvuwhnbuahrtptokpqfh ("Work Plan"). The OTHER project
    mdxutmbpoqjtdcwjscux ("cpl-budget-support") is the KB/legislative DB — do
    NOT touch it.
  - Don't read/cat the big coci_*.json / unified_courses_*.js files.
  - openpyxl isn't in the session container by default — `pip install openpyxl`
    if you need to inspect the Excel locally.

═══ User style ═══

Sam (MAP@rccd.edu): CS-slang, warm, "ack"/"Word" is currency, never sycophantic.
Types fast — re-read a couple times. Loves a good moniker + an open door. Works
vault/Obsidian tasks in parallel with the code (be ready to context-switch
between a PR build and a PowerShell one-liner). Dispatches workflows + runs the
daily dashboard himself. Signals session end warmly ("checkmate" / "good for
now" / asks for the fattyfat capsule, like he did this session).

Good luck, Seventeen. Bruh Word shipped a full Phase 2 (seed + cutover + editor,
5 PRs), a gitignore fix, and guided an end-to-end vault consolidation — all in
one session. Phase 2 is DONE; verify it live, then take Budget. Carry it
forward. 🅰️🆀
```

## How to use this file

When opening Session 17:
1. Copy the fenced block above.
2. Paste it as the first message in Session 17.
3. The session reads CLAUDE.md (auto-loaded) + the docs listed, verifies Phase 2
   is live + clean, then takes Phase 3 (Budget).

## What Session 16 shipped (recap table)

| PR | What |
|---|---|
| #184 | Phase 2 PR-4 — projects generator reads Supabase + snapshot fallback (cutover) |
| — | Phase 2 PR-3 seed dispatched + landed (34 rows, V1-V4 green) |
| #185 | Gitignore Claude Code background-agent worktrees |
| #186 | Phase 2 PR-5 — projects 17-field inline editor (sub-agent-built, reviewed + XSS-hardened) |
| #187 | Rule 8 checkpoint (this session's docs) |
| — | Vault consolidation guided end-to-end (sync verified, 4 orphan locations resolved) |

**New KB notes this session:** `methodology-parity-test-cutover-proof.md` (new);
appended PR-5 instance to `methodology-xss-audit-on-curator-editable-fields.md`;
appended consolidation + community-plugins follow-up to `playbook-vault-sync-setup.md`.

## What Session 16 did NOT decide (Session 17's call)

- **Phase 3 entry tab** — Budget is the natural next (own section already), but
  measure first; Personnel (26 existing rows) is the UPDATEs-heavy one.
- **When to retire the Excel ladder cols / "Open in Excel" buttons / D.* helpers**
  — bundled with the JS-consumer migration (Phase 3+).

## Bruh Word's parting note

A high-throughput session: a background sub-agent built PR-5 while the main thread
drove PR-4 + fielded Sam's vault questions in parallel, and the discipline held —
measure-first, parity-test-as-proof, test-driven review of the agent's diff, and
the §8 gate at each irreversible step. The one scar worth carrying: a sub-agent's
diff is a *proposal* — the hostile-input smoke test, not the eyeball, is what
caught the XSS sink it missed. Phase 2 is done and clean. Verify it live, then
Budget.

— Bruh Word, 2026-05-29
