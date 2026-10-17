---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-17
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
| KB notes | 552 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 87 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 83 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 56 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 379 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1162** | |
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
- 2026-10-17 (S406 SkyIronwood, hand-opened): a hand-filed catalog is read from the copy a person posted, its hash pinned on the first fetch (#2199); the eight refused colleges loaded unchecked from Sam's copies (1,427 records, $131.00, build `fec9782a4dbc`, 13,851 programs at 100 colleges); Open Asks Sheet 90; MAP Export's UI pass (#2200); harvest lane compacted under its budget.
- 2026-10-17 (S405 SkyCholla, the 12:12Z firing): own-HTML reads keep to the catalog's year (`year_scope()`); Coalinga, Skyline, West Valley, Copper Mountain, San Diego Continuing Education and Solano loaded unchecked; the scorer reads stand-in ligature glyphs (Solano, Santa Rosa reread); the hand-filed catalog step; display build `c111c9b05ca0` (12,424 programs, 92 colleges); Open Asks Sheet 89; handoff 406 (SkyIronwood).
- 2026-10-17 (S404 SkyBuckeye, the 10:12Z firing): own-HTML catalogs take the generic sitemap road (#2194); College of San Mateo loaded 55 unchecked (60 of 64 found, $4.98, build `928577b30f0f`); Los Rios's hosts still serve the reader 404; the MAP Data Quality UI pass (#2193); handoff 405 (SkyCholla).
- 2026-10-17 (S403 SkyYarrow, the 08:12Z firing): two firings had both run as S403 and written a PDF reader each; one reader from the two (#2192, build `726bde512dfa`, 11,862 programs, East LA's 120 included); LA City and Pierce rescored free (outcomes failures 145 to 12 and 85 to 15); a reconcile now refuses a moved page, and the 49-row undo waits on Open Asks Sheet 88; harvest lessons S372-S385 moved to archive 2.
- 2026-10-17 (S403 SkyYarrow, the CPL Queue routine): a whole-catalog PDF reader and the PDF wave, fifteen colleges loaded unchecked (1,725 records, #2189, build `7f4744e8e4ae`, 11,742 programs); Cerro Coso's robots.txt refuses its catalog PDF; the outcomes check fails on PDF text (open); handoff 404 (SkyBuckeye).
- 2026-10-17 (S402 SkyToyon, Sam's session): two catalog-sweep waves, Lake Tahoe, Marin, Butte and Las Positas (#2186, build `40d138a9f533` applied), then Los Medanos and Mission (#2187, build `7c13e42917c5`); the eLumen reader takes catalog links written whole with a fragment (Los Medanos 7 to 83 of 97); the college workflow refuses a run naming no college; ten procedure records; Open Asks Sheet 87 asks to correct five registry rows; handoff 403 names SkyYarrow.
- 2026-10-17 (S401 SkyManzanita, Sam's session): five catalog-reader faults read from the hosts' own outlines (#2177 curriQunet retry, #2178 Butte's two title forms, #2179 and #2183 the eLumen menu walk, #2182 Las Positas's comma); the eLumen wave, six colleges loaded, build `d4ac5009f5aa` applied (#2181); Lake Tahoe and Marin extracted; handoff 402 names SkyToyon.
- 2026-10-16 (S400 SkyBirch, Sam's session): My College's Sierra in Sierra AI's format on Sam's ask (#2171); the program search's no-match path fixed after the smoke's 7l timeout (#2173, applied, 2,742 to 204 ms); wave 5's second half loaded, build `9237d2cbf931` applied (#2170); nine procedure records (#2172, #2174); Butte parked for its reader; handoff 401 names SkyManzanita.
