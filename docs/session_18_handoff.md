---
title: Session 18 Hand-off Prompt
date: 2026-05-29
session: 17 → 18 hand-off (Qualitastic / Q → next)
status: hand-off — paste the fenced block into Session 18's first message
tags: [handoff, session-prompt, excel-to-supabase, phase-3, budget, association-editor, xss]
related:
  - docs/session_17_handoff.md (Bruh Word → Q hand-off)
  - docs/excel_to_supabase_lessons.md (the Session 17 section is your scope sheet)
  - docs/kb-notes/methodology-xss-audit-on-curator-editable-fields.md (extended this session — read the #192 section)
  - docs/kb-notes/playbook-measure-first-supabase-migration.md (the 5-step template)
  - docs/kb-notes/methodology-parity-test-cutover-proof.md (the cutover proof)
  - CLAUDE.md §11 (Excel→Supabase roadmap; Phase 2 DONE, Phase 3 Budget read-path DONE)
moniker_suggestion: Bruh R (18th letter) / Octodec — open door to claim your own
---

# Session 18 Hand-off Prompt

A "fattyfat prompt" from Qualitastic / Q (Session 17) to the next session.
Paste the fenced block into Session 18's first message.

## Moniker suggestion

**Bruh R** — the 18th letter, clean and characterful. **Octodec** if you want the
number-name feel (18). Q went with **Qualitastic** — a quality/QA nod, because the
session was mostly review-and-harden (a sub-agent build, two hard reviews, an XSS
fix). The lineage is loose; Sam loves a good moniker + an open door — claim
whatever you'll carry.

## The prompt

```
You are Session 18. The Bruh lineage: Bruh → Prime → Quad → Hex → Hept →
Octaman → Nona → Sexy Dexy → Bruh El → Bruh Dec → Bruh Baker → Bruh Sonnet →
Bruh Parallax → Bruh Word → Qualitastic (Q) → you. Q suggests "Bruh R" (18th
letter) but the lineage is loose — claim what you'll carry.

Start by reading, in order:
  1. CLAUDE.md — especially §11. The Excel→Supabase roadmap is current.
     **Phase 1 (Workplan Goals) + Activity↔Project model + Phase 2 (Projects)
     are DONE. Phase 3 Budget READ-PATH cutover is DONE (#189).** Remaining:
     the Budget inline editor + Phases 4-5 (Vision 2030 / Personnel).
  2. docs/session_18_handoff.md — THIS doc.
  3. docs/excel_to_supabase_lessons.md — THE workstream notebook. Read the
     Session 17 (Qualitastic) section: 6 lessons + roadmap + next concrete step.
  4. docs/kb-notes/methodology-xss-audit-on-curator-editable-fields.md — read
     the 2026-05-29 / #192 section: the inline-JSON-in-<script> injection class
     needs a JSON-escape (_js_safe_json), NOT html.escape. Every new editor you
     build needs this audit (the hostile-input smoke test IS the review).
  5. docs/kb-notes/playbook-measure-first-supabase-migration.md — the 5-step
     template + step 4b (RLS tighten before exposing).
  6. docs/kb-notes/methodology-parity-test-cutover-proof.md — the byte-identical
     parity test that proves a cutover is behavior-preserving. Use it for every
     Phase 3-5 generator cutover.

═══ FIRST: confirm Session 17's work is live + clean ═══

#189 / #190 / #191 / #192 merged at Session-17 end, but the editor CSS +
Supabase-sourced cards + escaped output only go live on the **next daily regen**
(cron 10:17 UTC) or a manual workflow_dispatch of "Daily CPL Dashboard". So FIRST
confirm the daily run succeeded — fresh "Daily dashboard update — <date>" commit
on main — then eyeball the live site
(https://cpl-initiative.github.io/cpl-project-tracker/):
  - **Budget tab shows ~$89M** (NOT $0 — #189 fixed a live $0 bug).
  - **Project cards** show a "Contributes to: Activity N ★" chip line; a
    signed-in allowed-reviewer (map@rccd.edu) gets a click-to-edit popover on it
    (the #191 editor — 5 Activity checkboxes + a primary radio). The ★ should
    show on every card (the 27 default-primaries + the 7 orphan leads).
  - The Workplan Goals tab editor (the original #190 surface) STILL works — both
    surfaces share assoc_editor.js, so regressions there matter.
  - Activity-KPI cards render fine (no visible change from the #192 escape on
    today's benign data).
If anything's off, that's your first fix. If Sam wants it live now, he dispatches
the daily workflow (you can't trigger workflows).

═══ PRIORITY WORKSTREAM: finish Phase 3 — Budget ═══

#189 did the Budget READ-PATH cutover only (Supabase → snapshot fallback + "Data
as of" stamp; it was compressed because budget_expenditures already had rows).
Remaining:
  - **MEASURE FIRST.** Write/extend a kb/_validate_budget.py mirroring
    kb/_validate_projects.py — derive the real Excel→Supabase column map + diff
    the live budget_expenditures table against the Excel budget. Confirm whether
    the live rows are complete/correct or need a reconcile (seed) pass. The
    derivation UNIT follows what the Budget tab FEEDS — don't assume projects'
    shape.
  - **Budget inline editor** (PR-5-equivalent): mirror workplan_goals.js /
    projects_editor.js — shared cpl_sb magic-link auth, PATCH budget_expenditures,
    optimistic paint + rollback. RLS: tighten budget_expenditures to
    is_allowed_reviewer() FIRST (mirror kb/supabase_projects_rls_tighten.sql; via
    MCP apply_migration with Sam's go — §8 source-of-truth table). XSS-audit any
    newly-curator-editable field (hostile-input smoke test).
Lock any forks (date/number types, enums) with AskUserQuestion BEFORE shipping.

═══ Carryover / parked (priority order) ═══

  1. **Verify Session 17 live** (above) — gates confidence.
  2. **Finish Phase 3 Budget** (above) — the priority build.
  3. **Phases 4-5** — Vision 2030 / Personnel, same 5-step shape. Personnel
     already has 26 Supabase rows → its PR-3 has UPDATEs (only phase where V2
     source-exists fires on existing rows).
  4. **The association-editor-on-cards pattern is now reusable.** assoc_editor.js
     is the single popover impl; both the Workplan tab + Dashboard cards delegate
     to it. Any future per-card N-to-N association UI can reuse it.
  5. **Obsidian community plugins** — Sam enabled community plugins (uses none
     yet) + wants recommendations later (Dataview / Templater / Obsidian Git /
     Kanban candidates in docs/kb-notes/playbook-vault-sync-setup.md). Low
     priority; pick up when he raises it.
  6. **Older carryover:** the "Open in Excel" buttons + Excel KPI-ladder cols +
     D.* helpers retire together when the 3 JS report consumers
     (generate_reports.js, report_generator.js, college_report_generator.js)
     migrate off CPL_Data.js — a Phase 3+ bundle. Also: 1e-5d data-value rename
     (M-ID/C-ID → MID/CID in the id_system field); Letter Curator follow-on.

═══ Patterns Q found useful ═══

  - **An editor whose reach is tied to "what renders" silently orphans the rows
    that don't render.** The #190 editor only reached the 27 workplan-rendered
    projects; the 7 zero-ladder Activity-5 projects were orphaned in the N-to-N
    table AND un-editable. Fix was two-part: close the data orphans (Supabase
    link, leads PO-confirmed) + put the editor on a surface that renders ALL rows
    (#191, the Dashboard cards). When you add an editor, ask what subset it reaches.
  - **Share one widget across two surfaces with ONE delegated listener** — extract
    to a shared module, single document-level click handler (guarded so it installs
    once), both surfaces emit the same anchor markup. Two bindings = two popovers.
  - **The hostile-input test during a feature review surfaces ADJACENT pre-existing
    sinks.** #191's injection test found the akpi/CPL_DATA XSS (not #191's code).
    Flag out-of-scope in the PR body, keep the feature diff clean, fix in a focused
    follow-up (#192). The test pays off beyond the change under review.
  - **Inline JSON-in-<script> is its own XSS class — JSON-escape, not html.escape.**
    A name with </script> breaks out of an inline CPL_DATA blob; the fix neutralizes
    <,>,& → \uXXXX in the JSON (JSON.parse decodes back). See the xss kb-note.
  - **Generator-only is the right diff for a render-layer fix** (Rule 1) — the
    escaped output flows on the next regen; don't commit regenerated artifacts.
  - **Verify a suspected unicode bug functionally, not by eyeballing a Read** —
    U+2028/U+2029 render blank; a json.loads round-trip test settled a false alarm.
  - **Calibrate the merge gate to blast radius.** §8 schema migration → MCP +
    Sam's pre-auth. Public-appearance/editor → review + AskUserQuestion on forks →
    merge. Behavior-preserving security fix → merge on green.
  - **Sub-agent for the big build, but the review is the work** (carried from Bruh
    Word). #191's editor was sub-agent-built; the hard review (both surfaces +
    hostile-input + 3× idempotency) is where the merge was earned.
  - **Branch-per-PR off fresh origin/main; AskUserQuestion for forks, recommended
    option first.** Sam decides fast.

═══ Patterns to honor (non-negotiable) ═══

  - Rule 4: CPL_Dashboard.html and index.html stay byte-identical (the cron does
    the cp). Editor CSS belongs in EXHIBIT_ANALYSIS_CSS (Python) so the regen
    injects it into both — and BEFORE the end-marker (Rule 2 idempotency guard;
    #190 had to fix a CSS-accumulation regression there).
  - Rule 1: anything in a generator-replaced region (project cards, KPI cards,
    grid, chip lines) changes in the Python renderer, NOT the HTML. Static assets
    (assoc_editor.js, projects_editor.js, workplan_goals.js) are files + script
    tags — assoc_editor.js must load BEFORE its consumers.
  - Branch policy: claude/<short-description>; never push to main; auto-merge
    every PR you open once CI (TruffleHog) green + no unresolved reviews (squash,
    delete branch). CodeQL is push-only, not on PRs.
  - §8: schema/RLS on source-of-truth tables (projects, workplan_goals,
    workplan_activity_associations, budget_expenditures, personnel) need Sam
    sign-off. apply_migration MCP for one-shot DDL; workflow_dispatch for per-row
    PostgREST sweeps. SUPABASE_SERVICE_KEY is a repo secret (in workflows) but NOT
    in the session env — you can't run the apply scripts locally; synthetic-test
    them or parity-test via the committed snapshot. (For one-off data ops like the
    orphan linking, MCP execute_sql runs as service-role and bypasses RLS.)
  - Supabase project: hvuwhnbuahrtptokpqfh ("Work Plan"). The OTHER project
    mdxutmbpoqjtdcwjscux ("cpl-budget-support") is the KB/legislative DB — do NOT
    touch it.
  - Don't read/cat the big coci_*.json / unified_courses_*.js files.
  - openpyxl isn't in the session container by default — pip install openpyxl if
    you need to inspect the Excel locally.

═══ User style ═══

Sam (MAP@rccd.edu): CS-slang, warm, "Word"/"ack" is currency, never sycophantic.
Types fast — re-read a couple times. Loves a good moniker + an open door. Works
vault/Obsidian tasks in parallel with the code. Dispatches workflows + runs the
daily dashboard himself. Drives merges interactively ("yes, merge!") but also
trusts the auto-merge gate. Signals session end warmly ("Feeling good about this
run!" / "Thanks a million" / asks for the checkpoint).

Good luck, Eighteen. Q shipped a Budget cutover, the full association-editor arc
(#190 popover + is_primary + #191 on all 34 cards), the 7-orphan close-out, and an
XSS follow-up — five PRs + a migration + a batch of Supabase data ops, all merged
clean. Phase 2 done; Phase 3 Budget read-path done; finish the Budget editor, then
Vision/Personnel. Carry it forward. 🅰️🆀
```

## How to use this file

When opening Session 18:
1. Copy the fenced block above.
2. Paste it as the first message in Session 18.
3. The session reads CLAUDE.md (auto-loaded) + the docs listed, confirms Session 17
   is live + clean, then finishes Phase 3 (Budget editor).

## What Session 17 shipped (recap table)

| PR | What |
|---|---|
| #188 | Session 16 → 17 hand-off doc |
| #189 | Phase 3 Budget read-path cutover — fixes live $0 → ~$89M bug |
| #190 | Activity↔Project association editor + `is_primary` migration + CSS-accumulation fix |
| — | 7-orphan close-out (5.2–5.8 linked) + 27 default-primary backfill (Supabase data ops; 0 orphans) |
| #191 | Association editor surfaced on all 34 Dashboard project cards (shared `assoc_editor.js`, −441 lines from workplan_goals.js) |
| #192 | akpi / CPL_DATA stored-XSS hardening (`_js_safe_json` + html escapes) |
| — | This Rule 8 checkpoint (docs) |

**KB notes this session:** no NEW note (the XSS work extended the existing
`methodology-xss-audit-on-curator-editable-fields.md` with the inline-JSON-in-
`<script>` injection class — third confirming instance).

## What Session 17 did NOT decide (Session 18's call)

- **Budget completeness** — #189 cut over the READ path only. Whether
  budget_expenditures needs a validate/reconcile (seed) pass, and the Budget
  inline editor, are open. Measure first.
- **Phases 4-5** (Vision 2030 / Personnel) — not started.
- **When to retire the Excel ladder cols / "Open in Excel" / D.* helpers** —
  bundled with the JS-consumer migration (Phase 3+).

## Qualitastic's parting note

A review-heavy, quality-focused run (hence the moniker): the headline builds were
the association-editor arc and the orphan close-out, but the value was in the
discipline around them — confirming the orphan leads with the product owner before
writing data, hard-reviewing a sub-agent's refactor on BOTH surfaces, and turning
an adjacent finding from one review into a clean focused follow-up rather than
scope-creeping the feature PR. The one scar worth carrying: a feature review's
hostile-input test will find sinks the feature didn't introduce — that's a gift,
not a distraction; flag it, fix it separately. Phase 3's read path is done; finish
the Budget editor, then Vision/Personnel.

— Qualitastic (Q), 2026-05-29
