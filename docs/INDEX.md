---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-23
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
| KB notes | 563 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 90 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 85 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 62 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 430 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1235** | |
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
- 2026-10-23 (S459 SkyBuckeye): the Library's Made-for build; the meets reading rebuilt and applied; the six older-build rows removed; KB note `methodology-a-measured-count-verifies-a-rebuild`; handoff 460.
- 2026-10-23 (S458 SkyLarkspur): the team phrase lists a Library piece publicly (#2390, applied live); Open Asks Sheet 120 with six cards on visuals made for an entity and the Made-for mock-up; S457's checkpoint merged (#2388); the Coordinator Guide audit started; handoff 459.
- 2026-10-23 (S457 SkyColumbine): the S456 wave and Sierra's ESL certificates landed; the scorer's low-end-meets reading built and held on Open Asks Sheet 119; handoff 458.
- 2026-10-23 (S456 SkyYarrow): Sheet 115 card 1 carried out (17 older-build program records removed with a receipt); Hartnell's Coursedog code-kind gate and Sierra's noncredit section; KB note on a bulk delete's receipt; Open Asks Sheet 117; handoff 457.
- 2026-10-23 S455 SkyMonkeyflower (the CPL Queue routine): Hartnell's course units from its vendor's own course data (59 of 96 pass), Sierra's IT Cybersecurity read through `with_acronyms`, display build b0a96907bf83 (#2376); lessons S455; handoff 456.
- 2026-10-23 S452 SkyPoppy (the CPL Queue routine): Long Beach City loaded, display build 504ae8333118 (#2370); the UI pass on the Funding model page (#2369); free captures at East LA, Marin and San Mateo; lessons S452; handoff 453.
- 2026-10-23 S451 SkyLupine (opened by Sam): the page reader's `cq_view` (#2365); the S449 queue landed, Palo Verde, Cypress, Berkeley City, Hartnell by its Coursedog site (96 of 112, from 73) and Mt. San Antonio, display build 25fe751ccd0a (#2367); lessons S451; handoff 452.
- 2026-10-22 S449 SkyBuckwheat: the harvest queue after S448 (Mt. San Jacinto settled, Berkeley City's codes read through `cq_view`, Palo Verde's new Acalog catalog, Cypress, Hartnell by its site); lessons S449; handoff 450.
- 2026-10-22 (S448 SkyDeergrass, opened by Sam): CPL Pathways' clear, faster list and the COBI header (#2353); My College folded into CPL Pathways, search box and alphabetical list (#2355); My College off the menu, the search redraws on a college change (#2356); handoff 449.
- 2026-10-22 (S447 SkyBrittlebush, opened by Sam): Sheet 112 answered, later (#2348); an Administration of Justice address and a hyphenated course code (#2349); Mt. San Jacinto and Santa Barbara City reread, build be2635ed5b73 (#2350); the harvest lessons' S399-S403 to archive 3; handoff 448.
