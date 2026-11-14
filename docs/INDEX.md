---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-11-14
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
| KB notes | 585 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 95 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 104 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 72 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 612 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **1474** | |
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
- 2026-11-14 (S650 SkyPlover, the CPL Queue routine's 06:12Z firing, full checkpoint): Open Asks Sheet 196 published; #3285 (Exhibits cross-tab reopen), #3286 and #3290 (College Data Collection), #3287 (credential harvest), #3289 (Veteran map UI pass) and #3288 (Cosumnes River's two pinned pages, 136 to 138 passing) merged; the degree electives-fill false pass found and held for the one dry run; Lassen and sdccd started; handoff 651 (SkyDunlin).
- 2026-11-14 (S649 SkyOriole, the light final refresh): Sheet 195 answered and carried out (#3274 the BUSI split delete, #3275 the three CVMA rows, #3250 closed); the Riverside district's 2,536 objective rows loaded (#3265); the conductor's positions on #3237, #3229 and #3111; Sheet 196 owed for the Honors cards
- 2026-11-14 (S649 SkyOriole, conductor, Sam in session; written while the session continued): seven merges (#3260, #3263, #3259, #3269, #3266, #3261, #3262); the Exhibits Review reads saved titles live (held 168 to 0); objectives collected with every SLO read; Cal-GETC applied at Cerro Coso (35) and Cosumnes River (39656 at 34); College Data Collection on Sam's six asks; lanes `cer-procedures` and `commons` compacted under budget; new archives `commons_lessons_archive.md` and `program_requirements_harvest_lessons_archive_5.md`; handoff 650 (SkyPlover).
- 2026-11-13 (S648 SkyTanager, the light refresh, while the session continued): #3248, #3239, #3252 (Grossmont Cal-GETC 34) and #3245 (FIRE M1274 into FIRE 130 X, applied) merged; Glendale loaded, rereads to come; Open Asks Sheet 194 replaces 193 (the BUSI row delete as its own card); handoff 649 rewritten in place; refresh receipt not yet run.
- 2026-11-13 (S648 SkyTanager, conductor, Sam in session; written while the session continued): eight merges (#3227, #3242, #3240, #3243, #3241, #3246, #3244, #3247); College Data Collection on Sam's #3229 words; Cal-GETC 34 by per-college evidence; the issuer tag list; Open Asks Sheet 193; handoff 649.
- 2026-11-13 (S647 SkyPipit, the afternoon, Sam in session): four merges (#3231, #3233, #3232, #3236); the Commons data dashboard complete at `#commons/data` with four views and its first live read; the Exhibits fixes of #3223 and #3228; the `live-counts` environment; Open Asks Sheet 192; handoff 648 refreshed.
- 2026-11-13 (S647 SkyPipit, conductor, two halves of the CPL Queue routine; the first stopped without a handoff): nine merges (#3211, #3214, #3194, #3205, #3218, #3206, #3216, #3207, #3222); Santiago Canyon, Diablo Valley and San Jose City displayed, then the whole build; College of the Desert read in ranges; Glendale's keep rule; the Commons data dashboard live; Open Asks Sheet 190; handoff 648.
- 2026-11-13 (S646 SkyOriole, conductor, the CPL Queue routine): four merges (#3208, #3210, #3212, #3201); the PDF reader merged with a `refused` method and an exact own heading, decision 16(b) reversed; Diablo Valley loaded to 213; Glendale's bot-check page read as a refusal, a slow paid read; the first real daily run after #3180 green; Open Asks Sheet 189; handoff 647.
