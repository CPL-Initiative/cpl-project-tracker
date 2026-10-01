---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-01
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
| KB notes | 505 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 81 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 81 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 51 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 284 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1007** | |
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
- **2026-10-01 (S312 SkyLantern)** — the funding explainer in the Fact Sheet's layout, with Ask Sierra, the tab's FAQ, one statewide box and the average award; the introductions with the average allocation ([#1806](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1806)); Sam answered sheet 14; the "model" sweep ported ([#1807](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1807)); sheet 15; the S221 funding lessons archived; handoff 313.
- **2026-10-01 (S310 SkyTandem)** — My CPL Funding in Sam's words: the language mockup ([#1797](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1797)) and the port, with each institution's three minimum conditions, the demonstrated funding at the $1,000 rule and the Do this next fix ([#1798](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1798)); Sam ruled "model" out of every public surface (the sweep is next); an emergency checkpoint, then the full one; handoff 311.
- **2026-09-30 (S308 SkyBracket + S309 SkyCensus, one session)** — the funding Public view reads as text ([#1788](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1788)); Sierra's catalog timeout fixed with a stored `title_norm` ([#1789](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1789)); the Reporting box's college half on My College ([#1790](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1790)); smoke 7c/7s accept the honest absence ([#1791](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1791), [#1794](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1794)); Sierra's program search reads stored vectors ([#1796](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1796)); sheet 11; two KB notes (a revoke names every role; a stored value does not follow its function); the funding, Sierra and credential chains joined in `session_310_handoff.md`.
- **2026-09-30 (Sierra credit-source checkpoint, beside S305 to S307)** — Sierra reads where credit comes from: each summary figure suppressed on its own students with real statewide totals ([#1777](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1777)), the military/non-military bucket and per-exhibit source tables ([#1779](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1779)), cpl-chat v74 ([#1780](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1780)); a KB note on the floor belonging to each figure; the partition section in the subtraction note; the 2026-09-30 section in the student-detail lessons; handoff 309 (the Sierra lane; the funding chain's 308 landed first).
- **2026-09-30 (S307 SkyGusset checkpoint)** — the Reporting box's reviewer half, `cpl_funding_reports` INSERT-only ([#1782](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1782)); Sam's Public view asks: the published scenario opens, As colleges see it, My CPL Funding at the top by college or district with Save as PDF, the margin audit, the videos' ways back ([#1783](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1783)); the CO style guide as a reference note; open-asks sheets 7 (answered) and 8; KB notes on the style guide and on alignment; handoff 308.
- **2026-09-30 (S306 SkyRivet checkpoint)** — Sam's four asks on the funding surfaces: the drill-in hovers that say how each figure is reached, the frozen College Dashboard header, Refresh everything and its dialog, My College following the model, My CPL Funding beside the table, and Unit sources (military vs non-military, exhibits, recommendations); open-asks sheet 6; a KB note on sticky headers; S306 in the funding lessons; handoff 307.
- **2026-09-30 (S305 SkyLatch checkpoint)** — the Reporting box through Governance (`cpl_funding_reports` in DR-09) and its mockup ([#1773](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1773)); the Scenario 2 narrated draft and the Scenario 2 introduction's model figure ([#1774](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1774)); open-asks sheet 5; a KB note on hash-checking a copied record; S305 in the funding lessons; handoff 306.
- **2026-09-30 (S304 SkyHinge checkpoint)** — the side menu on one line per item ([#1767](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1767)); 0 hours reads as noncredit ([#1768](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1768)); the My College register in all nine regions, keyed by MAP's names ([#1769](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1769)); card 9's re-mint to ATHL ([#1770](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1770)); card 7's reported cards and the writer's declared create ([#1771](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1771)). Handoff 305.
- **2026-09-29 (S303 SkyWarp checkpoint)** — round 9 of the College Dashboard, the ETHS re-mint of the 43, setup-python 7, decision sheet 4 answered and carried out in part; S303 sections in the funding and engineering lessons; handoff 304.
