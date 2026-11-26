---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-11-26
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
| KB notes | 605 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 95 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 112 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 77 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 691 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1586** | |
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
- 2026-11-26 (S739 SkyOystercatcher, the CPL Queue routine's collection run, conductor, full checkpoint): #3880 (display build `3a699eddc8c9`), #3881 (the lever's land), #3882 (the pooled reading's land: El Camino, Modesto) and #3883 (the applied piles s739a to s739h) merged; land 4 carries `piles2`, `waveA` and `waveB`. 99 records collected, 30 named gaps for programs with no record. Handoff 740 (the run's log, kept whole); the harvest lane and its lessons (S720 and S721 to archive 9; S739 section); memory rows `kb/migrations/2026-11-26_s739_cpl_memory_rows.sql`; `kb/status/program-requirements.json`.
- 2026-11-26 (S737 SkyWhimbrel, light checkpoint): #3870 (the Honors step-4 redraw; `--plan` refuses once step 2 applied; 128 mints), #3873 (suite durations re-measured, six lint shards: the check 10.3 to 7.7 min), #3874 open (the docs-only lint skip for 35 traced steps). Handoff 738.
- 2026-11-25 (S735 SkyAlvord, a side session beside the main queue, checkpoint with the lanes moved): Adult Education CPL Starting Points, the CAEP noncredit inventory read against MAP (#3861 merged: Library record, memory rows and the Pages copy; #3864 open: filter, search, 25 more credentials, the record's url on Pages; the public summary migration was refused by the public-field guard and withdrawn). Library findings: the check run checks a piece only at its own Pages address; Publish now's scope; #3865 drafts the prefilled summary and the sidebar height. Library lessons' S511 to S518 and four lane paragraphs moved to archive 3. Handoff 735 (SkyBrant).
- 2026-11-25 (the funding page side job beside S733, light checkpoint): #3844 and #3849 (Simple view switch visible again, row caret, # and District off in Simple view, As of / Ver. hidden from readers not signed in, the college landing page in a bottom bar), #3845 (the NC lead from MAP's College Contacts report: 27 colleges meet it, was 2), #3852 (How to maximize funding). Funding lessons' S439 to S466 sections moved to archive 5. Side section in handoff 734.
- 2026-11-25 (S733 SkyGodwit, second checkpoint): #3851 (Local subjects course-move sidebar), #3853 (the stray-code re-mint applied: 60 retired, 20 aliased, 35 held), #3857 (seeder keeps assigned codes), #3858, #3859 (recommender 0 to 100). Handoff 734 refreshed.
- 2026-11-25 (S733 SkyGodwit, Sam's plain session, checkpoint with the lane moved): #3841 (COBIx's 911 leftover titles filed through `--csv`), #3843 (the stray-code re-mint dry run: retire, not re-key), #3846 (the rescore scored 0 to 100 on Sam's ruling; scope at 90: 92 retire, 48 held, Needs an M-ID 1,819 to 1,918). Handoff 734.
- 2026-11-25 (S731 SkyFrigatebird, the CPL Queue routine's collection run, conductor, full checkpoint): #3825 (display build `2c8507c058b1`, 18,723 rows live), #3830 (the land PR: Los Angeles Trade-Technical 6, Saddleback 8 under a new gap kind, Long Beach City 12); applied and loaded on open branches: land 2, #3827 (the eLumen follow-up's 40, the pooled reading's 7, the lever's 3), and Saddleback's repeat steps' 7 for land 3; 83 records in all. KB note `methodology-a-self-check-must-see-what-the-rule-writes` gained an S731 section; the harvest lessons' S714 sections moved to archive 9. Handoff 732.
- 2026-11-25 (S730 SkyDunlin, Sam's plain session, light checkpoint): #3824 (Needs you folds to its card; a doubt ruling moves the in-doubt count at once), #3826 (`npm run a11y` on the Commons fold: an h2 above the folded card, 24px card titles).  #3831 (Sam's stray-code ruling and the title hunt list), #3832 (runners read every college's catalog subject index: 103 colleges and 8,147 named codes, from 19 and 1,655; the CSV is the 2,500 leftovers). Handoff 731.
- 2026-11-25 (S729 SkyCurlew, Sam's plain session, full checkpoint): #3817 (the Commons fold in place: a card's title folds the page to a trail and that card at `#commons/card/<key>`, with Open the full list); the adapt gather landed (PEDS M1029 holds 293 local courses); the commons lane compacted under 20 KB. Handoff 730.
- 2026-11-25 (S727 SkyTropicbird, the CPL Queue routine's collection run, conductor, full checkpoint): #3808 (display build `f4b48370bc11`, 18,711 rows live; the subject-codes test accepts a code a person's statewide filing settles), #3812 (the land PR: the pooled reading's 11 to passing, Shasta 4, American River 12 and College of the Canyons 7 with named gaps, three new gap kinds); applied and loaded on open branches: #3811 (San Bernardino Valley, Orange Coast 3 and Southwestern, all passing), Santa Barbara City 12, Antelope Valley 43028; #3810 (the eLumen fix, scoped to its road) in flight. KB note `methodology-a-reader-fix-moves-rows-it-was-not-aimed-at` gained an S727 section. Handoff 728.