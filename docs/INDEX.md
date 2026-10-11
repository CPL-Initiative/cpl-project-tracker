---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-11
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
| KB notes | 540 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 86 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 81 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 55 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 338 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1105** | |
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
- 2026-10-11 (S366 SkyHazel): UI passes on Governance (#2007; the shell placeholder left on the root, a Docs panel blank after a repaint, #2011 its load race) and Team Phrases (#2010); the three `sierra_feedback` readers filter CI rows on the server (#2008); Long Beach City's 74 reframed (#2009) and both causes fixed (#2012: the hidden index chose pages and text); Sam answered Sheet 65 card 2 in chat (read from the table); handoff 367.
- 2026-10-11 (S365 SkyRowan): UI passes on Vision 2030 (#2001; the actions now the CPL Workplan's words), Military Partnerships (#2004) and Noncredit & Learning Partners (#2005), and Team & RACI's two leftovers (#2003); Open Asks Sheet 65 (the Vision 2030 goal figures; which records CPL Pathways shows, measured at 18.2 MB and past the checked gate); KB note `methodology-a-published-file-carries-past-the-tables-read-gate`; handoff 366.
- 2026-10-11 (S364, second session): Long Beach City read, loaded and displayed, 305 of 379 (#1999; display build `344441813b01`, 1,515 rows); Program records builds on first open (#1993); Sam's retired-version ruling (#1995); the read job may run 360 minutes; handoff 365 and queue status corrected (#2000).
- 2026-10-11 (S364 SkyJuniper): Sam kept hours / 16 on Open Asks Sheet 63 (#1990); the Implementation Funding and Contracts UI passes with seeded sweeps (#1991, #1997); Budget's and Annual Workplan Goals' editors read mid-save in both themes, controls as words (#1992, #1994); a second S364 session ran Long Beach City and the Program Requirements speed fix (#1993); KB notes `methodology-a-sweep-sees-only-the-states-its-seed-reaches` and `methodology-a-fill-that-does-not-flip-needs-ink-that-does-not-either` gained sections; handoff 365.
- 2026-10-11 (S363 SkyCedar): Long Beach City's Requirements tab sits inside `<nav id="tabs">`, found by a runner probe; the reader counts a tab bar's own tabs (#1986); trial 2 read 11 of 12 from the tab and the full read runs; Long Beach City in the display builder's dated reads; Open Asks Sheet 63 (where a half unit starts); the Budget tab's UI pass (#1988); KB note `methodology-test-a-reader-fix-on-the-page-it-failed-on`; handoff 364 (SkyJuniper).
- 2026-10-11 (S361 SkyBirch): rules 4 and 5 merged and deployed with Sierra (#1974), COCI status chips (#1972), Riverside City 39120 removed by Sam's own paste, Long Beach City's read started, the extraction push guard (#1976), the Workplan Goals UI pass (#1977), the two-call extraction built (#1978); S360's lessons section and S327-S333 moved to the archive; KB note `methodology-a-path-filter-compares-pushes-not-branches`; handoff 362 (SkyAlder).
- 2026-10-11 (S359 SkyMoss): RCCD's Liberal Arts emphasis read (#1965-#1967), Sheet 60's eight rows removed (#1968), Sam's Mt. San Antonio reading rules; KB note `methodology-a-missing-course-may-be-a-retired-version`; handoff 360.
- 2026-10-10 S357 SkyCanopy: curriQunet catalogs read as data (KB note `methodology-a-javascript-catalog-is-data-read-what-it-fetches`); district catalogs scoped; Open Asks Sheets 58 and 59; handoff 358.
