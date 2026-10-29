---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-10-29
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
| KB notes | 564 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 91 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 94 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 63 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 486 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1303** | |
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
- 2026-10-29 (S514 SkyMarionberry, the CPL Queue routine): the Library remediates a workbook (.xlsx): sheet names renamed everywhere they are referenced, alt text on charts drafted from their numbers, tables with no header row, data with no table and merged cells listed (#2548); handoff 515.
- 2026-10-29 (S510 SkyWineberry, the CPL Queue routine): the night's UI pass (Funding model, clean); the Library checks a deck's contrast against the shape its words sit on and offers the nearest passing color (#2543); the funding Refresh comment and splash; handoff 511.
- 2026-10-29 (S509 SkyElderberry, Sam's session): #2537 merged after S508's floor fix; the Library built to mockup Version 20: one card per project (#2538, `cpl_library.project` by receipt), the one *Create or Remediate a Document* panel (#2540), and in-browser remediation of a .pptx or .docx with chart drafts from their numbers and *Draft from the picture* through the new `alt-text-draft` function (#2541); handoff 510.
- 2026-10-29 (S508 SkyGooseberry, Sam's session): #2536 and CPLBrain#525 merged; Malone's twelve funding FAQs as he wrote them (#2537); the funding page loses its footer, opens on the published scenario and keeps one link to the public page; the map.rccd.edu privacy edits and security and accessibility scan for Malone; the Library remediation mockup; handoff 509.
- 2026-10-28 (S507 SkyDewberry, Sam's session): the Summit a11y sweep, 125 of 131 targets passing and the one COBI fault moved on Sam's word (#2534, #2536); the funding FAQ posted as he settled it on Sheets 138 and 139 (#2536); two sessions' Sheet 138s reconciled; handoff 508.
- 2026-10-28 (S506 SkyCloudberry, Sam's session): the funding forms start with the email and acknowledge an allowed address (#2531; the domain gate measured read-only); the Attest word, gray boxes, memo TBA, one curator text section that keeps a deletion; NOCE's nocccd.edu and *Awaiting CPL Initiative Confirmation* (#2533); the FAQ on Open Asks Sheet 138; no handoff file (S507 writes 508).
- 2026-10-28 (S505 SkyBoysenberry, Sam's session): Glendale 45 to 80 passing on its catalog's own words (#2529: prefix aliases and renumbers, the capture reads an aliased prefix, the outcome scorer reads letter-spaced text; display 41c15eee3f75); MAP links open the Non-Military card and read Request Adopt, Sierra deployed (#2530); handoff 507.
- 2026-10-28 (S505 SkyBoysenberry): four orphaned PRs resolved: S450's #2379 ported (#2527: the NC rules fold gone under Scenario 4, his outcome words), the credential watch runs of 10-19 and 10-26 and Credential Engine's top 50 with CTID in one rebuild (#2528); Privacy's UI pass; handoff 506.
- 2026-10-28 (S504 SkyMulberry): the narrated funding film speaks Sam's own script, Draft 7 (#2525: #2323's Draft 6 ported, the period and the Noncredit CPL Lead, the Veteran Star at 64, v13); the Library record at v13 (#2524, two receipts); open side-session PRs in `scheduled_sessions`; handoff 505.
- 2026-10-27 (S503 SkyElderberry): Sierra deployed (run 40573709433; 7v's guard on the negation stripper, #2520); the funding film's recorded piano at 107, v12 and the narrated Draft 5 (#2521, Sheet 137 answered); the funding lane under budget (#2519, #2522); handoff 504.
