---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-11-01
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
| Session handoffs | 508 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1332** | |
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
- 2026-11-01 (CPL Queue routine, SkySilverberry S539): Sam's Sheet 151 *vpbs* applied (VP Administrative Services is VPBS; four held rows loaded through a new partial load that marks nobody gone); the contacts harvest's third read, 37 people at 10 colleges (#2641).
- 2026-11-01 (CPL Queue routine, SkyWolfberry S538): the contacts harvest's second read, 12 people for 6 colleges applied with a receipt, and the batch ordered by the last read so empty sites stop leading it (#2640).
- 2026-11-01 (Exhibits tab build, SkyTeaberry): Sam answered Open Asks Sheet 150 (IB fold kept; CLEP fold); CLEP on the AP and IB pattern, brand-family's `clep` lane and the reference fold, 48 CLEP names into 35 with 36 live rows moved (#2633); the CER lane trimmed under its budget.
- 2026-11-01 (Exhibits tab build, SkyInkberry): IB on the AP pattern, brand-family's `ib` lane and the reference fold, 49 IB credentials into 24 with one issuer name (#2632); Open Asks Sheet 150 (the IB fold carried out, CLEP's names held); the CER lane trimmed under its budget.
- 2026-10-31 (side session, SkyCloudberry): the funding requester line (MAP role, landing page, *find title*) and one editable response email signed by the CPL Initiative team (#2619); the Exhibits review card's Back and Accept all (#2620); the landing pages' contacts in the MAP Users tab (#2621); two lane files back under budget, history moved verbatim to their lessons docs.
- 2026-10-31 (Exhibits tab build, SkyElderberry): the Commons' CER row opens Exhibits (#2612); the Credential Catalog's *Worth a faculty review* (#2613); Sam's AP rule in `brand-family`, College Board's official names (#2614); the IT/AI catalog's MAP join needs the issuer (#2615); Open Asks Sheet 149; light checkpoint.
- 2026-10-31 (S535 SkyGooseberry, the CPL Queue routine): Monterey Peninsula 110 to 176 of 197 passing on three reconcile steps (a new `or_units` kind for CourseLeaf "or" rows, the 2026-27 Cal-GETC words, the 60 a floor on "electives, if needed"); display build 598ff64220dd; lessons in `docs/program_requirements_harvest_lessons.md` (S535); handoff 536 for SkySugarberry.
- 2026-10-31 (S534 SkyChokeberry, the CPL Queue routine): Los Angeles Valley 198 to 202 of 215 passing on a new `fill_to` reconcile step (a closing list "for a minimum of N units") and "T otal Minimum Units"; the stopping rule parks the college (`lavc-parked-2026-10-31`); display build d8b6c033cfc6; lessons in `docs/program_requirements_harvest_lessons.md`; handoff `docs/session_535_handoff.md`.
- 2026-10-31 (S533 SkyNannyberry, the CPL Queue routine, finished by the 08:12Z firing): Los Angeles Valley 196 to 198 of 215 passing on the repeat step reading Music's repeatable lists; display build 8603831048ac; lessons in `docs/program_requirements_harvest_lessons.md` (S495-S500 moved to archive 3); handoff `docs/session_534_handoff.md`.
- 2026-10-31 (S532 SkyHackberry, the CPL Queue routine): Los Angeles Valley 186 to 196 of 215 passing on a T & M prefix alias (#2605); the two display applies read back; the UI pass on the Exhibits view; lessons in `docs/program_requirements_harvest_lessons.md`; handoff `docs/session_533_handoff.md`.
