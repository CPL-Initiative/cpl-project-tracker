---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-31
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
| KB notes | 569 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 91 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 96 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 63 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 505 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1329** | |
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
- 2026-10-31 (S535 SkyGooseberry, the CPL Queue routine): Monterey Peninsula 110 to 176 of 197 passing on three reconcile steps (a new `or_units` kind for CourseLeaf "or" rows, the 2026-27 Cal-GETC words, the 60 a floor on "electives, if needed"); display build 598ff64220dd; lessons in `docs/program_requirements_harvest_lessons.md` (S535); handoff 536 for SkySugarberry.
- 2026-10-31 (S534 SkyChokeberry, the CPL Queue routine): Los Angeles Valley 198 to 202 of 215 passing on a new `fill_to` reconcile step (a closing list "for a minimum of N units") and "T otal Minimum Units"; the stopping rule parks the college (`lavc-parked-2026-10-31`); display build d8b6c033cfc6; lessons in `docs/program_requirements_harvest_lessons.md`; handoff `docs/session_535_handoff.md`.
- 2026-10-31 (S533 SkyNannyberry, the CPL Queue routine, finished by the 08:12Z firing): Los Angeles Valley 196 to 198 of 215 passing on the repeat step reading Music's repeatable lists; display build 8603831048ac; lessons in `docs/program_requirements_harvest_lessons.md` (S495-S500 moved to archive 3); handoff `docs/session_534_handoff.md`.
- 2026-10-31 (S532 SkyHackberry, the CPL Queue routine): Los Angeles Valley 186 to 196 of 215 passing on a T & M prefix alias (#2605); the two display applies read back; the UI pass on the Exhibits view; lessons in `docs/program_requirements_harvest_lessons.md`; handoff `docs/session_533_handoff.md`.
- 2026-10-31 (Exhibits tab build, SkyBayberry): Exhibit Adoption's per-credential view folded into the credential panel (`kb/exhibits_adoption.json`), and could-adopt off the TOP and C-ID overlap on the Review card and the panel; KB note `methodology-a-fold-carries-the-folded-tabs-rulings`; lessons in `docs/cer_v2_redesign_lessons.md`; handoff `docs/cer_redesign_handoff.md`.
- 2026-10-31 (Exhibits tab build, SkyBunchberry): Credentials and the credential panel, issuer and training sites editable (#2603); KB note `methodology-widen-a-field-by-saving-its-old-reading-beside-it`; lessons in `docs/cer_v2_redesign_lessons.md`; handoff `docs/cer_redesign_handoff.md`.
- 2026-10-31 (Exhibits tab build, SkyRowanberry): the Exhibits tab's Review queue on the drawn card (`exhibits.js`, `kb/_build_exhibits_review.py`), `exhibit_title_students()` (reviewer-only, k=10), lessons in `docs/cer_v2_redesign_lessons.md`; handoff `docs/cer_redesign_handoff.md`.
- 2026-10-31 (CER redesign build, SkyGooseberry): Open Asks Sheet 147 answered whole; the high school and ROP rule and the CPL-AI matching in the Program Requirements dialog (#2601); mock-up version 26; KB note `methodology-a-record-level-join-needs-a-word-guard`; handoff `docs/cer_redesign_handoff.md`.
