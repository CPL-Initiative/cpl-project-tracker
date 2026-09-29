---
title: COBI Memory tab + MAP Data Quality — lane handoff
date: 2026-07-26
tags: [handoff, memory, data-quality, sky10men]
related:
  - "[[docs/cobi_memory_tab_lessons]]"
  - "[[docs/kb-notes/adr-unified-memory-table]]"
  - "[[docs/kb-notes/methodology-team-curated-table-needs-update-rls]]"
---

# You are the next session on the COBI Memory / Data-Quality lane.

Sam (MAP@rccd.edu) runs the **CPL Initiative**. This is a **side-lane** (like
SkyKnow before it) — the memory tab, the new data-quality register, and internal
tooling. **Leave the CCR mainline's numbered `session_<N>_handoff.md` + `kb/cpl_todos.json`
untouched** — they belong to the mainline. Sky10Men (2026-07-26) shipped four merged PRs.

Claim a moniker (Sky… / Star… family, or coin your own).

## Read first, in order
1. **This file.**
2. **`docs/cobi_memory_tab_lessons.md`** — the full 2026-07-26 story.
3. **`docs/kb-notes/adr-unified-memory-table.md`** — the memory design (+ amendments 1/2:
   the reader `plain`/`title` columns + ✨ Autogenerate).
4. **`docs/kb-notes/methodology-team-curated-table-needs-update-rls.md`** — the `p8` RLS
   lesson; honor it on every team-curated table.
5. **`docs/kb-notes/playbook-cpl-memory-auto-write-at-checkpoint.md`** — write the memory at checkpoints.

## What shipped (all merged to main)
- **#894 / #895** — 🧠 Memory 📄 Report → non-techie **prose**, per-section lead-ins,
  short **`title`** per item, reader **`plain`** column (both optional, Report prefers them,
  falls back to summary); **✨ Autogenerate** on Add + Edit (drafts fields from a topic via
  the cpl-chat RAG function, prefill-only). Bug fixed: form fields via `querySelector`, never
  `form.title` (HTMLFormElement.title collision).
- **#896** — Memory **curate lockout fixed**: `cpl_memory` UPDATE RLS widened to
  `reviewer OR team` (was reviewer-only → the RLS zero-row lockout). Server-side, live.
- **#897** — **🩺 MAP Data Quality register**: Supabase `map_data_quality` + `map_data_quality.js`
  (Reference & Curation group), team-gated, cards + filters + Advance-status + "Copy for MAP
  devs" export. Seeded with Sam's 4 issues. RLS carries `p8` from the start.
- **#898** — **License** replaced (vestigial MIT © 2019 Zachary Rice → CCCCO all-rights-reserved).

## Priority workstream — register enhancements (memory `w3`/`w4`)
1. **`w3` — auto-generate findings.** Have `excel_to_dashboard.py` scan
   `View_StudentAggregatedValues` each run and upsert findings (counts + example IDs) into
   `map_data_quality` — idempotent (ON CONFLICT on a stable key) so re-runs verify fixes.
   Detectors to start: blank required fields per college (Chaffey), Potential=Yes missing
   CPL Mode/Type, anomalously-high USMC eligible credits (see `f8`/`o3`).
2. **`w4` — follow-up nudge.** Flag `map_data_quality` rows whose `followup_on` has passed
   (and open items not yet reported) on the 🩺 tab.

## Carryover / advice given, not built
- **Priority 1: Eligible → Applied.** `TotalAppliedCreditsForCR` is already in the MAP
  dataset → feasible without a MAP change. Prototype behind a basis toggle (like the
  Potential⇄Earned toggle). Keep Eligible as the ceiling KPI; note `TotalTranscribedCreditsForCR`
  as the further outcome metric. It also neutralizes the USMC inflation (`f8`).
- **MAP data-quality strategy** = the register is the tool; feed the MAP dev team the
  evidence export; re-run to verify fixes.
- **Repo privacy / appropriation.** Private repo ≠ private data if Pages stays public.
  Levers: license (done), privatize (needs Pro/Team for public Pages), or **split repo**
  (public rendered site + private engine). KB stays CC BY 4.0. Start with a **public-exposure
  audit** when Sam gives the word.

## Safety patterns to honor
- **Rule 9c** — Supabase only via the MCP tools (sandbox can't reach `*.supabase.co`).
- **`p8`** — team_pass_ok() on SELECT+INSERT+**UPDATE** for any team-curated table.
- **Rule 4** — `CPL_Dashboard.html` ≡ `index.html` (nav button/pane/boot mirrored; verified byte-identical).
- Prefer injecting tab CSS from the tab's JS (one file, no Rule-4 mirror).
- Commit a jsdom test for every consumer-JS change (`tests/*.test.js`, `npm test`).
- Merge-on-green (`clean` OR `unstable`); auto-merge refuses while a required check runs → poll + squash.
- Memory writes land `proposed` until corroborated; Sam's ✓ / a committed PR promotes to `verified`.

## §11 debt to flag
The CLAUDE.md §11 side-lane narrative list has grown well past the "≤2 inline" budget —
a mainline checkpoint should archive the older side-lane blocks verbatim to
`docs/roadmap_archive.md`.
