---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-04
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
| Doctrine (behavior-shaping) | 5 | [`catalog/doctrine.md`](catalog/doctrine.md) |
| KB notes | 518 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 82 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 81 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 53 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 300 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1039** | |
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
- **2026-10-04 (S328 SkyLadder):** #1854 deployed; sheets 33-34 answered and in their lanes (#1855); the statement of who CPL serves and `kb/non_ccc_institutions.json` (#1856); the Cerritos Ironworker ladder on CPL Pathways (#1857); handoff 329.
- 2026-10-04 (S327 SkyAmend): KB note `methodology-one-build-two-readers`; handoff 328; the ROEP display build (`kb/_build_roep_display.py`): CPL in three kinds per course, the up-to figure, gaps and map status, written once to `cpl_pathways_roep_data.js` and `program_requirement_records.display` (20 rows live); Sierra wired to it with smoke 7r (#1854); open-asks sheet 33 (CSU LA, outcomes, the Ironworker proof).
- 2026-10-04 (S326 SkyAddendum): KB note `playbook-ship-a-table-before-its-privilege-close`; handoff 327; sheet 29 carried out (#1850): six catalog addresses entered, `program_source_addenda` live with the census writing it, sequence access recorded on 25 colleges' registry rows and the reader taught to skip a refused host; Sierra's catalog requirements for checked records (#1851, `program_requirement_records`, 20 checked); open-asks sheets 30 and 31.
- 2026-10-04 (S325 SkyReader): KB note `methodology-probe-the-class-before-calling-a-refusal-local`; handoff 326; the sequence pass meets the Program Mapper's 403 at all 17 hosts it reached (#1847); the census records catalog addenda, 78 at 52 colleges, with a proposed addenda table (#1848); open-asks sheet 29; every sheet named in chat carries its link; the Program Requirements tab mock-up with an Ask Sierra link.
- 2026-10-04 (S324 SkyGrader): KB note `methodology-a-not-applicable-score-must-be-confirmed-by-the-source`; handoff 325; the program requirements pilot's record shape version 2 (hours, option groups, block totals, unit ranges; Edge Function v2) and Miramar read through its curriQunet exports: 20 of 20 programs captured and 20 of 20 records pass the three automatic bars (#1845); the pilot records review sheet for Sam.
- 2026-10-03 (S322 SkyPilot): KB note `methodology-a-failed-read-is-not-an-empty-result` gains the census case; handoff 323; the census reads a vendor catalog's own edition banner, puts the newer year first on one host, and keeps a known address after a failed read (#1841: 77 → 95 catalog years, 71 → 91 at 2026-27); open-asks sheet 25; West Los Angeles is the pilot's PDF college.
- 2026-10-03 (S321 SkyCatalog): KB note `methodology-a-reader-fix-moves-rows-it-was-not-aimed-at`; handoff 322; the census's reader corrected over four full reads (#1839: 109 → 112 catalog addresses, 67 → 78 years, no college worse off); the registry's first apply on `main`; open-asks sheet 24 (two memory receipts, six catalog addresses).
- 2026-10-03 (S320 SkyCensus): the program-source census and its registry (#1836, Phase 0 of the harvest): `program_source_registry` live with 118 rows, a history table and one write path, weekly apply; the vendor-link hop and four-slice read (#1838; first full read: 109 of 118 catalogs found); new lessons doc `program_requirements_harvest_lessons`; the revoke KB note gained a tables section (TRUNCATE); handoff 321.
- 2026-10-03 (S319 SkyRudder): KB note `methodology-write-the-rule-as-the-sentence-you-want-said`; handoff 320; Sierra's program course lists deployed (#1832, smoke 7l), 7s's articulation set-aside (#1833), the timing log (#1834); new lane `program-requirements-harvest` with its plan doc; sheet 23.
