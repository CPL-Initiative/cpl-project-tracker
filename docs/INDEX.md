---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-11-24
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
| KB notes | 604 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 95 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 110 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 77 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 677 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1569** | |
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
- 2026-11-24 (S719 SkyShearwater, Sam's plain session, full checkpoint): #3740 (the Subjects card matches a college's name as the table does), #3741 (the web-search pass for all 205 untitled codes with no filed search; a program label only where the page lists the code's courses), #3743 (every Commons card but Plan in the Subjects card's checks design), #3744 (the quarterly MQ baseline on the 20th edition, its test tied to the handbook file), #3745 (the MQ view at `#commons/subjects/mq`, the second sidebar), #3748 open (the cards answer their own edits). The commons and CSR lanes compacted to archive 8. No new KB note; a fourth instance in methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh. Handoff 720 (SkyCormorant).
- 2026-11-24 (S718 SkyPetrel, Sam's plain session, full checkpoint): #3730 (Estimating's common code reads ESTG), #3732 (the Subjects view by confidence: a Needs attention column after College, Act on it at the top of the panel, the card's quick links with its sections folded), #3733 and #3734 (a code the index omits read at its code's address, and the pages a filed search found read: Cerritos INST, Long Beach City CART), #3737 open (`check_generated.sh` covers every status file, with a guard). 1 new KB note (methodology-a-hand-listed-checklist-drifts-a-guard-on-the-unlisted-item-does-not). Handoff 719 (SkyShearwater).
- 2026-11-23 (S717 SkyGannet, Sam's plain session, full checkpoint): #3724 (the Subjects tab's Colleges by source: all 118 colleges by way to look, from a new attempts register), #3725 (the course panel's move rows, Collapse all, the credit-then-noncredit picker), #3726 open (the 20th-edition MQ handbook read with its three list types and Title 5 provisions, the MQ view's data, and a Common SUBJ for the 95 MQ disciplines that had none), #3727 open (a sidebar opens beside the view); Sam's rulings on settled codes, the TOP vocational flag and the MQ view; KB note `methodology-a-reference-seeded-from-its-consumers-cannot-see-what-they-never-reached`; handoff 718.
- 2026-11-23 (S715 SkyAlbatross, Sam's plain session, light checkpoint): #3717 (every Subjects figure counts the rows with the live saves on top, so a save moves it at once; the held line corrected: a decision releases only ordinary-title credit courses), #3718 (the Subjects card from the mock: 83% of courses under a Confident code, four checks with Where to act); two memory rows; handoff 717.
- 2026-11-23 (S712 SkyPuffin, Sam's plain session, light checkpoint): #3702 (the outlines to find by hand open in place; every Commons sidebar resizes with a frozen top), #3711 (every local subject code statewide with a call and a confidence, and its view), #3712 (the re-mint gate reads confidence: AED 75 of 127 ready); Sam's rulings that settled means Confident and that every college counts; the Subjects card mock; the commons lane's Subjects paragraph moved to archive 7; seven memory rows; handoff 715.
- 2026-11-23 (S713 SkyKittiwake, the CPL Queue routine's collection run, conductor, full checkpoint): S703's four PRs merged (#3686, #3675, #3684 with Peralta's 3,731 outline rows, #3683); #3705 (Santa Rosa Junior's 15: a common course number in parentheses, `section_cut_off`); #3708 (display build `da3198af6b98`, 18,660 rows); #3707's general education steps (8 records) and Glendale's 13 applied; City College of San Francisco's outline read (3 new rows) and its 53 page-finding programs (47 named gaps); the harvest lane's NEXT rebuilt; `docs/program_requirements_harvest_lessons.md` *S713*, S689's two sections to archive 8; `conductor_mode.md` *What went wrong in S713*; 18 memory rows drafted in `kb/migrations/2026-11-23_s713_cpl_memory_rows.sql`; handoff 714 (SkyFulmar).
- 2026-11-22 (S709 SkyMurrelet, Sam's plain session, light checkpoint): #3697, the re-mint readiness count by the draft gate (`kb/status/mid_readiness.json`, nightly): the AED scope is 127 M-IDs (120 ELEC) on the live members file, 34 ready; the outcomes compare reran on 45,673 rows and gzips past the 5 MB limit; four memory rows; handoff 710.
- 2026-11-22 (S707 SkyPrion, Sam's plain session, full checkpoint): #3691 (main green again: the Exhibits card's duplicate check reads Sam's CAL FIRE title against the shipped titles after a CER run cleared its proposal), #3687 merged, #3693 (the subject map leaves AED unmapped; it had given 45 shared M-IDs an ELEC prefix); Sam's call to settle subjects before re-mints and the draft M-ID readiness gate; the commons lane compacted; four memory rows; handoff 708.
