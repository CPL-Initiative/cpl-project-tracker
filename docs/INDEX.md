---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-11-27
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
| KB notes | 608 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 95 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 112 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 77 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 697 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1595** | |
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
- 2026-11-27 (S745 SkyTattler, Sam's plain session, full checkpoint): #3916 (Pages deploy wait and retry), #3918 (the Chabot glue fold: statewide subject codes 2,896 to 2,871), #3919 (CPL Pathways credentials bar), #3920 (Industry certs chip), #3921 (frame check; PPM, CVC and ASSIST as priority connections). KB note `reference-outside-tools-framing-and-reading`. Handoff 746.
- 2026-11-27 (S744 SkyCurlew, Sam's plain session, full checkpoint): #3908 (the campus letter fold, `kb/coci_campus_letter.py`; statewide subject codes 2,924 to 2,896), #3909 (Library buttons open the landing page on the exhibit, `?Exhibit=`), #3910 (CPL Pathways Get credit), #3911 (Stackable programs, `kb/_build_program_ladders.py`); the compact course cards in flight; handoff 745; lanes common-subjects-reference, library (compacted under 20 KB) and program-requirements-harvest; KB notes `reference-map-landing-page-exhibit-parameter`, `methodology-stackable-programs-by-course-containment`; 9 memory rows.
- 2026-11-27 (S742 SkyGodwit, the CPL Queue routine's collection run, conductor, full checkpoint): #3904 (display build `5b80d4de75e9`) and the land merged; keep-better's `plural_longer` and `plan_code_own`, the Acalog road reading `site_pages` pins, Coastline's pin, San Jose City's `JOURN138` renumber, Cuyamaca's and Cabrillo's reconcile steps, the compact live read; 21 records at the 14:44Z count (8 passing, 13 named gaps). Handoff 743, the harvest lane (S741 posts and NEXT moved), its lessons (*Moved from the lane (S742 checkpoint)*, *S742*), 8 memory rows drafted, `kb/status/program-requirements.json`. Land and census: handoff 743.
- 2026-11-27 (S736 SkyBrant, Sam's plain session, full checkpoint): #3864, #3865, #3868 (Library publish fixes; Adult Ed CPL Starting Points passes its check), #3867 (the Accounting re-point dry run, apply blocked on Sam's Business filings), #3889 and #3890 (Sign in on a phone, the magic link returns to its view), #3893 (the lightning round: Not a subject, Skip, the training note), #3894 (LACCD schedule titles, 171 of 212); handoff 744 (742 and 743 are the routine's); lanes common-subjects-reference, commons and library compacted under 20 KB.
- 2026-11-27 (S741 SkyWillet, the CPL Queue routine's collection run, conductor, full checkpoint): #3900 (`main`'s red noncredit test repaired), #3898 (display build `a143061a2ae2`) and the land merged; rule B, `window_keeps_tabs`, `cq_group_ends`, keep-better's major-equal rank, the Copper Mountain and Cuyamaca degree-floor steps, pins; 52 records (28 passing, 24 named gaps). Handoff 742, the harvest lane (S740 posts and NEXT moved), its lessons (*Moved from the lane (S741 checkpoint)*, *S741*), 9 memory rows drafted, `kb/status/program-requirements.json`. Land and census: handoff 742.
- 2026-11-26 (S740 SkySkimmer, the CPL Queue routine's collection run, conductor, full checkpoint): #3886 (display build `9e28519af71f`); the units kind `units_within_printed_range` (by reviewed key only), Copper Mountain's reissue and three records, Santa Ana's first reconcile, Solano, San Jose City and San Bernardino Valley rereads, lane 2's 23 named gaps; 79 records by 16:30Z; handoff 741, the harvest lane, its lessons (*Moved from the lane (S740 checkpoint)*, *S740*), 10 memory rows drafted, `kb/status/program-requirements.json`. Land and census: handoff 741.
- 2026-11-26 (S739 SkyOystercatcher, the CPL Queue routine's collection run, conductor, full checkpoint): #3880 (display build `3a699eddc8c9`), #3881 (the lever's land), #3882 (the pooled reading's land: El Camino, Modesto) and #3883 (the applied piles s739a to s739h) merged; land 4 carries `piles2`, `waveA` and `waveB`. 99 records collected, 30 named gaps for programs with no record. Handoff 740 (the run's log, kept whole); the harvest lane and its lessons (S720 and S721 to archive 9; S739 section); memory rows `kb/migrations/2026-11-26_s739_cpl_memory_rows.sql`; `kb/status/program-requirements.json`.
- 2026-11-26 (S737 SkyWhimbrel, light checkpoint): #3870 (the Honors step-4 redraw; `--plan` refuses once step 2 applied; 128 mints), #3873 (suite durations re-measured, six lint shards: the check 10.3 to 7.7 min), #3874 open (the docs-only lint skip for 35 traced steps). Handoff 738.
