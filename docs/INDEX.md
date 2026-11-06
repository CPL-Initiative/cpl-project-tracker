---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-11-06
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
| KB notes | 574 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 94 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 98 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 66 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 554 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1392** | |
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
- 2026-11-06 S589 SkyStephan (CPL Queue routine, 08:12Z): security step 2 merged and read back (#2822; the migration had applied at 06:30Z); COBIx told on #2816; SLOs: Mission's full read pushed (#2800), Lake Tahoe's trial opened (#2833); light checkpoint; handoff 590.
- 2026-11-06 SkyHandspring (Library side session): ELL IET Version 5 links the public overview and takes the library look; public cards date the newest version (`cpl_library_public` revised_on, applied live, #2828); CPL Pathways joins the new look (#2829); the CPL Opportunity visual becomes cards over one course list with a side panel and Request Adopt (#2830); light checkpoint; `docs/library_handoff.md`.
- 2026-11-05 S586 SkyMessier continued (Sam's side session for COBIx): step 1 verified end to end (worker pasted, both secrets rotated, proof runs 686 and 688); COBIx's identity recorded (#2820); step 2's migration drafted, not applied (#2822); light checkpoint at the context WARN; handoff 587.
- 2026-11-05 S585 SkyMessier (Sam's side session for COBIx): COBIx round 1 answered (#2816), the COBIx PR loop and `cobix-review.yml` stub (#2817), security step 1: the worker and the refresh button take a reviewer sign-in or the team phrase, no trigger secret in the page (#2818); light checkpoint; handoff 586.
- 2026-11-05 S584 SkyMinkowski (scheduled firing, 14:12Z): course objectives read and stored beside the SLOs (`course_outcomes.kind`, applied live, #2808); Monterey Peninsula's page read (#2809); light checkpoint; handoff 585.
- 2026-11-05 S581 SkyMeathook (scheduled firing, 10:12Z): start checks only, the queue empty until Mission's full read on 2026-11-06 UTC; light checkpoint; handoff 582.
- 2026-11-05 S577 SkyKumquat and SkyBarnard (Sam's session, both queues): the Subjects List recode, eleven Common SUBJ codes onto 2,389 M-IDs (#2790), `kb_curation` re-keyed and read back; the S573 cert-link PR merged (#2763); the Library revises a public visual from its card, no session (#2791, #2792); full checkpoint; handoff 578.
- 2026-11-05 S576 SkyMice (Sam's session): two Claude Team accounts (MAP team, CO Academic Affairs pilot) with the kit and runbook in CPLBrain (#662, #664); Our Process *Getting set up* (#2784, #2786); the Library names a draft's version, sorts by last modified, quiets the project count (#2788); light checkpoint; handoff 577.
- 2026-11-04/05 SkyJujube (Sam's session, the Lists side session): the Subjects List as Sam's workspace (#2778, #2781, #2782, #2783, #2785): saves renew the sign-in, row press edits, Check alignment (Subjects and Exhibits), Colleges beside Courses, Use, *What a Common SUBJ is*, Hide the top and resizable panels on every Commons view; the sync ran; light checkpoint; handoff `docs/cer_redesign_handoff.md`.
- 2026-11-04 SkyJujube (Sam's session, a side session): sign-in lands in the keeper and returns to the view (#2775); the Courses List's panel carries the common course card and its edits (#2776); the context meter reads again (#2777); every COBI view has an address (#2779); light checkpoint; handoff `docs/courses_retirement_handoff.md`.
- 2026-11-04 S573 SkyNeedle (Sam's session): the Commons path mock; every Commons view in Malone's look (#2764); the register of data sources (#2765); the one queue (#2766) and the confidence count (#2767) on the CPL Commons tab; light checkpoint; handoff 575.
- 2026-11-04 S572 SkyBlackEye (CPL Queue routine): merged S571's #2761; the cert link's NWCG and SWRCB families, 12 titles to 4 certs (#2762); light checkpoint; handoff 573.
- 2026-11-04 S571 SkyHoags (CPL Queue routine): merged S570's #2760; the cert link's AWS welding and Amazon Web Services families, 10 titles to 6 certs (#2761); light checkpoint; handoff 572.
- 2026-11-04 S570 SkyFireworks (CPL Queue routine): the cert link's PMI, ICC, CDPH and EMSA families, 17 titles to 16 certs (#2760); light checkpoint; handoff 571.
