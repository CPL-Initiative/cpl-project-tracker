---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-11-18
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
| KB notes | 592 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 95 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 105 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 77 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 642 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1517** | |
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
- 2026-11-18 (S683 SkyDipper, Sam's daytime code session, full checkpoint): #3520 (the CER run rebuilds the Side by side views), #3519 (course flags, never deletes), #3513 (rules G and M and their apply), #3515 (exhibits blocker rules 1 and 2), #3517 (Commons plain words, the nightly click-through), #3514 (the reader's page checks); #3516, #3518, #3482 and #3293 parked as issues #3522 to #3525; `scripts/cobix_watch.sh`; the cer-procedures and commons lanes compacted under 20,000 bytes. A daytime section in handoff 683.
- 2026-11-18 (S682 SkyVireo, the CPL Queue routine's 14:12Z firing, light checkpoint): S681's stand-down held; First Light's 77 painting drops in #3511 for Sam's merge, the 13 story photos held on the hero photo rule; the sierra-page-redesign lane compacted under 20,000 bytes. Handoff 683.
- 2026-11-18 (S681 SkyGrebe, the CPL Queue routine's second conductor firing of the night, full checkpoint): the stop rule fired on Chabot's outline load (1,013 objectives filed as SLOs, rolled back); #3507 (the first display build through the bucket path, 18,209 rows), Allan Hancock and Santiago Canyon outlines (2,270 rows), Lassen's five records, all in the wave #3509; #3497's 99-row and #3508's 13-row plans reviewed, not applied; the KB note `methodology-a-self-check-must-see-what-the-rule-writes`. Handoff 682.
- 2026-11-18 (S680 SkyPhoebe, the CPL Queue routine's conductor night for collection only, full checkpoint): #3495 and #3498 (display receipts and old row audit reports out of the tree into the private bucket `cpl-receipts`), #3490 (the repo size guard), #3491 (9 discontinued programs out of the gap census), #3496 (units rules A1, A4, A5, 56 records rescored live), #3497 (75 named gaps), #3502 (no blind paid rereads), #3503 (the Spend line's tags), #3504 (the outcomes wave, 2,452 rows at four colleges); the new repo-size lane; the KB note `methodology-chain-prs-when-every-merge-conflicts-a-generated-file`. Handoff 681.
- 2026-11-18 (S679 SkyKinglet, Sam's session, full checkpoint): #3477 (the left-map apply nightly, Rename and Combine, the combine guard as one choke point), #3478 and #3481 (Sam's three Nov 17 harvest rulings, 243 records rescored live), #3479 (slash-to-and, 80 renames applied by run 44227947795), #3468 (ACE text kept), #3467, #3473, #3474, #3475; four lanes compacted under 20,000 bytes; KB note `methodology-a-guard-must-fail-closed-when-it-cannot-decide`; handoff 680.
- 2026-11-17 (S678 SkyWaxwing, Sam's session, full checkpoint): #3465 (College Data Collection's cost and counts: measured runner and session spend, the Commons spent figure, a daily census at 17:47 UTC, ETA dates that name their days, cost per CRE), #3466 (Exhibits: act on titles that have left MAP from their row), #3469 (CPL Pathways: a course met by its Program Course File id is no catalog addition), #3470 (Commons Clarity units findings); drafts #3467, #3468, #3472, #3473, #3474. KB note `methodology-a-dispatch-only-feed-goes-stale-without-a-sound`. Handoff 679.
- 2026-11-17 (S677 SkyTanager, full checkpoint): #3462 (Chaffey's yield read: reread 13 rows, load kept 191, display build cdd185495ce4; its suspect yield resolved as not found; slice B complete at seven colleges); the self-test miss named, Skyline 38299. Handoff 678.
- 2026-11-17 (S676 SkyPipit, the CPL Queue routine, full checkpoint): #3456 (slice B: six yield colleges read, reread and loaded, display build 71b67268c567, passing +22); the harvest lessons doc compacted to archive 6. Handoff 677.
