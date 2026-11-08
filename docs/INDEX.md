---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-11-08
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
| Doctrine (behavior-shaping) | 6 | [`catalog/doctrine.md`](catalog/doctrine.md) |
| KB notes | 576 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 94 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 100 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 66 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 569 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1411** | |
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
- 2026-11-08 SkyMaffei (S603, Sam's session): Sheet 169 answered and carried out: security step 3 applied and read back (#2901), the noncredit category table designed through Governance and held for its picker (DR-33, #2908); security step 4 applied: the KPI history guard (#2907) and the budget logo policy through the runner, which now takes `project=` (#2909); Contra Costa's SLO full read and Cuesta's index started (#2873, #2910).
- 2026-11-07 SkySombrero (S602, Sam's session): Palomar and Los Medanos displayed; LMC's GE page read and its local degrees parked; the ECHT CompTIA four read as course exams; security step 3 built and held (#2901); the k=10 check (#2903) and the failure watch (#2905); statewide_kpi_test fixed (#2902); Open Asks Sheet 169 (#2904); light checkpoint; `docs/session_603_handoff.md`.
- 2026-11-07 SkyMilkyWay (S601, Sam's session): the stale KPI scrape fixed (#2892 fail loudly, #2893 header, #2897 reason in the tail, #2898 encoded secret; scrape lands 16:09Z); Open Asks Sheets 167 and 168 (security asks reach the sheet, #2895, #2896); the Sky: COBIx inbox routine drafted for Sam's review (#2894, routine disabled); light checkpoint; `docs/session_602_handoff.md`.
- 2026-11-07 SkyTriangulum (S599, CPL Queue routine, 12:12Z): DSP Credit Starting Points Version 3 from Sam's Revise request, in ELL IET Version 5's form, stored as the card's draft (#2883, CPLBrain#707); Coalinga merged (#2882) and displaying; Palomar's clean re-capture, Chemistry extracting; Los Medanos adds nothing; `docs/session_600_handoff.md`.
- 2026-11-07 SkyAndromeda (S598, CPL Queue routine, 11:12Z): Palomar held back from extraction after 8 host errors and re-captured; Coalinga extracting its two new programs; Los Medanos captured on the current eLumen reader; light checkpoint; `docs/session_599_handoff.md`.
- 2026-11-07 SkyCartwheel (S595, CPL Queue routine, 08:12Z): S594's #2874 merged; Siskiyous 73 of 77 on the new reader, extraction 42354853403 running; Lake Tahoe's SLO load pushed (#2833); Contra Costa's full read due 2026-11-08; light checkpoint; `docs/session_596_handoff.md`.
- 2026-11-06 SkyHarbor (Library side session): SkyBeacon's PRs merged (#2858, #2859, CPLBrain#694); Add your credential live (#2860, DR-32); the Library List sorts loose pieces by date (#2861); Moreno Valley's HES 1 claim on HIST 150 held, no Basic Military Training on world history (#2862); CPL Pathways opens on every college with the Credential Catalog inside, full width (#2863); full checkpoint; `docs/library_handoff.md`.
- 2026-11-06 SkyBeacon (Library side session): the ask rule (#2854); the CER retire path and Sam's 1 yes, 2 yes written and folded by the rename (#2855); the Catalog's badges and a college's first view (#2856); the Commons first view from Sam's recording and the lapsed-token fix on every surface (#2857); COCI Lookup named Courses and Programs (#2858); `library_lessons.md` compacted into `library_lessons_archive_2.md`; full checkpoint; `docs/library_handoff.md`.
