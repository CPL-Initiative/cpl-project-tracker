---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-13
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
| KB notes | 549 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 87 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 81 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 56 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 356 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1134** | |
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
- 2026-10-13 S384 SkyPoplar: #2083-#2086 merged and the build queue deployed; Program Requirements read in pages (#2088), once when signed in (#2089), and by college with a light index (#2090, open); the identity guard race fixed (#2087); Modesto and Palo Verde captures read; Open Asks Sheet 77; the pagination note updated.
- 2026-10-13 (S383 SkySpruce): Cabrillo displayed (#2078), Sheet 75 answered and carried out (#2082, #2083), the whole-harvest measure (#2084), the eLumen hub reader (#2085); handoff 384 (SkyPoplar).
- 2026-10-13 S382 SkyLarch: Coastline read (hidden Requirements tab), loaded and displayed; Cabrillo loaded; #2076 migrate runner and #2080 Annual Goals Under list merged; handoff 383.
- 2026-10-13 S381 SkyRowan: Bakersfield loaded and displayed (eLumen), the Progress view's counts open their lists, Coastline's near misses and Cabrillo's department menu; handoff 382 (SkyLarch).
- 2026-10-13 S380 SkyAlder: course_outcomes live (Sam's paste) and loaded at RCCD (#2049) and SDCCD (#2066), 4,894 rows; Chaffey's outcomes not public (#2073); the eLumen reader (#2072, fast publish/content read) and Coastline's CourseLeaf fixes (#2074, index.html pages, no course listings), both colleges extracting; KB note methodology-read-a-catalog-through-its-own-content-call; handoff 381.
- 2026-10-13 S376 SkyLinden: the Requirements-tab re-reads loaded and displayed (Mesa #2064, San Diego City #2068, Miramar #2070; build `98becf9fafc7`, 2,203 rows); SDCCD's outline index (#2065) and SLOs by college group (#2066, draft, on #2049); the trigger-file gate (#2069); KB note `methodology-a-trigger-file-must-differ-from-main`; handoff 380 (SkyAlder).
- 2026-10-13 S378 SkyHemlock (scheduled): #2063 already merged and run 586 green; Move to the team phrase held by the permission check (Open Asks Sheet 73); the Common Course Reference UI pass (list view measured by new a11y targets ccr-list and ccr-list-dark, 0 findings in both themes); handoff 379.
- 2026-10-13 S377 SkySequoia: S375's checkpoint (#2058) and vault note (#327) merged; Refresh summaries shipped (#2059, `activity_summaries.js`, published by run 583; the activity header's Update link retired, its link row wraps at 390px); the Move control (#2056) green after its dialog led with Cancel, still held for its function; apply_migration down (nothing newer than 23:19Z in schema_migrations); KB note playbook-when-apply-migration-times-out-read-the-migrations-table; handoff 378.
- 2026-10-13 S375 SkyTally: Annual Goals PR A merged (#2051, the add flow's hidden insert made literal), the UI pass (#2054, published by run 582), `project_add.js` retired (#2055), the Add dialog's checkbox targets (#2057), the Move control built and held for its function (#2056; apply_migration down); S374's stranded checkpoint #2052 brought up to main; KB note playbook-test-a-database-function-locally-with-pglite; Open Asks Sheet 72; handoff 377.
- 2026-10-12 SkyLedger (parallel session; its receipts say s372): new lane `workplan-annual-goals`, `workplan_annual_goals_lessons.md`, KB note `methodology-an-option-list-read-from-the-page-dies-with-the-renderer`; handoff 375.
- 2026-10-12 S374 SkyJuniper: S373's #2046, #2047 and #2048 merged; the SLO read at RCCD (#2049: the outline's SLO area, not the objectives before it; run 38318152644 reading 1,605 outlines; `course_outcomes` written, not applied: apply_migration timed out); Mesa's nine health programs traced to a four-tab cap (#2050); KB note methodology-a-lead-in-sentence-is-not-a-section-heading.
- 2026-10-12 S373 SkyCypress: San Diego Mesa read, loaded and displayed (#2044, 166 records, build da4f44a160ca); Sheet 70 answered: the registry's course outline fields (#2045) filled on 118 rows (#2047); the course outline census merged (#2042, run 5: 32 outlines, 18 with SLOs); the RCCD course index (#2046, 1,605 of 1,648 courses with a public outline); KB note methodology-a-sign-in-form-is-no-proof-of-a-closed-system.
- **2026-10-12 (S371 SkyMaple)**: San Diego City displayed (#2034); College Identity UI pass (#2035); MAP Users sign-in wording (#2036); Mesa registry receipt (#2037, held) and the painting gallery (#2038, step 1); new KB note `methodology-same-context-size-means-the-model-varied`; handoff 372 (SkyRedwood).
