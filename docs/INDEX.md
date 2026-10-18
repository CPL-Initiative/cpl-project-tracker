---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-18
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
| KB notes | 553 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 88 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 83 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 58 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 390 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1177** | |
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
- 2026-10-18 (S418 SkyMadrone, hand-opened): the first CER saving run (926 titles as 1,852 `kb_curation` rows under 7 cohorts) and the fold's first apply since July (1,102 assignments, 12 supersedes, 455 credential records, 18 held; 4,915 titles); Sheet 96 answered *keep* at 17:23Z; #2230 deployed after the third A/B (7s traced to variance: a place question never reaches the changed block); the Our Process UI pass (#2233) and S417's checkpoint (#2234) merged; the Commons mock-up at version 3 with its Exhibit pair re-measured; the stale S338 checkpoint PR closed.
- 2026-10-18 (S417 SkyManzanita): #2231 merged and the CER lane's first saving run staged (preview 926 under 7; #2232 quotes the workflow's save options); the Commons mock-up revised on Fable's review with every figure re-measured; #2230's live-program gate fixed after the A/B lost 7l; the Our Process UI pass (#2233); Open Asks Sheet 96 drafted (CPLBrain#385); handoff 418 (SkyMadrone).
- 2026-10-18 (S416 SkyCeanothus): Sheet 94's three CER rulings built (#2231: the per-item fold hold, the procedure save with its receipt and undo, the sign-off and Curate panel retired); Sierra reads complete records (#2230); the Commons row mock-up; lessons S416 in `cer_v2_redesign_lessons.md`.
- 2026-10-18 (S415 SkyRedbud, the routine): San Joaquin Delta's held rescore settled by a printed degree floor (152 to 154 passing, 71 reread) and Taft's transfer degrees counting Cal-GETC as the statewide 34 (24 to 34, 17 reread), #2226; display build `48cb66f19cff` (15,946 programs at 114 colleges); Open Asks Sheet 94; handoff 416 (SkyCeanothus).
- 2026-10-18 (S414 SkyChamise, the routine): the Coursedog reader (Merced: 154 of 172 found, 153 loaded, 125 passing, $9.14); the slash rescoring by free reconcile runs (Glendale 14, De Anza 12, LA Trade Technical 5, Crafton Hills 2 replaced) and the `THART/S` reading; display build `7e4a2a9c5ba7`, 15,946 programs at 114 colleges (#2224); San Joaquin Delta's rescore held.
- 2026-10-18 (S413 SkyPinyon, hand-opened): #2219 landed through #2220 with the wave's display build (`3a5ed5d7bcf3`, 15,770 programs at 113 colleges; Taft loaded 55); the classifier's follow-up pass (1,287 of 1,322 pre-filled, 396 held, $2.67); the CER's three views, Needs you, Procedures, Reference (#2221, the UI pass); the harvest reads a slashed course subject (#2222: Crafton Hills 76 of 79, build `3f93779f0115`, 36 misread records at three colleges named for a reread).
- 2026-10-18 (S412 SkyJoshua, hand-opened): the CER procedures run (#2217: store, quality gate, `cer-classify`, nightly workflow; first pass $8.30, 1,116 of 1,322 pre-filled, 428 held), the Procedures lane (#2218), #2219 open; `182e810e207d` applied; Crafton Hills loaded (64); Rule 8's read reaches undated rows; exhibit lessons compacted to an archive; handoff 413 (SkyPinyon).
- 2026-10-18 (S411 SkySotol, hand-opened): `d6cc1fde7ea3` applied; Hartnell read by its Coursedog code headings (8 loaded, 14 moved to their own heading, 4 wrong-page rows removed under a receipt); a kept record must come from its source's page; SmartCatalog by the generic road and vendor-host page reads; display build `182e810e207d` (15,651 programs at 111 colleges, #2216). Sam asked for the CER on procedures: new lane `cer-procedures`, the v3 mock-up, Open Asks Sheet 93. Handoff 412 (SkyJoshua).
- 2026-10-18 (S410 SkyYucca, hand-opened): `ffd6929a4f90` applied; Cañada filed from Sam's catalog-files copies (Sheet 92 card 1) and Hartnell read through a PDF catalog step that names its file; 62 and 68 loaded unchecked, display build `d6cc1fde7ea3` (15,647 programs at 111 colleges, #2213); TMC Builder's UI pass (#2214); four `cpl_memory` rows; no decision sheet open. Handoff 411 (SkySotol).
- 2026-10-17 (S409 SkyOcotillo, hand-opened): `f949e7c0ea35` applied; Cuesta loaded 181 unchecked and display build `ffd6929a4f90` (15,517 programs at 109 colleges, #2210); Exhibit Adoption's UI pass, its table and matrix measured for the first time (#2211); Cañada's 2026-2027 PDF found behind its robots.txt refusal (Open Asks Sheet 92); the Coursedog and SmartCatalog hosts read; handoff 410 (SkyYucca).
- 2026-10-17 (S408 SkyAgave, hand-opened): the code finder reads a run of numbers after one subject (#2206, Glendale 190 to 258 found); the outcomes check reads a list number at a line's end (#2207, Ohlone 125 failures to 8); East LA's rows carry their year; Desert, Pasadena, Glendale, Grossmont, Ohlone and LA Southwest loaded unchecked; display build `f949e7c0ea35` (15,336 programs at 108 colleges, #2208); handoff 409 (SkyOcotillo).
