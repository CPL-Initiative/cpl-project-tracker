---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-27
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
| KB notes | 564 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 91 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 94 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 62 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 464 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1280** | |
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
- 2026-10-27 (S493 SkyThimbleberry): the MAP link with each exhibit's builder on the CPL Opportunity visual, EACR, CPL Pathways, My College and CER (#2485, #2488); the public funding page's Step 2 fixed for the Summit (#2487); Open Asks Sheet 134 answered; handoff 494.
- 2026-10-26 (S492 SkyCloudberry): the public funding page's header and WCAG 2.2 AA pass for the CPL Summit; KB note `methodology-geometry-is-half-an-accessibility-audit`; handoff 493.
- 2026-10-26 S491 SkySalmonberry: wording help for Sierra's instructions (Check wording #2474, Suggest wording and the built-in naming rule #2475, deployed), four live instructions corrected, Open Asks Sheet 132 answered; funding attestation form drafted (#2476); full checkpoint, handoff 492.
- 2026-10-26 S490 SkyGooseberry: the Library's Regenerate and documents on a record, the MAP team's notes on a college page, the CPL Opportunity page under `library/`, Open Asks Sheet 131 answered (#2472); full checkpoint, handoff 491.
- 2026-10-26 S488 SkyThimbleberry: Hartnell's last eight failing tabs read (light checkpoint); handoff 489.
- 2026-10-26 S487 SkyHuckleberry (the CPL Queue routine): Hartnell's pooled subject lists; a `pool_lists` reconcile step, General Studies 17912 passes, Hartnell 80 of 94 (#2463); full checkpoint, handoff 488.
- 2026-10-26 S486 SkyQuince (the CPL Queue routine): Hartnell's double-count words read as the overlap; three local degrees pass, the carry basis leaves the flag out (#2462); handoff 487.
- 2026-10-26 S485 SkyElderberry (the CPL Queue routine): Hartnell's last three noncredit courses carry no hours in its data; why six of its degrees fail arithmetic, read from their tabs (#2461); light checkpoint, handoff 486.
- 2026-10-26 S483 SkyCoyoteMint (opened by hand): DSP Credit Starting Points Version 2 on the agency template, a draft beside v1 (CPLBrain#487, receipt applied); Open Asks Sheet 129 and the series record caught up to it; the library lane back under budget (#2458); full checkpoint, handoff 484.
- 2026-10-26 S482 SkyShootingStar (opened by hand): ELL IET Version 2 with example articulations (CPLBrain#485, receipt applied); the Summit film v3 and the funding film v11 (#2457); Open Asks Sheet 128; the house-voice note gains *Lead with what is possible*; full checkpoint, handoff 483.
- 2026-10-26 S480 SkyChia (opened by hand): the funding tab's NC labels, outcome chips and Serves on P3 and P4 (#2453); the Library's Changes to make and Copy the request, the Coordinator Guide In development (#2452); Coordinator Guide Draft 1 (CPLBrain#482); full checkpoint, handoff 481.
