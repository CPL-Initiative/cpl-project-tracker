---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-19
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
| KB notes | 555 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 89 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 83 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 58 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 394 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1184** | |
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
- 2026-10-19 (S422 SkyWillow, the routine): San Joaquin Delta's three scorer readings, 154 to 195 of 202 live rows passing (#2250); Taft's two local GE patterns, no step (#2249); the Sierra Training UI pass (#2251); lessons S422, handoff 423.
- 2026-10-19 (S421 SkyTupelo): the second reader built (#2246); Cañada's Cal-GETC step and the six-row rollback (#2247); three Jev sittings read, verdicts in `kb/jev_harvest_verdicts/`; lessons S421; handoff 422.
- 2026-10-19 (S420 SkyTanoak, hand-opened): Cañada's re-read landed (#2244: 26 moved pages re-extracted, 8 loaded, 17 replaced, display build 3aa52b4afcb6); the CPL News UI pass (#2243); a Jev calibration sitting over a college's failing records (`kb/_jev_harvest.py`, #2245) and the xAI smoke for the second reader's key; Open Asks Sheet 97 asked and answered (Build with Grok, 03:11Z); KB note `methodology-a-harvests-tail-needs-a-different-instrument`.
- 2026-10-18 (S419 SkyCottonwood, hand-opened): the Commons' step 1 landed (#2237: the Progress view drawn by the shared `commons_progress.js`, nothing changing on screen, the status file under `kb/status/`) and Sam approved the mock-up (19:08Z, to S417; version 4 collapses per row and all at once); Cañada's PDF picker reads the catalog's three heading shapes (#2241; the capture-only run moved 26 pages, eight of the eleven empty records onto their own headings); `docs/commons_lessons.md` and a KB note on the shared-view pattern added.
- 2026-10-18 (S418 SkyMadrone, hand-opened): the first CER saving run (926 titles as 1,852 `kb_curation` rows under 7 cohorts) and the fold's first apply since July (1,102 assignments, 12 supersedes, 455 credential records, 18 held; 4,915 titles); Sheet 96 answered *keep* at 17:23Z; #2230 deployed after the third A/B (7s traced to variance: a place question never reaches the changed block); the Our Process UI pass (#2233) and S417's checkpoint (#2234) merged; the Commons mock-up at version 3 with its Exhibit pair re-measured; the stale S338 checkpoint PR closed.
- 2026-10-18 (S417 SkyManzanita): #2231 merged and the CER lane's first saving run staged (preview 926 under 7; #2232 quotes the workflow's save options); the Commons mock-up revised on Fable's review with every figure re-measured; #2230's live-program gate fixed after the A/B lost 7l; the Our Process UI pass (#2233); Open Asks Sheet 96 drafted (CPLBrain#385); handoff 418 (SkyMadrone).
- 2026-10-18 (S416 SkyCeanothus): Sheet 94's three CER rulings built (#2231: the per-item fold hold, the procedure save with its receipt and undo, the sign-off and Curate panel retired); Sierra reads complete records (#2230); the Commons row mock-up; lessons S416 in `cer_v2_redesign_lessons.md`.
- 2026-10-18 (S415 SkyRedbud, the routine): San Joaquin Delta's held rescore settled by a printed degree floor (152 to 154 passing, 71 reread) and Taft's transfer degrees counting Cal-GETC as the statewide 34 (24 to 34, 17 reread), #2226; display build `48cb66f19cff` (15,946 programs at 114 colleges); Open Asks Sheet 94; handoff 416 (SkyCeanothus).
