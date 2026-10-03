---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-03
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
| KB notes | 513 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 80 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 81 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 52 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 291 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1022** | |
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
- 2026-10-03 (S319 SkyRudder): KB note `methodology-write-the-rule-as-the-sentence-you-want-said`; handoff 320; Sierra's program course lists deployed (#1832, smoke 7l), 7s's articulation set-aside (#1833), the timing log (#1834); new lane `program-requirements-harvest` with its plan doc; sheet 23.
- 2026-10-02 (S317 SkyCompass, the Sierra narration): KB note `methodology-an-input-read-outside-the-repo-carries-its-text-and-its-gaps`; Scenario 2 narrated by Sierra in ElevenLabs ([#1823](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1823) and the follow-up), `_Draft_3` linked from the explainer; sheet 22 answered.
- 2026-10-02 (S318 SkyKeel): KB note `methodology-a-load-id-should-be-the-content`; handoff 319; Sierra can read each program's own course list (#1826-#1829); sheet 22.
- 2026-10-02 (S317 SkyCompass): KB note `methodology-a-gateway-error-is-not-an-answer`; handoff 318; the MAP Custom Report loader reads back after a 5xx and never re-sends a landed batch or the promotion ([#1824](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1824)); the grants re-check closed.
- 2026-10-02 (S316 SkyTally): KB note `methodology-rebuild-a-jsonb-from-receipts-and-check-its-md5` (+ `scripts/pg_jsonb_md5.py`); handoff 317; sheet 19 executed (the CER fold and Microsoft title; the summed statewide target, film `_v7`, [#1821](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1821)); "FTES reimbursement rate", never price.
- 2026-10-02 (S315 SkyLedger): KB note `methodology-a-verdict-that-reports-an-action-is-checked-in-the-store`; handoff 316; cards 23-24 written; the `top_code` index; the 2.3% gap traced to the maximum award; sheets 18-19 (19 answered: write, sum); the CER decision workflow.
- 2026-10-02 (S314 SkyVerdict): KB note `methodology-a-prompt-that-quotes-the-wrong-sentence-teaches-it`; handoff 315; Sierra v78-v80 and the Dec 30 deadline in the lessons docs.
- **2026-10-02 (S313 SkyReel)** — Sierra v77 names City College of San Francisco (a possessive hid it) ([#1808](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1808)); Sam's two CER renames applied; the video round and the explainer's progress lines, and the rename workflow rebuilds its derived files ([#1809](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1809)); sheet 16; a KB note (a Postgres md5 proves a transcribed jsonb copy); handoff 314.
