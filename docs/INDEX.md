---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-21
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
| KB notes | 559 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 90 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 83 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 60 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 413 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1210** | |
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
- 2026-10-21 (S441 SkyIronbark, the CPL Queue routine): S440's harvest PR #2306 merged; the CLAUDE.md pass sent as Open Asks Sheet 109 (five cards, nothing applied); the two Python tests failing on main fixed.
- 2026-10-20 (S439 SkySaltbush, opened by Sam): the funding page prints JST counts and the 75% need, office hours and the MAP Dashboard chat as help, the landing page and its training video in the Contents, Funding Model Numbers; the introduction is always the published two-priority film, rebuilt from Scenario 3 with a new MP4 (#2296-#2298); S438's memory rows written; handoff 440 (SkyChaparral); no KB note.
- 2026-10-20 (side session beside S438, opened by Sam): the funding page asks for the view first (All Institutions / My Institution), then the college or district, and the Funding outcomes cards follow it (#2293); the funding lane and lessons compacted under budget; privacy UI pass clean; handoff 439 gains a section; no KB note.
- 2026-10-20 (S438 SkySumac, opened by Sam): the Annual Workplan Goals table without its Total column, centered, each row's details folded, gray borders only, links to the Activity cards (#2291, live after run 619); Grok steps given, the reader parked on the district card; handoff 439 (SkySaltbush); no KB note.
- 2026-10-20 (S437 SkySagebrush, opened by Sam): the CR Progress view (#2287), the C-ID site found and baselined (#2289), Open Asks Sheet 108 answered, the auto-mark rule drafted and waiting on Sam's word; handoff 438 (SkySumac); no KB note.
- 2026-10-20 (S436 SkyTanbark): the Exhibit Progress view (#2285), the Fact Sheet's UI pass, Open Asks Sheet 107; handoff 437 (SkySagebrush).
- 2026-10-20 (S434 SkyElderberry, the routine): Sierra's third UI pass, Copy, Helpful, Not helpful and the note's Send as underlined words (#2281); Sheet 105 still open; the strays wait on a curator's discipline calls; handoff 435; no KB note.
- 2026-10-20 (S433 SkyCoffeeberry, the routine): the two ENVR forestry pairs queued for a faculty reviewer as `surfaced` pairs (#2278); the CSR quarterly routine compares the handbook with the accepted 19th edition on a quarterly cron (#2279); the CSR lane compacted under its budget; Sheet 105 still open; handoff 434; no KB note.
- 2026-10-20 (S432 SkyYerbaSanta, the routine): Sheet 104 applied, ten forestry identities to ENVR and four wine to AGPR, each discipline following its code (#2276), re-keyed live and read back; the quarterly probe read a second time; Open Asks Sheet 105 asks about the two forestry stragglers (the permission check held their apply); handoff 433; no KB note.
