---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-11-23
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
| [Design principles (v3)](reference/design-principles.md) | `CLAUDE.md` §Presentation rules, issue #3107 (2026-11-14) | building or mocking any view: the job first, tool or view, ship checks |
| [Sam's rulings](reference/sam_rulings.md) | issue #3055 item 2 (2026-11-14) | before asking Sam something he may already have ruled: his words, dated, with a link to each rule; a row with a Replaced-by entry no longer stands |
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
| KB notes | 602 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 95 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 109 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 77 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 671 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1560** | |
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
- 2026-11-23 (S713 SkyKittiwake, the CPL Queue routine's collection run, conductor, full checkpoint): S703's four PRs merged (#3686, #3675, #3684 with Peralta's 3,731 outline rows, #3683); #3705 (Santa Rosa Junior's 15: a common course number in parentheses, `section_cut_off`); #3708 (display build `da3198af6b98`, 18,660 rows); #3707's general education steps (8 records) and Glendale's 13 applied; City College of San Francisco's outline read (3 new rows) and its 53 page-finding programs (47 named gaps); the harvest lane's NEXT rebuilt; `docs/program_requirements_harvest_lessons.md` *S713*, S689's two sections to archive 8; `conductor_mode.md` *What went wrong in S713*; 18 memory rows drafted in `kb/migrations/2026-11-23_s713_cpl_memory_rows.sql`; handoff 714 (SkyFulmar).
- 2026-11-22 (S709 SkyMurrelet, Sam's plain session, light checkpoint): #3697, the re-mint readiness count by the draft gate (`kb/status/mid_readiness.json`, nightly): the AED scope is 127 M-IDs (120 ELEC) on the live members file, 34 ready; the outcomes compare reran on 45,673 rows and gzips past the 5 MB limit; four memory rows; handoff 710.
- 2026-11-22 (S707 SkyPrion, Sam's plain session, full checkpoint): #3691 (main green again: the Exhibits card's duplicate check reads Sam's CAL FIRE title against the shipped titles after a CER run cleared its proposal), #3687 merged, #3693 (the subject map leaves AED unmapped; it had given 45 shared M-IDs an ELEC prefix); Sam's call to settle subjects before re-mints and the draft M-ID readiness gate; the commons lane compacted; four memory rows; handoff 708.
- 2026-11-22 (S705 SkyTystie, Sam's plain session, light checkpoint): #3687, one Save that settles a code's common subject code at every college using it (#3655 item 0), then Sam's four asks: Cerritos's department list as a title source with a source link, the frozen and resizable panel, moving courses, sortable and resizable columns; and the Exhibits Review card's tools (Previous and Next, Undo, what Change saves, Changes this visit, training sites in place, Articulated with and its no-credit-recommendation flag, another subject), with every Commons List side panel's top frozen. The queue ran beside it as S703 (#3674). Handoff 706.
- 2026-11-22 (S703 SkyDovekie, the CPL Queue routine's collection run, conductor, full checkpoint): #3676 (a recall count binds to its own trial's parser), #3678 (`ge_units_not_read`, 131 rows), #3679 (three hours gaps, 50 rows), #3677 (San Diego College of Continuing Education's outlines: 198 objective rows, 1,860 objectives), #3681 (Clovis and Cosumnes River pins), #3685 (`lists_past_their_figure`, 17 rows); #3686, #3675, #3683 and #3684 (Peralta) in flight. The harvest lessons doc compacted to archive 8; a section on a named gap's self-recall in `methodology-a-test-must-not-take-its-rule-as-the-truth`. Handoff 704 is the routine's; a plain session follows handoff 703.
- 2026-11-22 (S702 SkyRazorbill, Sam's plain session, light checkpoint): #3673, Sam's three Subjects asks: Edit and the course panel from every surface, counts that open their rows, the window's width. The queue ran beside it as S703 (#3674); handoff 703 is the plain line's, for Session 705.
- 2026-11-22 (S701 SkyMurre, Sam's plain session, full checkpoint): the Subjects page under #3655: #3666 (Edit and Save on the `kb_curation` path; Sam's 30 Cerritos decisions filed under `subjects-s701@bot` with a receipt), #3667 (the noncredit hold lifted on Sam's word), #3669 (Santa Ana's and Mt. San Antonio's credit catalogs), #3670 (the daily build honors saved decisions), #3671 (noncredit saves, merged `80032b55`). Handoff 702 for SkyRazorbill; the Commons lessons compacted into `commons_lessons_archive_2.md`; KB note `methodology-a-page-promise-narrower-than-its-delete-policy`.
- 2026-11-22 (S700 SkyGuillemot, Sam's plain session, light checkpoint): the Subjects page under #3655: #3660 (the 21 index-linked subject pages filed, 493 courses; the measured recommendations and 108 web searches), #3661 (the course panel at `#commons/subjects/<college>/<code>`), #3662 (SDCCE, Santa Ana School of Continuing Education and Mt. San Antonio noncredit filed; the draft noncredit subject title list inside Subjects; ATH is KINE); Sam's four rulings recorded; the commons lane compacted under 20,000 bytes. Handoff 701.
