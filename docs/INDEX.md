---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-11-22
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
| KB notes | 601 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 95 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 108 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 77 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 662 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1549** | |
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
- 2026-11-22 (S702 SkyRazorbill, Sam's plain session, light checkpoint): #3673, Sam's three Subjects asks: Edit and the course panel from every surface, counts that open their rows, the window's width. The queue ran beside it as S703 (#3674); handoff 703 is the plain line's, for Session 705.
- 2026-11-22 (S701 SkyMurre, Sam's plain session, full checkpoint): the Subjects page under #3655: #3666 (Edit and Save on the `kb_curation` path; Sam's 30 Cerritos decisions filed under `subjects-s701@bot` with a receipt), #3667 (the noncredit hold lifted on Sam's word), #3669 (Santa Ana's and Mt. San Antonio's credit catalogs), #3670 (the daily build honors saved decisions), #3671 (noncredit saves, merged `80032b55`). Handoff 702 for SkyRazorbill; the Commons lessons compacted into `commons_lessons_archive_2.md`; KB note `methodology-a-page-promise-narrower-than-its-delete-policy`.
- 2026-11-22 (S700 SkyGuillemot, Sam's plain session, light checkpoint): the Subjects page under #3655: #3660 (the 21 index-linked subject pages filed, 493 courses; the measured recommendations and 108 web searches), #3661 (the course panel at `#commons/subjects/<college>/<code>`), #3662 (SDCCE, Santa Ana School of Continuing Education and Mt. San Antonio noncredit filed; the draft noncredit subject title list inside Subjects; ATH is KINE); Sam's four rulings recorded; the commons lane compacted under 20,000 bytes. Handoff 701.
- 2026-11-21 (S698 SkyAuklet, second checkpoint, light): the Subjects page under #3655: #3657 (local titles from the catalogs' own headings, in Title Case: 1,334 of 1,629 codes) and #3658 (the labels, the chip that says why a row has no title, the noncredit hold and categories, Sam's 30 Cerritos decisions held). Handoff 700 rewritten.
- 2026-11-21 (S698 SkyAuklet, Sam's plain session, light checkpoint): #3652 (COBIx's follow-ups on the Exhibits Review card and the Commons front page: *combine* across the Exhibits tab, chips as notes, the details retry, the narrower duplicate flag; colleges and campuses, the stuck words, the term match, the checked catalog address) and #3654 (the dependency map on an hourly timer). Handoff 700.
- 2026-11-21 (S697 SkyPuffin, the CPL Queue routine's 13:12Z firing, conductor, full checkpoint): #3640 (the `total_not_printed` gap applied at Santa Monica; Orange Coast, Hartnell, Imperial Valley and Oxnard reread), #3641 and #3644 (a short or timed-out read files nothing, the same-page calls in one place, the named-programs `only` input, Butte's address compare), #3645 (Cosumnes River's named read, $1.16, 10 passing), #3642 (Irvine Valley's outlines on Saddleback's host; 1,732 rows loaded); #3649 (`total_differs`) and #3650 (display `9d9244ee7496`) in flight; Sam's two rulings relayed by COBIx (a block is a block; vault notes merge on their checks) in `sam_rulings`, `conductor_mode` and `scheduled_sessions`; a section of `methodology-chain-prs-when-every-merge-conflicts-a-generated-file` on the Commons files. Handoff 698.
- 2026-11-21 (S691 SkyPetrel, the CPL Queue routine's collection night, conductor, full checkpoint): #3602 (S690's follow-up; `commons_data.json` rebuilt under Python 3.12), #3634 (the wave: the reread plan's rows 56 to 73, College of the Canyons' noncredit codes and prefix aliases, San Joaquin Delta, Solano), #3633 (Santa Monica's pinned reread, the `total_not_printed` gap, `math.fsum` in the Commons builder) and #3635 (display build e35ae1722a56): 109 new program records and 201 replaced; the census at 4,875 left; handoff 697, the S691 lessons and conductor sections, the kb-note `methodology-a-generated-file-is-built-with-the-runners-python`, and the harvest lessons compacted into archive 7.
- 2026-11-21 (S695 SkyShearwater, Sam's plain session on the Commons, conductor, full checkpoint): #3624 (special and selected topics flagged not applicable; the pile 2,493 to 1,909), #3625 (`#commons/subjects/held`), #3627 (both Subjects builders in the daily build), #3626 (the pile mint v3: a 98% floor per route, `discipline_source: pile_mint`, the apply); #3630 (`LSKL M9004`, the first pile-minted record) and #3629 (repo slimming items 1 and 2) open; the self-recall note gains a dated section on mint routes; `docs/commons_lessons.md` *S695*, three sections to its archive; 14 memory rows drafted in `kb/migrations/2026-11-21_s695_checkpoint_memory_rows.sql`; handoff 696 (SkyFulmar).
