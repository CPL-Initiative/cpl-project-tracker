---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-15
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
| Workstream docs | 82 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 56 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 367 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1149** | |
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
- 2026-10-15 (S395 SkyHawthorn): wave 2's procedure records and their generator (#2146); staff email off the public dashboard (#2147); Santa Ana's colon titles in the curriQunet reader (#2148); the catalog sweep's wave 3, ten colleges, 1,132 records (#2149); handoff 396.
- 2026-10-15 (S394 SkyMadrone): extraction v10 (#2141); UI pass GR Priorities (#2142); the catalog sweep, waves 1 and 2, eight colleges (#2143, #2144) with the NOCCCD campus-letter and curriQunet cap fixes; procedure records v1 for wave 1; lessons archive 2; handoff 395 (SkyHawthorn).
- 2026-10-15 (S393 SkySycamore): Sheet 82 carried out (#2136); extraction v9 (#2138; v8 failed every call); Cerritos's reconcile steps (#2139); the overnight schedule and the $40 go (#2134); Open Asks Sheet 83; handoff 394.
- 2026-10-14 (the funding session beside S392): a noncredit-portion setting, the explainer's three funding boxes on one row with the credit and noncredit split and editable words, Bold and Italic in the passage editor (#2132, live 22:36Z); KB note methodology-a-share-target-inside-a-bounded-allocation-is-a-solved-weight; a section in handoff 393.
- 2026-10-14 (S392 SkyTamarack): Sheet 81 carried out (#2127); the summary-row highlight (#2128); record shape 6 and the Major only gap (#2129); El Camino and San Joaquin Delta (#2131); the reconcile pass (#2130); Sheet 82; handoff 393 (SkySycamore).
- 2026-10-14 (S391 SkyJuniper): handoff 392; Sheets 80 and 81; San Joaquin Delta's catalog year (#2125); the Program Requirements UI pass (#2124).
- **2026-10-14 (S390 SkySaguaro):** Southwestern merged with its procedure record (#2115); Fresno City loaded, displayed (build `04872c826890`) and its procedure record (#2120); the SLO links on Program records and COCI Lookup (#2116); the tabled line's email fixed at the generator (#2117); CIP Codes UI pass (#2118); the Acalog reader merged with San Joaquin Delta's capture (#2112); the Records view's District, College, SWP Region and CIP Sector dropdowns, Progress first, no Sierra (#2121); handoff 391 (SkyJuniper).
- **2026-10-14 (S389 SkyPersimmon):** record shape 5, the degree total a page prints (#2110, Sam's Sheet 78 card 2); the re-read path (#2111); Palo Verde's 19 (#2114) and Cabrillo's 55 re-read and replaced, Southwestern loaded and displayed (#2115); an Acalog reader, El Camino captured (#2112); COCI Lookup UI pass (#2113); Open Asks Sheet 79; lessons doc compacted (S353-S359 to the archive); handoff 390 (SkySaguaro).
