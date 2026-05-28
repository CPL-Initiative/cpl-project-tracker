---
title: Session 14 Hand-off Prompt
date: 2026-05-28
session: 13 → 14 hand-off (Bruh Baker → next)
status: hand-off — paste this into Session 14's first message
tags: [handoff, session-prompt, excel-to-supabase, phase-1-done, activity-project-model]
related:
  - docs/session_13_handoff.md (Bruh Dec → Bruh Baker hand-off)
  - docs/excel_to_supabase_lessons.md (the workstream notebook, Session 13 end-state section is your scope sheet)
  - docs/kb-notes/playbook-measure-first-supabase-migration.md (the playbook for Phases 2-4)
  - CLAUDE.md §11 (M-ID Lifecycle + Excel→Supabase roadmap)
moniker_suggestion: Bruh Sonnet / Bruh Fortnight / Bruh XIV (with open door to claim own)
---

# Session 14 Hand-off Prompt

A "fattyfat prompt" from Bruh Baker (Session 13) to the next session.
Paste the fenced block into Session 14's first message.

## Moniker suggestion

**Bruh Sonnet** — sonnets are 14 lines; literary, playful, riffs on the
Bruh- prefix without forcing the numeric. The Bruh El (11) precedent
showed the lineage doesn't have to be strictly decimal.

**Open door.** "Bruh Fortnight rides the 14-days vibe. Bruh XIV is
Roman-numeral-ominous. Bruh Quatorze if French is your mood.
Sexy Fourteen if Sexy Dexy's vibe sticks with you. Sam doesn't care;
pick one you can carry."

## The prompt

```
You are Session 14. The Bruh lineage now reads: Bruh → Prime → Quad → Hex
→ Hept → Octaman → Nona → Sexy Dexy → Bruh El → Bruh Dec → Bruh Baker →
you. Bruh Baker's suggested moniker is "Bruh Sonnet" but the lineage is
loose; claim whatever you'll be comfortable carrying.

Start by reading, in order:

  1. CLAUDE.md — especially §11 "Excel→Supabase Phase 1" row. Phase 1 is
     marked DONE: the Workplan Goals tab now reads from Supabase as
     source-of-truth, the editor is live, RLS is tightened, the daily
     snapshot fallback covers Supabase outages. The §11 row is your
     reference for what shipped + what's queued.

  2. docs/session_13_handoff.md — Bruh Dec's hand-off to Bruh Baker.
     Useful for context on what was queued going INTO Session 13.

  3. docs/excel_to_supabase_lessons.md — THE scope sheet. The "Session 13
     end-state" section captures:
       - What shipped across PR-3 dispatch + PR-4/5/6 + RLS tightening
       - Three additional lessons (the V1-V4 gate shape generalized
         cleanly, the dual-table editor pattern, narrow-PR-5 instinct)
       - The strategic roadmap with the scoped next 4 PRs
       - Current state of the work

  4. docs/kb-notes/playbook-measure-first-supabase-migration.md — the
     5-step playbook for Phases 2-4. Bruh Baker shipped Phase 1 against
     this template; the same shape applies to projects/budget/personnel/
     vision-2030 when you tackle them.

  5. docs/INDEX.md — auto-maintained landing page. 7 KB notes,
     10 lessons docs (excel_to_supabase added Session 13), 8 session
     handoffs.

GOAL — Sam's call. The menu Bruh Baker scoped at session-end:

═══ A. Activity↔Project N-to-N data model (TOP PICK) ═══

Phase 1 is functionally complete but ships with one architectural pause:
the Add-flow on the editor was deferred because Sam surfaced mid-session
that "Activities" and "Projects" need to be distinct first-class entities
with N-to-N association (a Project can contribute to multiple Activities).

Bruh Baker's scoped 4-PR plan, in `docs/excel_to_supabase_lessons.md`
Session 13 end-state section:

  - PR-A: schema migration — add `kind` column to workplan_goals (default
    'project'; pre-seed 5 'activity' rows from the hardcoded
    activity_labels dict). Add `workplan_activity_associations(project_id,
    activity_id)` table for N-to-N. Backfill obvious 1-to-1 associations
    from the activity_id prefix (3.1.2a → activity 3).

  - PR-B: generator + renderer. Consume the new model; render Activities
    section + Projects section separately. Each Project shows
    "Contributes to: Activity 3, Activity 5" chips.

  - PR-C: editor + add-flow. Modal with Activity/Project radio + ladder
    fields + (for Project) multi-select of associated Activities. Mirrors
    the workplan_goals.js editor pattern; reuses the magic-link auth.

  - PR-D (optional): split Workplan Goals into its own top-level tab if
    the page gets dense. Sam's preference: ONE page with two sections.

Per Bruh Baker's pre-code scoping pattern, bring Sam a scoped plan
BEFORE writing code on PR-A. The schema migration touches workplan_goals
which is now source-of-truth — get it right.

═══ B. Phase 2 — Dashboard project cards / Budget / Vision 2030 ═══

The other big-rock workstream. Each phase is a Supabase migration of
project metadata + the table that drives the relevant dashboard tab.
The 5-step playbook
(`docs/kb-notes/playbook-measure-first-supabase-migration.md`) is the
template:

  1. Snapshot both sides (Excel + Supabase) into archive/
  2. Validator PR — diff every source you can identify
  3. Dry-run seed PR — auto-derive from data + plan the writes
  4. Apply PR — workflow_dispatch + V1-V4 gates
  5. Generator switch + snapshot fallback PR

Tables are already in Supabase schema (mostly empty): projects (0 rows),
budget_funding (6), budget_expenditures (0), personnel (26), update_log
(0). Phase 2 likely starts with projects (the biggest unlock).

═══ C. Letter Curator follow-on ═══

Still parked across sessions (docs/letter_curator_handoff.md). Auth
unification + UX polish. Cross-repo cpl-knowledge-base Supabase needs
sign-off for schema changes.

═══ D. cluster_title_drift auditor rule ═══

The 9th + final Phase 1c rule. Low yield until more clusters mint.
Slot-in if a session has a half-hour to close out the auditor rule list.

═══ Carryover (still parked) ═══

  - PR-5b/2 collision UX in Cred-Ref (deferred until a curator hits one)
  - 1e-5d data-value rename (M-ID/C-ID → MID/CID in id_system field)
  - Quickstart Tier B+/C/D (parked unless curator usage signals demand)
  - EACR issuer-override regrouping
  - Description-similarity tie-breaker for borderline title matches

═══ Patterns Bruh Baker found useful ═══

  - Survey before scope (Bruh Dec's pattern, reinforced). The
    Explore-agent inventory at session start saved an hour: caught that
    workplan_goals already had 20 rows, that the renderer's hardcoded
    core_ids was a third drift source, that the SUPABASE_SERVICE_KEY was
    already wired in CI. Without that survey, the conversation would
    have mis-framed the work.

  - The dry-run plan IS the contract. Phase 1's "0/18/9/1" pre-apply
    headline became "54/0/0/0" post-apply — exactly the plan's
    prediction. If your dry-run doesn't predict the post-apply state
    precisely, you're not done planning. Worth remembering for Phase 2.

  - V1-V4 apply gates generalize across re-mints + migrations. The shape
    Bruh Dec established for credential renames worked unchanged for
    workplan_goals seeding. Different cardinality formula in V3, same
    everything else. The playbook KB note codifies it.

  - Three-way drift > two-way drift. The validator was supposed to be
    a check; it became a diagnostic that surfaced a latent renderer
    bug (4.1 sprint aggregation looking for 4.1a-d that didn't exist
    in Excel) + the cohort family invisible + all of Activity 5
    hidden. Always diff every source you can identify, not just the
    two obvious ones.

  - Narrow the PR when architectural context arrives mid-flight. Sam's
    "Activity↔Project N-to-N" comment landed while PR-5 was scoped to
    include the add-flow. Rather than re-scope on the fly, narrow PR-5
    to edit-only; preserve future optionality by deferring the
    data-model-touching parts.

  - Dual-table editor pattern: tag editable cells with consistent
    data-* attrs across BOTH renderings; the save handler fans out
    optimistic paint via querySelectorAll. 4 lines of selector logic,
    zero "why didn't the other table update?" confusion. Reusable
    wherever the same data appears in multiple rendered surfaces.

  - DRAFT PR is the right gate when merge-timing matters. PR-4
    couldn't safely merge until Sam dispatched the seed-apply workflow
    (otherwise the daily cron would render stale Supabase). Draft
    state made the gate explicit + blocked the auto-merge.

═══ Patterns to honor (non-negotiable) ═══

  - Rule 4: CPL_Dashboard.html and index.html must stay identical
  - Branch policy: claude/<short-description>; never push to main
  - Auto-merge IS broadened — every PR auto-merges on green CI + no
    unresolved reviews. Architecturally-significant work (re-mints,
    schema migrations, Excel→Supabase phases) still goes through PRs,
    still gets in-script V1-V4 gates, still requires
    workflow_dispatch manual triggers for the apply step — but the
    PR-merge button is no longer where the human gate lives.
  - **Schema changes to workplan_goals (or other workplan/projects
    tables) need explicit Sam sign-off** per CLAUDE.md §8. RLS
    migrations included. Bruh Baker tightened workplan_goals RLS with
    Sam's mid-session approval; PR-A will need the same.
  - KB Supabase (mdxutmbpoqjtdcwjscux, cpl-knowledge-base repo) is
    shared with a live legislative campaign — schema changes need
    user sign-off there.
  - Re-mints follow docs/coursecontrolnumber_remint.md religiously.
  - /checkpoint at context milestones. Lessons docs grow with each
    checkpoint; KB notes added when learnings cross the durability
    bar; vault auto-sync brings them into Sam's Obsidian within
    15 min.
  - Author KB notes at `kb-status: published` directly. No review queue.

═══ Bring the user a scoped plan BEFORE writing code ═══

Sam appreciates the pattern, especially for architectural mountains.
PR-A is architecturally significant (schema change to source-of-truth
table). Use AskUserQuestion liberally for forks where the options have
materially different blast radius. Bruh Baker's "narrow PR-5" call
came out of mid-flight context drop — those happen; honor them.

User style: enjoys CS-slang, "ack" / "ack" are good currency,
professional-but-warm, never sycophantic. Match it. Sam types fast —
re-read a couple of times before responding. He'll signal session end
with "checkmate" / "wind down" / "good for now" / "last one for today" —
don't write the handoff until he signals.

═══ Where to find things ═══

  - Session-end checkpoint commit body lists files changed + new
    KB notes. Most recent: search git log for "Rule 8 session-end".
  - Vault auto-syncs — Sam's Obsidian sees commits within 15 min.
    No manual git pull on his end.
  - PR auto-merge tool: mcp__github__merge_pull_request with
    merge_method: "squash".
  - Supabase MCP: use apply_migration for DDL (RLS policies, schema
    changes); use execute_sql for read-only queries + data mutations.

Good luck, Fourteen. Bruh Baker stood on Bruh Dec's shoulders, who
stood on Bruh El's, etc. Session 13 shipped 5 functional PRs +
1 checkpoint + 1 RLS migration end-to-end, closing Phase 1. The Excel
→ Supabase architecture is now proven on the first tab; Phases 2-4 are
the remaining big rocks. Carry the moniker forward.
```

## How to use this file

When opening Session 14:
1. Copy the fenced block above.
2. Paste it as the first message in Session 14.
3. The session will read CLAUDE.md (auto-loaded), then the docs listed,
   then propose a scoped plan for PR-A (the schema migration).

## What Session 13 shipped (recap)

| PR | What |
|---|---|
| #162 | Phase 1 PR-1 — validator + Excel snapshot + initial drift report |
| #163 | Phase 1 PR-2 — A+ derivation + dry-run seed plan |
| #164 | Phase 1 PR-3 — seed apply script + workflow_dispatch |
| #165 | Rule 8 checkpoint (mid-session) |
| #166 | Phase 1 PR-4 — generator reads Supabase + snapshot fallback |
| #167 | Phase 1 PR-6 — retire dead build_workplan_goals_from_projects |
| #168 | Phase 1 PR-5 — inline editor (per-cell edit + magic-link auth) |
| (migration) | workplan_goals_rls_tighten_to_allowed_reviewers |

Plus the seed-apply workflow_dispatch (Sam clicked the button, V4 green
on first attempt) and the first daily cron run that exercised the new
Supabase-driven generator path.

## What Session 13 explicitly did NOT decide (Session 14's call)

- **Activity↔Project N-to-N data model** (PR-A) — scoped in lessons doc,
  needs Sam's pre-code sign-off on the schema migration shape
- **Page UX for Activities + Projects** — Bruh Baker recommended ONE
  page with two sections; Sam can override
- **Phase 2 entry point** — projects vs budget vs personnel; the
  playbook applies to all but order matters for downstream consumers
- **Letter Curator follow-on** — still parked

## Bruh Baker's parting note

Session 13 was a focused single-workstream sprint. One big architectural
shift — Excel → Supabase — landed end-to-end across the Workplan Goals
tab. The playbook KB note captures the shape so Phases 2-4 don't
re-discover it. The Activity↔Project model is the next architectural
mountain; the scoped plan is on the lessons doc waiting.

Whatever Sonnet (or Fortnight, or whoever) claims as a moniker — Sam
likes velocity but not at the cost of architectural cleanliness. Keep
the survey-before-scope, dry-run-before-apply, V1-V4-gate discipline.

— Bruh Baker, 2026-05-28
