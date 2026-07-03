---
title: Session 98 handoff — after BigSky (Activities optimization + reports consolidation)
created: 2026-07-03
tags: [handoff, session-98, reports, activities, naming, team-phrase, cobi]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_lessons]]"
  - "[[docs/team_phrase_expansion_plan]]"
---

# You are Session 98

You inherit from **Session 97 (BigSky, 2026-07-03)** — the Activities-tab
optimization + reports-consolidation session. Read in this order if you're cold:

1. `CLAUDE.md` — Critical Rules + the NEW **Naming & terminology** section + §7
   (Custom Report) + §11 Session 97 narrative
2. `docs/cobi_lessons.md` — the S97 section (full story)
3. `docs/team_phrase_expansion_plan.md` — the auth plan awaiting Sam's ratify
4. `kb/cpl_todos.json` — the live For-Sam / For-Fable queue
5. This file

## What Session 97 shipped (one code-only PR)

- **Custom Report modal**: Report-Type toggle (⚡ narrative / 📋 Master — the
  Master Report filter-bar button is RETIRED, its builder drives off this
  modal's selection), per-audience document titles (the "everything says
  Legislative Report" fix), the **Elevation slider** (0→30,000 ft →
  `ELEVATION_BANDS` → Altitude prompt block + structure swap >20k ft), a
  staged **progress bar** (no more "Generating..."), `NAMING_RULE` in the
  prompt, models de-pinned to `claude-sonnet-4-5`.
- **Slim actions bar** at the TOP of the Activities pane: Lead + Search +
  Element Map (+ the Custom Report button report_generator.js appends).
  Retired: Activity/Vision/Goal/Status selects, Apply/Reset, bar-level Attach
  Doc. The `<!-- Filter Bar -->` comment STAYED PUT as the generator's
  Activity-Metrics anchor — do not move or dedup it. The generator's Lead
  dropdown regex now full-replaces every run (was frozen-forever).
- **Sidebar groups** (`nav_groups.js`): 5 collapsible groups + Share,
  runtime-wrapped (regen-proof, tabs.js untouched, unlisted tabs stay
  top-level). Label renamed **Activities**.
- **Where To** resets after each jump.
- **MAP naming locked**: CPL Initiative / Mapping Articulated Pathways (MAP)
  platform / "Military Articulation Platform" = history-only; never "MAP
  Initiative". In report prompts, docx footers, `sierra_guidance` row
  `cb226a48`, tracker CLAUDE.md terminology section, and a **draft PR on the
  KB repo** (curation-gated — Sam merges).
- **Tests**: +`report_session97` (26) +`nav_groups` (12) +`actions_bar_slim`
  (15); `attach_explainer`/`master_report` re-pinned to the retirements.
  Suite 132 files green. Regen verified 2× (anchors hold, idempotent).

## Priority queue for you

1. **Native attachments — STILL THE DECIDED HEADLINE BUILD** (carried from
   Session 97's inheritance; BigSky spent the session on Sam's laundry list
   instead). TEAM-ONLY Supabase Storage + `project_attachments` metadata
   table; full spec in `docs/session_97_handoff.md` §1 — it remains accurate.
   Attach explainer + SharePoint handoff stay until it lands.
2. **Team-phrase Phase 1 — ✅ DONE (same session, Sam: "Go phase 1").**
   Migrations `team_phrase_widen_p1` + `_associations` applied; shared
   `team_phrase.js` wired into workplan_goals/budget_editor/assoc_editor/
   tmc_builder (notes only); `kpi_order` was never built — dropped.
   **Phase 2 remains** (kb_curation + the `team:<name>` attribution stamp) —
   its own PR when Sam wants it; plan doc has the spec.
3. **Fact-sheet naming** — the public fact-sheet's baked text still says "MAP
   Initiative" in 4 places (footer, contact box, resources). DON'T edit the
   baked HTML casually: Curate override keys derive from box text
   (`methodology-stable-dom-keys-exclude-live-text.md`) — an edit can orphan
   live overrides. Either Sam edits via ✎ Curate (safe), or you first check
   `factsheet_overrides` for rows keyed to those boxes and migrate keys.
4. **Standing lanes** (unchanged): Sierra guidance day-2 + Malone guardrails
   intro, TMC confidence engine round 2, `chatbox_exhibits` dedupe/refresh,
   the unverified-M-ID renumber re-mint.

## Patterns that worked (keep them)

- **Move the div, not the anchor.** The filter bar relocated to the pane top
  while the generator's `<!-- Filter Bar -->` comment stayed put — zero
  anchor surgery, verified by two full regens. When a static block must move,
  check first whether the generator anchors on the block or on a comment.
- **Runtime-wrap over template surgery** (again): nav grouping shipped as a
  static JS layer (kpi_cards.js pattern) — regen-proof, future-tab-proof.
- **Fix the naming at the layer that writes.** The bad expansion came from
  the MODEL's prior, not our data — so the durable fix is a prompt rule (+ a
  sierra_guidance row for the chat surfaces), not a grep of the repo.
- **Measure the "stale data" complaint**: it surfaced the frozen Lead-options
  regex — a real bug hiding behind a UI gripe.

## Safety patterns to honor

- Never edit regenerated sections by hand (Rule 1); the slim bar is STATIC
  template — the metrics/grid around it are NOT.
- `sierra_guidance` steers the production widget too — deactivate rows, never
  delete; write-gate is the security boundary.
- KB repo changes go through the curation pipeline (draft PR, Sam merges) —
  never auto-merge there.
- Keep `reports/CPL_Master_Report.docx` in the daily workflow — it's the
  modal's fallback link.

## Moniker

Session 97 went by **BigSky** (Sam's christening). Claim your own —
suggestion: **StarBinder** if you finally build the native attachments
(binding docs to cards), but the door's open.
