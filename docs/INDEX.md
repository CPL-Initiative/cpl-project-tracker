---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-06
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
| KB notes | 524 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 82 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 81 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 54 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 309 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1055** | |
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
- **2026-10-06 (S337 SkyCompass, scheduled):** a second capture list beyond Sam's 20 (`--sample maps`); Irvine Valley Art A.A. 10265's record (extraction 37488863819, PASS); Santa Monica's catalog never links its Barbering program, so a procedure record is next; handoff 338 (#1886).
- 2026-10-05 (S336 SkyCourier): sheet 42 carried out (outcomes on the 20 live rows, Sierra redeployed, display build 1cb75672ba6c with Miramar's two drafts, drafts on My College now: #1878); open-asks sheet 44; Irvine Valley's and Santa Monica's program maps read into terms (#1876); a signed-off session lets go of its wakes (#1879); KB note `methodology-an-idle-session-still-holds-wakes`; handoff 337.
- 2026-10-05 (S335 SkyKeel): drafts for the college on the Program Requirements tab (sheet 32 card 2, the harvest-tab half); Miramar's AUTO 156G traced to MAP's 0.3-hour rows, with no credit through it; Sierra names a college gap by its kind; KB note `methodology-trace-a-finding-to-what-students-received`; open-asks sheet 42; handoff 336 (#1874).
- 2026-10-05 (S334 SkyAnchor): record shape 3 keeps program outcomes as printed (19 of 20 pilot records); a person's verdict is held to the requirements read; CPL Pathways shows each catalog record by requirement or by term; KB note `methodology-a-verdict-covers-the-reading-it-saw`; open-asks sheet 41.
- 2026-10-05 (S333 SkyHarbor): KB note `methodology-an-additive-sync-cannot-carry-a-correction`; handoff 334; the *Ext & Review* rename ran on main; display build 799bfb9a7dbf applied as a two-path guarded update (#1866); sheet 39 ruled: OSHA has one name as issuer, CTCNC its trainer, five curator rows replaced and the CER applier's guarded replace (#1868); Sam's issuer rule and sheet 39 in memory (#1865).
- 2026-10-05 (S332 SkyBridge): the ROEP display reads identity from the live CCR (#1861); OSHA 30 on IWAP 41.09 and read 13 (#1862); sheets 37-38 ruled, Sierra at the top of Program Requirements (#1863); `apply_migration` allow-listed (#1864); handoff 333.
- **2026-10-05 (S331 SkyForge):** KB note `methodology-a-search-result-is-a-lead-not-a-source`; handoff 332; the Program Requirements tab in COBI with its Procedures view (#1860); the college page read opens collapsed sections and prints a table's matching rows; Cerritos reads 7-12: CATEMA, CTE Course Connect, the CCAP partner schools, the archive's 2016 list of 57 agreements; procedure record v4; open-asks sheet 37.
- 2026-10-04 (S330 SkyRoutine): KB note `methodology-an-advisor-asserts-what-its-fact-list-does-not-say`; handoff 331; the college page read submits a form and skips a gone host; Cerritos reads 4 and 5 (#1859): Schedule+ sections, the Credit by Exam route, Statewide Career Pathways gone, the B.S. on the Chancellor's Office list; the Ironworker pathway film draft v1 (`prototype/ironworker_video/`); open-asks sheet 36.
- 2026-10-04 (S329 SkyRunner): Sierra's statement deployed; the college page read and three Cerritos reads (#1858): classroom hours, the B.S. start and proposed course list, the noncredit and high school lines; the registry's procedure columns; `docs/reference/scheduled_sessions.md` for Sam's routine; open-asks sheet 35; handoff 330.
