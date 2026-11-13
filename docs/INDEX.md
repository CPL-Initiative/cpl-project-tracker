---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-11-13
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
| Doctrine (behavior-shaping) | 6 | [`catalog/doctrine.md`](catalog/doctrine.md) |
| KB notes | 584 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 94 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 103 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 69 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 606 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1462** | |
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
- 2026-11-13 (S644 SkyWren, conductor, Sam's session): five merges (#3188, #3189, #3191, #3190, #3192); the harvest gap census and the wave runner for throughput; Los Angeles City's 22, Santiago Canyon and North Orange Continuing Education loaded; Open Asks Sheet 187 built; handoff 645.
- 2026-11-12 (S643 SkyLark, conductor, Sam's session): eight merges (#3178, #3182, #3180, #3179, #3161, #3184, #3181, #3183); `main` red from a test pinned to a held card, fixed; the daily run rebuilds once on a changed input; First Light's marks tables live; returned titles acknowledged; re-clustering Step 1 by district and reach; full checkpoint; handoff 644.
- 2026-11-12 (S642 SkyKestrel, conductor, Sam's session): six merges (#3157, #3158, #3164, #3162, #3160, #3166); Sierra's 230 ghost rows deleted with a receipt and undo; the Exhibits Review side panel (Course details, related titles changed to the statewide title); the First Light tab, read only; re-clustering Step 1 on #3165; handoff 643; KB note on a ledger at its line.
- 2026-11-12 (S641 SkyOtter, two firings, the CPL Queue routine; the second the conductor): eleven merges (#3146, #3136, #3148, #3147 by the first; #3145, #3135, #3151, #3102, #3150, #3152, #3154 by the second); paid reads for American River and Los Angeles City; ASE plan phase 3 applied; Shasta's 1,549 outcome rows; DSP Version 3 public with a 25px target floor; KB notes on a rebuild running the same build script and on a target at exactly the minimum size; handoff `session_642_handoff.md`.
- 2026-11-12 (S640 SkyHeron, conductor, Sam's session): five merges (#3131, #3137, #3141, #3138, #3142); the first standards plan applied (3 renames, 1 merge); the harvest lane back in the numbered handoff and both lanes under budget; KB note `methodology-a-proof-run-needs-a-same-day-baseline`; full checkpoint; handoff 641.
- 2026-11-12 (S639 SkyQuail, conductor, Sam's session): five merges (#3122, #3123, #3124, #3126, #3127); the credential family live on 25 titles, the 13 saved rows restored, Sheet 181's renames applied; `main` red on two family checks after the apply; lane `cer-procedures` under budget; full checkpoint; handoff 640.
- 2026-11-11 (S638 SkyTamarind, conductor, Sam's session): five merges (#3115, #3109, #3116, #3118, #3119), the subject fill's first live run, conductor mode (`docs/reference/conductor_mode.md`), the cer-procedures lane under its cap; handoff 639.
- 2026-11-11 (S636 SkyAntennae, Sam's session): Butte 87 to 138 of 164 and displayed on the catalog's own GE totals, the reconcile's address guard, a stale-issuer report in the credential review apply, the harvest lane under its budget (#3100); handoff 637.
