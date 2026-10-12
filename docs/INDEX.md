---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-12
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
| KB notes | 542 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 86 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 81 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 55 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 344 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1113** | |
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
- 2026-10-12 S372 SkyRedwood: Miramar displayed (#2041), Mesa's row applied (#2037), Sierra v91 7c precedent (#2040), the painting gallery (#2038), the course outline census (#2042 draft, Sheet 70); KB note methodology-a-course-title-reads-as-its-level.
- **2026-10-12 (S371 SkyMaple)**: San Diego City displayed (#2034); College Identity UI pass (#2035); MAP Users sign-in wording (#2036); Mesa registry receipt (#2037, held) and the painting gallery (#2038, step 1); new KB note `methodology-same-context-size-means-the-model-varied`; handoff 372 (SkyRedwood).
- 2026-10-12 S370 SkyHolly: Long Beach City 38542 removed (Sheet 68 card 2, #2028); Chaffey read, loaded and displayed (#2027, build 496f2a71470a, 1,745 rows); San Diego City extracting; My College UI pass and the public contact measure (#2030); smoke 7s verb shape (#2031); Sierra 7c opening fix (#2032, A/B then deploy); handoff 371 (SkyMaple).
- 2026-10-12 S369 SkyLaurel: Long Beach City displayed (05811159eeee), the read policy live, curriQunet reader fixes for Chaffey and San Diego City, smoke 7s; handoff 370 (SkyHolly).
- 2026-10-12 (S368 SkyWillow): UI passes on Admin (#2019) and MAP Team Queue (#2020), each with a seeded sweep of the gated view; every program record public, each unchecked one marked Not yet confirmed (#2021, Sam's Sheet 67 card 1; the policy waits on his paste); Long Beach City's re-read filed (311 pass) and its load dispatched; Chaffey and San Diego City captured, both 0 (the curriQunet reader misses them); handoff 369.
- 2026-10-12 (S367 SkyAspen): CPL Pathways reads its catalog records from `program_requirement_records` (#2015) and its UI pass (#2016); Vision 2030 shows one set of goal figures in the tab and the annual report, TBA until set (#2017, Sheet 66 card 1); Long Beach City's re-read dispatched (run 38185403454); Sam's Sheet 65 card 2 sheet answer (every record, marked) differs from his chat answer and is asked on Open Asks Sheet 67; handoff 368.
- 2026-10-11 (S366 SkyHazel): UI passes on Governance (#2007; the shell placeholder left on the root, a Docs panel blank after a repaint, #2011 its load race) and Team Phrases (#2010); the three `sierra_feedback` readers filter CI rows on the server (#2008); Long Beach City's 74 reframed (#2009) and both causes fixed (#2012: the hidden index chose pages and text); Sam answered Sheet 65 card 2 in chat (read from the table); handoff 367.
- 2026-10-11 (S365 SkyRowan): UI passes on Vision 2030 (#2001; the actions now the CPL Workplan's words), Military Partnerships (#2004) and Noncredit & Learning Partners (#2005), and Team & RACI's two leftovers (#2003); Open Asks Sheet 65 (the Vision 2030 goal figures; which records CPL Pathways shows, measured at 18.2 MB and past the checked gate); KB note `methodology-a-published-file-carries-past-the-tables-read-gate`; handoff 366.
- 2026-10-11 (S364, second session): Long Beach City read, loaded and displayed, 305 of 379 (#1999; display build `344441813b01`, 1,515 rows); Program records builds on first open (#1993); Sam's retired-version ruling (#1995); the read job may run 360 minutes; handoff 365 and queue status corrected (#2000).
