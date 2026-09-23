---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-09-23
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
| KB notes | 489 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 79 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 81 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 49 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 256 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **959** | |
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

- **2026-09-23 (S283, SkyFund — Rule 9 checkpoint, second pass)** — Priority 4 carries career attainment ([#1662](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1662)): 0% share, measured in CPL units by the Chancellor's Office from EDD wage records; P2 serves (B) alone; card headers read live titles; a stored order survives a new priority; the Designate button says what it needs. Then Sam's three funding rulings: P4 held at 0% until the first import, the EDD import receiver (`funding/career_attainment_import.json`), and the drill-in consolidated into one Baseline line. KB note: a control that does nothing — read the request log first.
- **2026-09-22 (S283, SkyFund — Rule 9 checkpoint)** — The Implementation Funding tab ready for the CO leadership review ([#1660](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1660)): the Summary leads with the total allocated and ends on local confirmation, a base-and-cap equity bullet, 116 colleges with Calbright, one sources line, house-voice allocation prose, text headers on the explainer. Sam: the CO can measure career attainment from EDD wage data; four decisions on the [funding review sheet](https://claude.ai/artifact/9MfbN6jqio8as9mY4LwPB2). The standing open-asks sheet must not be republished as it stands (replies keyed to 21 cards, builder at 15). KB note updated: `methodology-key-a-side-table-by-the-write-key-not-by-position`. Handoff 284.
- **2026-09-21 (S281)** — Decision sheets rebuilt around Sam's sixteen reversals (proposal as focal point, outcome-named chips, no intro, Complete, opt-out with verdict provenance); `sendToClaude()` measured unable to reach a Claude Code session, so the record is the mechanism; one Jev magic half (`kb/_jev_adjudicate.py`) for CSR, CER and CCRR with an independent second look. Two KB notes added.
- **2026-09-20 (S280, SkyForge — Rule 9 checkpoint)** — Sam's 51 verdicts from the Jev sheet landed in `cr_reference_decisions` (41 fold, 10 keep, 30 rows, receipt in `kb/receipts/`); Jev's gate held 25 of 25 and the numbers under it carried no signal. Sam's decision-sheet rulings (the recommendation as focal point, chips that name the outcome, over-merge by default) in `docs/reference/decision_sheets.md`. The Allow-SQL storm diagnosed from the transcript: the guards load, a hook allow is advisory, one allow rule waits on Sam. KB notes: `reference-system-one-model-fit-by-lane`, `methodology-measure-a-guard-by-the-wait-it-removes`, `methodology-propose-the-decision-and-let-people-pull-it-back`. Handoff 281.
- **2026-09-20 (S279, SkyKeeper)** — TypeSafe/Jev wired and verified end to end; CR Reference trial scored 51 anchored pairs in 10s and shipped a decision sheet for Sam's verdicts. Two KB notes: a typed answer is not a boolean; a curation table that cannot store a reason.
- **2026-09-19 (S278, SkyWarden — Rule 9 checkpoint)** — ⭐ **SkyView is a deliberate PUBLIC read-only surface** ([#1632](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1632)): Sam's goal was *"allow public read only SkyView access but prevent any actions to be taken that would edit or access views where edits could be done"*, and asked to gray the menu items or hide them he chose **hide**. Four views moved behind STAGE — each reaches a staging control, and By discipline / By subject / ESL packaging share ONE workspace shell with ONE mode bar, so they travel together. ⚠️ **Gating the menu alone would have LOOKED right in a screenshot**: the views are also plain URLs, so `GATED_ROUTES` puts the same question on `__ccrRoute()`, the one funnel, and the suite asserts the two lists AGREE. ⛔ **A second curation surface lived in another file and the single-decider guard could not see it** — `ccr_atlas_graph.js`'s `__ccrDecision` has its own `moves[]`, and the suite's *"nothing outside curationRung() decides authorization"* passed throughout **because it only read `ccr_universe.js`**. Also: the band now NAMES the credential (rungs 0 and 1 opened on the same words) and answers the COBI half — one origin, one credential; and the pre-JS banner stopped shipping a COBI link it painted before its own gate could reach it. ⛔ **Then the prompt storm** ([#1633](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1633)): **this repo's `.claude/settings.json` has NEVER loaded in a three-repo session** — Claude Code reads the session's project root, which with three repos attached is their parent (`~/.claude/projects/` held one entry, `-home-user`). Documented behavior, and `~/.claude/settings.json` is not read in cloud sessions at all. ⚠️ **Two inherited premises were wrong**: `permissions.allow` DOES work in auto mode (*"allow, ask, or deny rules resolve immediately"*), and a stale `origin/main` made a working gate look broken — so a third of the guards were unnecessary and were removed on Sam's *"simplify it"*. Auto mode is the classifier, and it was turned on to stop the storm it caused. `roadmap_lane` budget 12,000 → 20,000 on Sam's call (measured: 28/32 fit, the 4 over were current truth, and `stacked_roadmap_cell` is the real guard). Two KB notes.
- **2026-09-19 (S277, SkyCaliper)** — Sierra v73: a sub-region anchors the catalog routes (the San Gabriel Valley false zero), the CNA quick list folds to four real courses, and the comparison table loses its row quota. New note: EXPLAIN ANALYZE's own clock is a cost.
- 2026-09-18 (S276, SkyGauge) — cpl-chat v72: the quick list of typical courses, the flyer, the precedent in the block, "catalog data" instead of COCI; two KB notes; handoff 277.
- **2026-09-18 (S276 parallel, SkyLevel — Rule 9 checkpoint):** SkyView is safe to share and says so. It always wrote nothing (one POST, the Ask, which inserts no row); the page stated that three times in chrome `body.u-solo` hides, so a band under the control row now says it where the curate controls are and links to the CCR tab where curation is actually saved ([#1618](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1618)). ⭐ **Sam's "stops responding on the second or third merge" was a drop exit that returned in SILENCE** — a carried course released on `drag.fromNode`, which for a course picked up from a member square is the whole clustered identity, so a real drag onto the open identity cleared the carry, printed nothing, and left the hint claiming one was still in hand. Gated on travel now; a merged course also queues on its own arc against the parent, labeled *staged, awaiting a curator* ([#1619](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1619)). ⛔ **The band shipped into `prototype/skyview.html`, which is GENERATED** — it passed a browser check, a jsdom suite, review, merge and deploy, and #1617's rebuild stripped it from `main` within the hour. `skyview_invariants.md` already said *"never hand-patch skyview.html"*, and `scripts/check_generated.sh` listed every other generated file and not this one. Both fixed, plus `tests/skyview_built_from_source_test.py`, which names the source file and line. ⚠️ The hit-test mis-pick was MEASURED and left alone: 23 of 24 loners already resolve correctly, 37 of 37 focused member stars resolve to that member. KB note: `methodology-a-generated-file-accepts-your-edit`.
