---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-22
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
| KB notes | 560 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 90 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 84 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 61 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 421 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1221** | |
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
- 2026-10-22 S449 SkyBuckwheat: the harvest queue after S448 (Mt. San Jacinto settled, Berkeley City's codes read through `cq_view`, Palo Verde's new Acalog catalog, Cypress, Hartnell by its site); lessons S449; handoff 450.
- 2026-10-22 (S448 SkyDeergrass, opened by Sam): CPL Pathways' clear, faster list and the COBI header (#2353); My College folded into CPL Pathways, search box and alphabetical list (#2355); My College off the menu, the search redraws on a college change (#2356); handoff 449.
- 2026-10-22 (S447 SkyBrittlebush, opened by Sam): Sheet 112 answered, later (#2348); an Administration of Justice address and a hyphenated course code (#2349); Mt. San Jacinto and Santa Barbara City reread, build be2635ed5b73 (#2350); the harvest lessons' S399-S403 to archive 3; handoff 448.
- 2026-10-22 (S446 SkyMadrone, the CPL Queue routine): the CPL opportunity visual's UI pass (#2344); a degree-and-certificate address names both awards (#2345); 91 new records at Palomar, MiraCosta, Grossmont and Pasadena City, display build 0ad3c75bfa19 (#2346); handoff 447.
- 2026-10-22 (S445 SkyCurrant, opened by Sam): a page read's capture view (#2336, #2341); a shared page per section heading and MiraCosta's listed degrees (#2337, #2342); Palomar's "Cert. Achievement" (#2339); 185 new records at five colleges, build 82d6298a0c67 (#2340).
- 2026-10-22 (S444 SkyBlueOak, opened by Sam): Foothill merged (#2326); blocked catalogs flagged on Procedures (#2328); a call carries Sam's sheet answer (#2329); 37 Program Mapper hosts recorded (#2330); Golden West and Imperial Valley loaded (#2331); department pages and two-line award headings (#2333).
- 2026-10-21 (S443 SkyToyon, opened by Sam): funding off My College (#2316, #2320); Reedley loaded (#2317); a page heading a section per award serves each sibling (#2322) and Foothill re-read and loaded (#2326); tabs never remember a filter (#2325, a CLAUDE.md rule); Open Asks Sheet 111.
- 2026-10-21 (S442, the CPL Queue routine's run beside SkyManzanita): the harvest keeps a Requirements tab whose numbers carry a campus letter (#2309); Moorpark, Oxnard and Ventura re-read; one display build with Reedley.
- 2026-10-21 (S442 SkyManzanita, opened by Sam): Sheet 109 applied (#2310); CPL Pathways' college line and the name CPL Pathways (#2312); one college choice for My College and CPL Pathways (#2313); My CPL Funding and the expenditure reports leave My College; Reedley re-read and loaded; KB note methodology-hand-another-tab-a-request.
