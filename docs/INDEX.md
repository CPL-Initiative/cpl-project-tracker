---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-11-18
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
**Rule 9 checkpoints update these files now**, and `CLAUDE.md` keeps read-before
stubs pointing here.

| Doc | Was | Read before |
|---|---|---|
| [Pipeline Reference](reference/pipeline_reference.md) | `CLAUDE.md` §Pipeline Reference (1,087 lines) | generator/workflow/tabs/Supabase/EACR/C-ID work |
| [KB Build Status](reference/kb_build_status.md) | `CLAUDE.md` §KB & Unified Courses (421 lines) | KB/CCR curation work, build-phase history |
| [M-ID Lifecycle & CID/CIDx](reference/mid_lifecycle.md) | `CLAUDE.md` §11 prose + strategic roadmap (449 lines) | re-mints, MC/TMC calls, auditor, pathway decisions |
| [Branch policy](reference/branch_policy.md) | `CLAUDE.md` §Branch policy evidence (2026-08-28) | why a merge rule says what it says |
| [Engineering & UI practices](reference/engineering_ui_practices.md) | `CLAUDE.md` §Engineering & UI evidence (2026-08-28) | a UI rework, a First Light artifact, a table layout |
| [Design principles (v3)](reference/design-principles.md) | `CLAUDE.md` §Presentation rules, issue #3107 (2026-11-14) | building or mocking any view: the job first, tool or view, ship checks |
| [Sam's rulings](reference/sam_rulings.md) | issue #3055 item 2 (2026-11-14) | before asking Sam something he may already have ruled: his words, dated, with a link to each rule; a row with a Replaced-by entry no longer stands |
| [Obsidian vault wiring](reference/obsidian_vault_wiring.md) | `CLAUDE.md` §Obsidian vault wiring (2026-08-28) | vault-sync, exclusion, the sparse-checkout fix |
| [**`reference/lanes/` — one file per §11 roadmap lane**](catalog/reference.md) | `CLAUDE.md` §11 roadmap cells, 88 KB (2026-08-28) | **working any lane — and REFRESHING it at checkpoint** |

⚠️ **The lane files are the usual checkpoint edit now.** §11's table is a
pointer index: it carries each lane's state, and the lane file carries what you
learned. A checkpoint that updates only the row leaves 30 files to go stale.

---

## The catalogs

Every document in `docs/`, by lane. Rebuild with `python3 kb/_build_docs_index.py`
(`--check` fails when a rebuild would change anything, so CI catches a stale index).

<!-- generated:corpus -->
| Lane | Docs | Catalog |
|---|---:|---|
| Doctrine (behavior-shaping) | 6 | [`catalog/doctrine.md`](catalog/doctrine.md) |
| KB notes | 590 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 95 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 105 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 76 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 639 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1511** | |
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
- 2026-11-18 (S679 SkyKinglet, Sam's session, full checkpoint): #3477 (the left-map apply nightly, Rename and Combine, the combine guard as one choke point), #3478 and #3481 (Sam's three Nov 17 harvest rulings, 243 records rescored live), #3479 (slash-to-and, 80 renames applied by run 44227947795), #3468 (ACE text kept), #3467, #3473, #3474, #3475; four lanes compacted under 20,000 bytes; KB note `methodology-a-guard-must-fail-closed-when-it-cannot-decide`; handoff 680.
- 2026-11-17 (S678 SkyWaxwing, Sam's session, full checkpoint): #3465 (College Data Collection's cost and counts: measured runner and session spend, the Commons spent figure, a daily census at 17:47 UTC, ETA dates that name their days, cost per CRE), #3466 (Exhibits: act on titles that have left MAP from their row), #3469 (CPL Pathways: a course met by its Program Course File id is no catalog addition), #3470 (Commons Clarity units findings); drafts #3467, #3468, #3472, #3473, #3474. KB note `methodology-a-dispatch-only-feed-goes-stale-without-a-sound`. Handoff 679.
- 2026-11-17 (S677 SkyTanager, full checkpoint): #3462 (Chaffey's yield read: reread 13 rows, load kept 191, display build cdd185495ce4; its suspect yield resolved as not found; slice B complete at seven colleges); the self-test miss named, Skyline 38299. Handoff 678.
- 2026-11-17 (S676 SkyPipit, the CPL Queue routine, full checkpoint): #3456 (slice B: six yield colleges read, reread and loaded, display build 71b67268c567, passing +22); the harvest lessons doc compacted to archive 6. Handoff 677.
- 2026-11-17 (S672 SkyWren, the CPL Queue routine, full checkpoint): #3441 (RCCD music: the repeated-course-row reconcile steps; Riverside City 229 to 232 passing, Norco's required list counted twice). Handoff 673.
- 2026-11-17 (S670 SkyBunting, Sam's session, full checkpoint): #3420 (Coastline's objectives loaded, 522 rows; a course outcomes slice keyed by its colleges), #3423 (Skyline's yield read after display build b640e31b114a), #3436 (Skyline 32337's live row removed, full image filed), #3433 and #3434 (Rio Hondo and Santa Ana from their own 2025-2026 catalogs), #3435 (S668's Berkeley City row); five `cpl_memory` rows through the runner; handoff 671 for SkyKinglet.
- 2026-11-16 (S668 SkyPipit, Sam's session, full checkpoint): #3408 (the no-closed-list lookup's page yield: 13 yields at 8 colleges, 0 passing moved), #3411 (Gavilan Mathematics 31444 and Physics 33047 from their 2025-2026 catalog); #3414 (slice B part 1) waits on `test`; eight `cpl_memory` rows drafted as a migration; the harvest lane compacted; handoff 670 (S669 ran in parallel).
- 2026-11-16 (S667 SkyPlover, Sam's session, full checkpoint): #3402 (CPL Pathways: Request Adopt on course cards, Ask Sierra's side bar, an SLOs and objectives panel, full width, the CPL Visual's progress bar), #3403 (`kb/plain_words.py`, one term list; the six re-clustering cases settled), samueltlee/CPLBrain#806 (sheets refuse undefined insider terms from 201), #3404 (harvest and governance decisions; seven memory rows through the runner). Handoff 668 (SkyPipit).
