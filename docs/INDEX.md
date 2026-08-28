---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-08-28
tags: [meta, index, obsidian-target]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/README]]"
---

# cpl-project-tracker — Docs Index

Landing page for the project's documentation surface, intended as the
**Obsidian vault entry-point** when browsing this repo from the vault-side clone
at `CPLBrain/COG-second-brain/cpl-project-tracker/`.

The per-lane catalogs below are **generated** by `kb/_build_docs_index.py` from
each doc's own frontmatter — rebuild rather than hand-append. The prose on this
page is hand-written and is preserved across rebuilds; only the block between
the `generated:corpus` markers is replaced.

> Previously this page listed every document inline and reached **273,616 B,
> 6.8× the 40,000 B index budget** — a landing page you must scroll is not a
> landing page. The catalogs are where the full listings live now.

## The three lanes

| Lane | What | Where |
|---|---|---|
| **KB notes** | Durable, distilled, reusable knowledge | [`docs/kb-notes/`](kb-notes/) |
| **Lessons (WIP)** | Workstream scratchpads, append-only | `docs/<workstream>_lessons.md` |
| **Session handoffs** | "Fattyfat" capsules for the next session | `docs/session_<N>_handoff.md` |

See [`docs/kb-notes/README.md`](kb-notes/README.md) for the lane contract.

## CLAUDE.md reference offloads (`docs/reference/`) — added 2026-07-10 (Session 111, the pare-down)

Always-current project memory moved out of `CLAUDE.md` (2,514 → ~590 lines);
**Rule 8 checkpoints update these files now**, and `CLAUDE.md` keeps read-before
stubs pointing here.

| Doc | Was | Read before |
|---|---|---|
| [Pipeline Reference](reference/pipeline_reference.md) | `CLAUDE.md` §Pipeline Reference (1,087 lines) | generator/workflow/tabs/Supabase/EACR/C-ID work |
| [KB Build Status](reference/kb_build_status.md) | `CLAUDE.md` §KB & Unified Courses (421 lines) | KB/CCR curation work, build-phase history |
| [M-ID Lifecycle & CID/CIDx](reference/mid_lifecycle.md) | `CLAUDE.md` §11 prose + strategic roadmap (449 lines) | re-mints, MC/TMC calls, auditor, pathway decisions |

---

## The catalogs

Every document in `docs/`, by lane. Rebuild with `python3 kb/_build_docs_index.py`
(`--check` fails when a rebuild would change anything, so CI catches a stale index).

<!-- generated:corpus -->
| Lane | Docs | Catalog |
|---|---:|---|
| Doctrine (behavior-shaping) | 4 | [`catalog/doctrine.md`](catalog/doctrine.md) |
| KB notes | 342 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 73 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 75 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Session handoffs | 180 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **674** | |
<!-- /generated:corpus -->

Not covered by a lane catalog:

- [`visuals/README.md`](visuals/README.md) — **Visuals**: decision briefs and
  mock-ups worth returning to, committed as HTML with a dated filename.
- [`catalog/`](catalog/) — the generated catalogs themselves.

## Top-level orientation docs

- [`../CLAUDE.md`](../CLAUDE.md) — project memory, Critical Rules, M-ID lifecycle (§11)
- [`co_platform_strategy.md`](co_platform_strategy.md) — **the long-term "plan of attack"** (Session 83): scaling COBI + the CPL KB into a governed, team-based, CO-wide platform — operating model, account migration off personal logins, knowledge lanes, real APIs vs scraping, governance/security/accessibility/HUMANS, decisions only humans make, pushback, and a scorecard against all ~14 asks
- [`roadmap_archive.md`](roadmap_archive.md) — museum annex to CLAUDE.md: completed roadmap rows + Session 26-31 narratives (moved out Session 33 to keep CLAUDE.md to live, steering content)
- [`../README.md`](../README.md) — first-time visitor entry
- [`../kb/README.md`](../kb/README.md) — knowledge-base schemas + generators

## Sierra integration docs (vendor-facing, added 2026-07-02)

Commissioned by Sam for integrating Sierra into a vendor-built platform:

- [`sierra_technical_reference.md`](sierra_technical_reference.md) — how
  Sierra is built: architecture, the full `cpl-chat` API contract (request /
  SSE protocol / errors), the six-lookup answer pipeline, behavior rules,
  data layer, client surfaces, security model, ops, v13→v26 timeline.
- [`sierra_integration_analysis.md`](sierra_integration_analysis.md) —
  benefits / risks / challenges of embedding Sierra on another site, the
  pre-launch preconditions checklist, and the decision points for Sam.
- [`sierra_integration_guide.md`](sierra_integration_guide.md) — the vendor
  implementation plan: link / iframe / native-API / server-proxy paths, a
  minimal reference client, non-negotiable client requirements, launch
  checklist, ongoing-operations expectations.
- [`sierra_iframe_implementation_guide.md`](sierra_iframe_implementation_guide.md)
  — the **day-one iframe recipe** (2026-07-03): the exact `?ctx=external`
  URL, annotated markup/CSP/sandbox, sizing, QA checklist (incl. the
  contacts-gate check), launch coordination, rollback.
- [`sierra_maturity_roadmap.md`](sierra_maturity_roadmap.md) — **Malone's
  scope-and-sequence to end-state** (2026-07-03): Phases 1–6 (guardrails →
  contract hardening → content maturity → integration graduation →
  recommender depth → platform ops), efforts, dependencies, the three
  human-only decisions, the critical path. The iframe is explicitly interim.
- [`sierra_vendor_lane_handoff.md`](sierra_vendor_lane_handoff.md) — the
  lane handoff (2026-07-03): what shipped (#654/#657 + v27 LIVE), locked
  decisions, verified access facts, the priority queue, safety rails.

## Reference materials

Authoritative external sources we've cached:
- [`reference/`](reference/) — ASCCC / COCI / CCN-CID source documents

## Update history
- **2026-08-28 (SkyLint, S204)** — this page is **generated** now (`kb/_build_docs_index.py`, `--check` in CI): 273,616 B → 20,757 B, per-lane listings moved to [`catalog/`](catalog/). Also 340 KB-note frontmatters canonicalized (`kb_note_dialect` 60 → 0, incl. 6 notes silently disagreeing about their own type) and the British-spelling sweep applied (`american_spelling` 174 → 1). #1373.
- **2026-08-28 (SkyLens, S202, refresh)** — the gate fix was half a fix: a local overlay survives sign-in and masks shared, so Sam's relabels never landed; plus the sign-in dropdown closing on any click. 3 more KB notes / memory rows.
- **2026-08-28 (SkyLens, S202)** — funding CR/NC lane switch merged (#1369); found a client gate stricter than its own RLS policy silently losing Sam's relabels; 2 KB notes; session-203 handoff.
- **2026-08-27 (SkyMatch, parallel to SkyPin)** — College CR evidence workstream: reusable matcher + LATTC worklist (PR #1365); two KB notes (a frequency is not a rule; one ranked list cannot answer two questions); §11 row added, SkyRule S196 narrative archived.
- **2026-08-27 (SkyPin, Session 199)** — the funding measure pin (`metric_src`) + the MILESTONE-agreement check (#1363); `ppa`/`ppa_u` after Sam's `Potential Student` correction, and the live Access metric fixed from $0-for-all-115 to 12 colleges earning (#1364). New KB note: *a defect that produces the value you expected is invisible*. Compacted the §11 funding cell (stacked_roadmap_cell) and archived `cpl_funding_lessons.md` 2026-08-01 → 08-06.
- **2026-08-27 (SkyVerdict S197)** — MAP's per-dataset verdict now read by the loader (#1358); `_effective()` + `scripts/funding_effective.js` so dials are asked of the model, not the config (#1359). Two KB notes. Two finished rows retired from `CLAUDE.md` §11 to `finished_workstreams.md`.
- **2026-08-25 (SkyFixer S193)** — a live session with Sam in a browser (#1330/#1331). ⭐ **The Memory ✎ chip could not write because its key named NOTHING** — `slug` is UNIQUE but NULLABLE and the display handle falls back to the uuid, so 6 of 572 rows took a PATCH that matched zero rows and the page blamed the team phrase. ⭐ Then the fixed chip turned out to be a **cycle that wrote every state it passed through** — his two clicks sit in `cpl_memory_log` 15s apart and left a `stale` row carrying a verification stamp; replaced with a menu, and the stamp is cleared whenever the status leaves `verified`. ⭐ **The magic link came back to the wrong screen for everyone** — nine modules stashed the return tab in `sessionStorage`, which is per browser tab, and the link opens a new one. ⭐ **SkyView search landed where the term never pointed** (`english as a second` → Interdisciplinary Studies); subject names now outrank course titles, plus typeahead, a real subject list, and the CCR tab opening on the map. ⭐ **GR "reanalysis" had no referent** — `blast_rank` is computed by nothing in the repo — so the analysis built is deterministic and defensible to the CO. ⚠️ **Five perturbations read as 0 FAIL because the suite CRASHED**. 3 KB notes; the flagged SkyView roadmap cell compacted to current truth; S190's narrative archived.
- **2026-08-25 (Sky190)** — Sierra's district figures came off a June snapshot with no writer; deleted the second copy rather than refreshing it. `cpl-chat` v58 deployed + byte-verified. Four closing-paren test assertions repaired. New KB note on stale second copies.
