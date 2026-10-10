---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-10
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
| KB notes | 534 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 86 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 81 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 55 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 329 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1090** | |
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
- 2026-10-10 S357 SkyCanopy: curriQunet catalogs read as data (KB note `methodology-a-javascript-catalog-is-data-read-what-it-fetches`); district catalogs scoped; Open Asks Sheets 58 and 59; handoff 358.
- 2026-10-10 (S356 SkyThicket): Sam's three rulings (apply display build 5be53871ebf4; read Approved programs; a standing go for each display build after a college load); the college workflow's display job applies a receipt from the runner, verified by one combined hash (5be53871ebf4 on 292, 153ead0ce992 on 605); Mt. San Antonio read and loaded (313 records); the Approved programs loaded at both colleges (+33, +70) and `ee814befc65d` on 700; Team & RACI's first UI pass (#1957); KB note `methodology-a-receipt-too-large-for-the-connector-applies-from-the-runner`; handoff 357.
- 2026-10-09 (S354 SkyFurrow): Cerritos loaded unchecked through `program_requirement_records_college_load()` (#1941, 270 records, receipt per load); reads gated on `[read]`/`[extract]`; the Activities UI pass (#1945); Program records gains Find a record and the scorer's course counts (#1946); a Progress call answers its records on its card (#1947), all for Sam reading on his phone.
- 2026-10-09 (S353 SkyHearth): Phase 2 of the ROEP harvest opens at Cerritos (#1941: sitemap-first read, 283 of 288 programs, a page goes to one program); the funding explainer's typed passages edit on the tab and its masthead follows Sam's marks (#1940); First Light rule, controls are underlined words (#1942); KB note `methodology-anchor-a-marker-a-workflow-reads`; handoff 354.
- 2026-10-09 (S352 SkyMeridian): the Fact Sheet's `--on-accent` (#1934); its First Light mock-up built from its own code (#1935) and, on Sam's "Fact Sheet looks great!", ported with a screen-only dark mode (#1938); the Dashboard's first UI pass, clean light and dark (#1937); `ui_pass_lessons` S352 section; KB note `methodology-an-undefined-css-token-fails-to-an-invisible-state` third case; handoff 353.
- 2026-10-09 (S351 SkyLark): UI passes on the privacy page (First Light's type and dark, #1929), the funding explainer (the Columns menu opens on the screen, #1930) and SkyView (chip tokens; on-accent ink on three dark fills at 2.65:1, #1932); the picker reaches a view nobody has audited before a re-pass (#1931); new lessons doc `ui_pass_lessons.md`; the fill-and-ink KB note gains its second case; handoff 352.
- 2026-10-09 (S350 SkyTide): the veteran map ported to First Light on Sam's Sheet 55 ruling, COBI's frame on `?embed=1` with a marker size floor, `build_selfcontained.py --check` in CI (#1924); the Library record at version 55 (Sam's paste); KB note `methodology-check-a-page-inside-every-frame-that-embeds-it`; the Fact Sheet's first UI pass (#1926; the glyph sweep reads the standalone pages now) and Open Asks Sheet 56; handoff 351.
- 2026-10-09 (S349 SkyHarbor): the docked Sierra full screen when she answers (#1921); the first UI pass on Sierra's public page; the veteran map mock-up and Sheet 55 (#1922); KB note `methodology-a-sweep-sees-only-the-states-its-seed-reaches`; handoff 350.
- 2026-10-08 (S348 SkyMeadow): Sierra's public page ported to the approved mock-up, her logo set in five rounds with Sam; new lessons doc `sierra_page_redesign_lessons.md`; handoff 349.
